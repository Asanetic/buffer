// ledgerLink.js — shared by the account/wallet money in & out routes.
// One posting can touch several rows that share a link_ref:
//   - the main row on the account/wallet it was posted to
//   - an account posting with an attached wallet_id also writes the same row on that wallet
//   - a money-out with a transaction fee also writes a separate "Transaction fee" row (on the account and the wallet)
// Deleting any linked row removes them all (cascadeLinked).

import { magicRandomStr, mosySqlInsert, mosySqlDelete } from '../apiUtils/dataControl/dataUtils';
import { mutateInputArray } from './beMonitor';

const FEE_CATEGORY = 'Transaction fee';
const COLS = ['date', 'amount', 'category', 'ref_no'];

const tableFor = (kind, dir) => `${kind}s_money_${dir}`;
const num = (v) => Number(String(v ?? '').replace(/,/g, '')) || 0;

async function insertRow(table, fields, authData) {
  const id = magicRandomStr(7);
  const keys = Object.keys(fields);
  const arr = mutateInputArray(table, Object.fromEntries(keys.map((k) => [k, '?'])), fields, id, authData);
  arr.record_id = id;
  await mosySqlInsert(table, arr, fields);
}

// Call BEFORE the main insert: tags the main row with link_ref when anything will be linked to it.
export function prepareLinked(body, newId, { kind, dir }) {
  const mirrored = kind === 'account' && String(body.wallet_id || '').trim() !== '';
  const fee = dir === 'out' && num(body.trx_fees) > 0;
  if (mirrored || fee) body.link_ref = newId;
  return { mirrored, fee };
}

// Call AFTER the main insert succeeded.
export async function writeLinked(body, { kind, dir }, { mirrored, fee }, authData) {
  if (!mirrored && !fee) return;
  const base = Object.fromEntries(COLS.map((c) => [c, body[c]]));
  const link = { link_ref: body.link_ref };
  const wallet = String(body.wallet_id || '').trim();

  if (mirrored) {
    await insertRow(tableFor('wallet', dir), { ...base, wallet_id: wallet, ...link }, authData);
  }
  if (fee) {
    const feeBase = { ...base, amount: num(body.trx_fees), category: FEE_CATEGORY };
    const own = kind === 'account' ? { account_id: body.account_id, ...(mirrored ? { wallet_id: wallet } : {}) } : { wallet_id: body.wallet_id };
    await insertRow(tableFor(kind, dir), { ...feeBase, ...own, ...link }, authData);
    if (mirrored) await insertRow(tableFor('wallet', dir), { ...feeBase, wallet_id: wallet, ...link }, authData);
  }
}

// Call BEFORE deleting a row: removes every row (account + wallet side) sharing its link_ref.
export async function cascadeLinked(existing, dir, authData) {
  const ref = String(existing?.link_ref || '').replace(/[^A-Za-z0-9_-]/g, '');
  if (!ref) return;
  const site = String(authData?.hive_site_id || '').replace(/'/g, "''");
  const where = `where link_ref='${ref}'${site ? ` and hive_site_id='${site}'` : ''}`;
  await mosySqlDelete(tableFor('account', dir), where);
  await mosySqlDelete(tableFor('wallet', dir), where);
}
