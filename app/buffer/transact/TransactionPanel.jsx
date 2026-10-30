'use client';
import { useCallback, useEffect, useState } from 'react';
import QuickAccessBar from './QuickAccessBar';
import { getApiRoutes } from '../AppRoutes/apiRoutesHandler';
import { mosyGetData, mosyPostData } from '../../MosyUtils/hiveUtils';
import { MosyCard } from '../../components/MosyCard';
import AccountsmoneyinList from '../accountsmoneyin/uiControl/AccountsmoneyinList';
import AccountsmoneyoutList from '../accountsmoneyout/uiControl/AccountsmoneyoutList';
import AccountstransfersList from '../accountstransfers/uiControl/AccountstransfersList';
import WalletsmoneyinList from '../walletsmoneyin/uiControl/WalletsmoneyinList';
import WalletsmoneyoutList from '../walletsmoneyout/uiControl/WalletsmoneyoutList';
import WalletstransfersList from '../walletstransfers/uiControl/WalletstransfersList';

const apiRoutes = getApiRoutes();

// endpoint + owning column per ledger kind (account | wallet) and transaction type
const TARGETS = {
  account: {
    idCol: 'account_id',
    lists: { in: AccountsmoneyinList, out: AccountsmoneyoutList, transfer: AccountstransfersList },
    in: apiRoutes.accountsmoneyin.base,
    out: apiRoutes.accountsmoneyout.base,
    transfer: apiRoutes.accountstransfers.base,
  },
  wallet: {
    idCol: 'wallet_id',
    lists: { in: WalletsmoneyinList, out: WalletsmoneyoutList, transfer: WalletstransfersList },
    in: apiRoutes.walletsmoneyin.base,
    out: apiRoutes.walletsmoneyout.base,
    transfer: apiRoutes.walletstransfers.base,
  },
};

// id === name: the category text is what gets stored on the row.
// These seed the list; every category already saved in the DB is merged in on top (see loadCategories).
const SEED = {
  in: ['Business Income', 'Salary', 'Other Income'],
  out: ['Shopping', 'Bills & Utilities', 'Transport', 'Food', 'Other'],
  transfer: ['Transfer'],
};
const toOptions = (names) => names.map((n) => ({ id: n, name: n }));

export default function TransactionPanel() {
  const [accounts, setAccounts] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState(() => ({
    in: toOptions(SEED.in), out: toOptions(SEED.out), transfer: toOptions(SEED.transfer),
  }));

  // Same DISTINCT lookup groupedSelect fields use (SmartDropdown): groupBy + src = base64 column name.
  // Account and wallet tables are merged so a category typed once is offered everywhere for that type.
  const loadCategories = useCallback(async () => {
    const next = {};
    for (const type of ['in', 'out', 'transfer']) {
      const results = await Promise.all(['account', 'wallet'].map((k) => mosyGetData({
        endpoint: TARGETS[k][type],
        params: { groupBy: btoa('category'), src: btoa('category') },
      }).catch(() => null)));
      const found = results.flatMap((r) => (r?.status === 'success' && Array.isArray(r.data) ? r.data : []))
        .map((row) => String(row?.category ?? '').trim()).filter(Boolean);
      const seen = new Set();
      next[type] = toOptions([...SEED[type], ...found].filter((n) => {
        const key = n.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }));
    }
    setCategories(next);
  }, []);

  const loadAccounts = useCallback(async () => {
    const raw = await mosyGetData({ endpoint: apiRoutes.accountslist.base, params: { pageNo: 1, pageSize: 500 } });
    const rows = Array.isArray(raw?.data) ? raw.data : [];
    setAccounts(rows.map((r) => ({ id: r.record_id, name: r.account_name, balance: Number(r.net_balance) || 0 })));

    const rawW = await mosyGetData({ endpoint: apiRoutes.walletslist.base, params: { pageNo: 1, pageSize: 500 } });
    const wRows = Array.isArray(rawW?.data) ? rawW.data : [];
    setWallets(wRows.map((r) => ({ id: r.record_id, name: r.wallet_name, balance: Number(r.net_balance) || 0 })));
  }, []);

  useEffect(() => {
    loadAccounts().catch((e) => setError(e.message));
    loadCategories();
  }, [loadAccounts, loadCategories]);

  const handleSubmit = async (p) => {
    const target = TARGETS[p.kind === 'wallet' ? 'wallet' : 'account'];
    // Transfer: the route writes the mirror IN row on the destination itself (direction OUT = money leaves the source account/wallet).
    const data = {
      date: p.date,
      amount: p.amount,
      category: p.categoryId,
      ref_no: p.party || '',
      [target.idCol]: p.accountId,
      // Account posting with a wallet: the route also writes the wallet's row and links the two (ledgerLink.js).
      ...(p.kind !== 'wallet' && p.type !== 'transfer' && p.walletId ? { wallet_id: p.walletId } : {}),
      // Money out: the fee is booked as its own "Transaction fee" row on the account and the wallet.
      ...(p.type === 'out' ? { trx_fees: p.fees || 0 } : {}),
      ...(p.type === 'transfer' ? { transfer_to: p.toAccountId, direction: 'OUT' } : {}),
    };
    const res = await mosyPostData({ url: target[p.type], data });
    if (res?.status !== 'success') throw new Error(res?.message || 'Could not save the transaction.');
    await loadAccounts(); // balances changed
    loadCategories(); // pick up a category that was just typed in

    // Show that account's/wallet's rows for this type in a card, so the new entry is visible straight away.
    // Filtered through fixedQuery exactly like the related-records popups in each module's actionsRegistry.
    const List = target.lists[p.type];
    const owner = (p.kind === 'wallet' ? wallets : accounts).find((x) => x.id === p.accountId);
    const label = { in: 'Money In', out: 'Money Out', transfer: 'Transfers' }[p.type];
    const camel = target.idCol.replace(/_([a-z])/g, (_, c) => c.toUpperCase()); // account_id -> accountId (columnDictionary key)
    MosyCard(
      `${label} — ${owner?.name || ''}`,
      <List
        customProfilePath={`../${p.kind === 'wallet' ? 'wallets' : 'accounts'}${p.type === 'in' ? 'moneyin' : p.type === 'out' ? 'moneyout' : 'transfers'}/profile`}
        fixedQuery={{ [camel]: btoa(p.accountId) }}
        hiddenActions={['new']}
      />,
      true,
      'smartmodaldefaultId',
      'mosycard_wide'
    );
  };

  return (
    <>
      {error && <div className="alert alert-danger position-fixed" style={{ bottom: 90, left: 16, zIndex: 1060 }}>{error}</div>}
      <QuickAccessBar accounts={accounts} wallets={wallets} categories={categories} onSubmit={handleSubmit} />
    </>
  );
}
