/**
 * Register real behavior here, once per action key. Both grid rowLinks
 * AND profile-level buttons (schema.profileActions) route through this
 * SAME registry — one place to add new behavior, works everywhere.
 *
 * Every registered function receives ONE ctx object instead of a fixed
 * list of positional args — see actionRegistryDocs.md (same folder) for
 * the full ctx field list and worked examples for every action shape
 * used elsewhere in this app (cross-module popups, preset create forms,
 * quick-edit modals, grid-toolbar smart filters, sending messages, etc).
 * Copy the block that matches what you're building from there.
 *
 * NOTE: "delete" and "clone" are intercepted directly by
 * useEntityFormController before they ever reach this registry — don't
 * register functions under those two keys, they will never fire.
 */

// <auto-relations:imports>
import React from 'react';
import { MosyCard } from "../../../components/MosyCard";
import ViewAllLink from "../../../components/ViewAllLink";
import { openSmartTagFilter } from "../../moduleControl/UiControl/smartFilterActions";
import { openSmartDateFilter } from "../../moduleControl/UiControl/smartFilterActions";
import { openSmartMapFilter } from "../../moduleControl/UiControl/smartFilterActions";
import { AccountslistSchema } from "../../accountslist/AccountslistSchema";
import { WalletslistSchema } from "../../walletslist/WalletslistSchema";
// </auto-relations:imports>
import { mosyPostData } from '../../../MosyUtils/hiveUtils';
import { MosyNotify, closeMosyModal } from '../../../MosyUtils/ActionModals';
import SmsDialog, { SmsBusy } from '../uiControl/SmsDialog';
import { getApiRoutes } from '../../AppRoutes/apiRoutesHandler';

const smsReaderApi = getApiRoutes().smsreader;
const notifyError = (message) => MosyNotify({ message: message || 'Something went wrong.', icon: 'times-circle', iconColor: 'text-danger', duration: 8000 });

// ---- Shared dialog flow: busy -> success | error (with Try again) -----------------------------------------
const CARD = ['smartmodaldefaultId', 'sms-dialog'];
const openCard = (el, dismiss = true) => MosyCard('', el, dismiss, ...CARD);

const showBusy = (title, text) => openCard(React.createElement(SmsBusy, { title, text }), false);

const showSuccess = ({ title, text, note, onDone }) => openCard(React.createElement(SmsDialog, {
  tone: 'success', icon: 'check', title, text, note,
  actions: [{ label: 'Done', icon: 'check', variant: 'success', onClick: () => { closeMosyModal(); onDone && onDone(); } }],
}));

// res = the API's { status:'error', code, source, stage, message, fix, detail } (or anything else that failed)
const showFailure = (res, retry) => openCard(React.createElement(SmsDialog, {
  tone: res?.source === 'ai' ? 'warning' : 'danger',
  icon: 'exclamation-triangle',
  title: res?.message || 'Something went wrong.',
  text: res?.fix || 'Please try again.',
  where: res?.source,
  detail: [res?.code && `Code: ${res.code}`, res?.stage && `Step: ${res.stage}`, res?.detail].filter(Boolean).join(`
`),
  actions: [
    { label: 'Close', variant: 'ghost', onClick: () => closeMosyModal() },
    ...(retry ? [{ label: 'Try again', icon: 'refresh', variant: 'primary', onClick: retry }] : []),
  ],
}));

// POST that never throws: network failures come back in the same shape as API errors.
const postSafe = async (url, data = {}) => {
  try {
    const res = await mosyPostData({ url, data });
    return res && typeof res === 'object' ? res : { status: 'error', code: 'EMPTY', source: 'server', message: 'The server sent back nothing.', fix: 'Try again.' };
  } catch (e) {
    return { status: 'error', code: 'NETWORK', source: 'network', message: 'Could not reach the server.', fix: 'Check your internet connection and try again.', detail: e?.message };
  }
};

const fmtWhen = (d) => { const x = new Date(d); return isNaN(x) ? '' : x.toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }); };
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

const runDeleteMessages = async (includeSynced, refresh) => {
  MosyNotify({ message: 'Deleting transactions...', addTimer: false });
  const res = await mosyPostData({ url: smsReaderApi.deleteall, data: { include_synced: includeSynced } });
  if (res?.status !== 'success') return notifyError(res?.message || 'Could not delete the transactions.');
  MosyNotify({ message: `${res.deleted} transaction(s) deleted.` + (!includeSynced && res.synced_remaining ? `
${res.synced_remaining} synced transaction(s) kept.` : ''), icon: 'check-circle', iconColor: 'text-success' });
  refresh && refresh();
};


const SmartsmsActions = {
  // Bound by gridOptions.checkFunction in schema.js. Fires with every row
  // the user ticked in the grid's checkbox column. Swap the display-name
  // fallback chain for whatever field this module's rows actually have.
  gridCheckBoxAction: async ({ rows }) => {
    const displayName = (row) => row?.title || row?.name || row?.record_id || 'record';
    alert(`${rows.length} record(s) selected: ${rows.map(displayName).join(', ')}`);
  },

  // Asks AI to work out category / account / wallet for names no rule knows. Every answer is saved as a rule, so a name is only ever asked once.
  analyse_transactions: ({ refresh }) => {
    const run = async () => {
      showBusy('Analysing transactions', `Smart analysis is checking for new names.
Please keep this window open.`);
      const res = await postSafe(smsReaderApi.analyse);
      if (res.status !== 'success') return showFailure(res, run);
      showSuccess({
        title: res.analysed ? 'Analysis complete' : 'Nothing new to analyse',
        text: res.analysed
          ? `${res.analysed} new name(s) checked.
${res.saved} saved as rules, ${res.unsure} left for you to decide.
${res.pending} transaction(s) waiting to be synced.`
          : (res.message || 'All names are already known.'),
        note: res.analysed ? { title: 'New words were added under Category Words, Account Words and Wallet Words.', sub: 'They are plain words in those lists, so you can edit or delete them any time.' } : undefined,
        onDone: refresh,
      });
    };
    openCard(React.createElement(SmsDialog, {
      tone: 'primary',
      icon: 'magic',
      title: 'Analyse Transactions',
      text: 'Let AI work out the category, account and wallet for names we do not know yet.',
      note: { title: 'Names we already know are reused, so they cost nothing.', sub: 'Only the name, in/out and amount range are sent. Nothing else is shared.' },
      actions: [
        { label: 'Cancel', variant: 'ghost', onClick: () => closeMosyModal() },
        { label: 'Analyse', icon: 'magic', variant: 'primary', onClick: run },
      ],
    }));
  },

  // Re-runs the smart rules (skip / include / category / account / wallet) over every message not yet synced.
  reapply_rules: ({ refresh }) => {
    const run = async () => {
      showBusy('Re-applying rules', 'Checking your waiting transactions again.');
      const res = await postSafe(smsReaderApi.reapply);
      if (res.status !== 'success') return showFailure(res, run);
      const lines = [`${plural(res.processed, 'transaction', 'transactions')} checked, ${res.changed ?? 0} updated.`];
      if (res.uncategorised) lines.push(`${plural(res.uncategorised, 'transaction still has', 'transactions still have')} no category. Add a keyword for ${res.uncategorised === 1 ? 'it' : 'them'} under Smart Settings.`);
      if (res.skipped) lines.push(`${res.skipped} skipped by your skip keywords.`);
      showSuccess({ title: 'Rules re-applied', text: lines.join('\n'), note: { title: 'Already synced transactions were not changed.', sub: 'To update those, Undo Sync first, then re-apply and sync again.' }, onDone: refresh });
    };
    openCard(React.createElement(SmsDialog, {
      tone: 'primary',
      icon: 'refresh',
      title: 'Re-apply Rules',
      text: 'Check all waiting transactions again using your latest rules?',
      note: { title: 'Transactions that are already synced are not touched.', sub: 'Category, account and wallet are filled again from your latest keywords. Values with no matching keyword are kept.' },
      actions: [
        { label: 'Cancel', variant: 'ghost', onClick: () => closeMosyModal() },
        { label: 'Re-apply', icon: 'refresh', variant: 'primary', onClick: run },
      ],
    }));
  },

  // Posts every ready message into account / wallet money in & out. Each post is signed with a batch id so it can be undone.
  sync_messages: ({ refresh }) => {
    const run = async () => {
      showBusy('Syncing', 'Adding your transactions to account and wallet money in / out.');
      const res = await postSafe(smsReaderApi.sync);
      if (res.status !== 'success') return showFailure(res, run);
      showSuccess({
        title: res.synced ? 'Sync complete' : 'Nothing to sync',
        text: res.synced
          ? `${plural(res.synced, 'transaction', 'transactions')} added to money in / out${res.fees ? `, plus ${plural(res.fees, 'transaction fee', 'transaction fees')}` : ''}.`
          : 'No transactions with a code, amount, date and in/out are waiting.',
        note: res.synced ? { title: 'Made a mistake? Use Undo Sync.', sub: `This sync is saved as ${fmtWhen(new Date())}. Undo removes everything it added in one go.` } : undefined,
        onDone: refresh,
      });
    };
    openCard(React.createElement(SmsDialog, {
      tone: 'success', icon: 'exchange', title: 'Sync Transactions',
      text: 'Add all waiting transactions to account and wallet money in / out?\nNew transactions are also synced automatically when they arrive.',
      note: { title: 'Check the category, account and wallet first.', sub: 'Every sync is stamped with its date and time, so you can undo it later.' },
      actions: [
        { label: 'Cancel', variant: 'ghost', onClick: () => closeMosyModal() },
        { label: 'Sync Now', icon: 'check', variant: 'success', onClick: run },
      ],
    }));
  },

  // Lists recent syncs (by date/time) and reverses the chosen one: money rows deleted, messages back to pending.
  undo_sync: async ({ refresh }) => {
    const undo = async (batch) => {
      showBusy('Undoing sync', 'Removing the entries this sync created.');
      const res = await postSafe(smsReaderApi.undo, { batch });
      if (res.status !== 'success') return showFailure(res, () => undo(batch));
      showSuccess({ title: 'Sync undone', text: `${plural(res.messages, 'transaction is', 'transactions are')} waiting again.\n${plural(res.removed, 'money entry', 'money entries')} removed.`, note: { title: 'Fix your keywords, then Re-apply Rules and Sync Now.', sub: 'Everything is back to waiting so the new rules can be used.' }, onDone: refresh });
    };
    const confirmAll = () => openCard(React.createElement(SmsDialog, {
      tone: 'danger', icon: 'trash', title: 'Undo every sync?',
      text: 'All money in / out entries created from your transactions will be removed.',
      note: { title: 'Your own manual entries are never touched.', sub: 'Every transaction goes back to waiting.' },
      actions: [
        { label: 'Cancel', variant: 'ghost', onClick: () => closeMosyModal() },
        { label: 'Yes, undo all', icon: 'trash', variant: 'danger', onClick: () => undo('all') },
      ],
    }));
    const res = await postSafe(smsReaderApi.undo, { list: true });
    if (res.status !== 'success') return showFailure(res);
    const batches = res.batches || [];
    if (!batches.length) return showSuccess({ title: 'Nothing to undo', text: 'No transactions have been synced yet.' });
    openCard(React.createElement(SmsDialog, {
      tone: 'warning', icon: 'undo', title: 'Undo a Sync',
      text: batches.length > 5 ? 'Pick the sync to reverse (latest 5 shown).' : 'Pick the sync to reverse.',
      note: { title: 'Only entries created by that sync are removed.', sub: 'Your own manual money in / out is never touched.' },
      actions: [
        ...batches.slice(0, 5).map((b) => ({ label: `${fmtWhen(b.synced_on)} · ${plural(b.messages, 'transaction', 'transactions')}`, icon: 'undo', variant: 'warn', onClick: () => undo(b.batch) })),
        { label: 'Undo ALL syncs', icon: 'trash', variant: 'danger', onClick: confirmAll },
        { label: 'Cancel', variant: 'ghost', onClick: () => closeMosyModal() },
      ],
    }));
  },

  // Delete messages: unsynced only, everything (incl. synced), or cancel.
  delete_all_messages: ({ refresh }) => {
    MosyCard('', React.createElement(SmsDialog, {
      tone: 'danger',
      icon: 'trash',
      title: 'Delete Transactions',
      text: 'Which transactions do you want to delete? This cannot be undone.',
      note: { title: 'Deleting synced transactions removes them from this system only.', sub: 'Transactions that have already synced cannot be undone by batch.' },
      actions: [
        { label: 'Cancel', variant: 'ghost', onClick: () => closeMosyModal() },
        { label: 'Delete Unsynced', icon: 'trash', variant: 'warn', onClick: () => runDeleteMessages(false, refresh) },
        { label: 'Delete All', icon: 'trash', variant: 'danger', onClick: () => runDeleteMessages(true, refresh) },
      ],
    }), true, 'smartmodaldefaultId', 'sms-dialog');
  },

  // Add more as needed — see actionRegistryDocs.md for patterns to copy.
  // Every one of them gets whatever's on ctx: { rows, schema, router,
  // refresh, create, update, remove, filter, setFilterValue,
  // setAdvancedQuery, setDateRange, applyFilter, clearFilterValue }.

  // <auto-relations:actions>
  filter_smartsms_accountslist: (ctx) => openSmartMapFilter(ctx, {
    title: 'Filter by accounts list',
    searchSchema: AccountslistSchema,
    displayField: 'account_name',
    valueField: 'record_id',
    localColumnKey: 'account_id',
    combine: true,
  }),

  filter_smartsms_category: (ctx) => openSmartTagFilter(ctx, {
    title: 'Filter by category',
    columnKey: 'category',
    combine: true,
  }),

  filter_smartsms_direction: (ctx) => openSmartTagFilter(ctx, {
    title: 'Filter by direction (in/out)',
    columnKey: 'direction',
    combine: true,
  }),

  filter_smartsms_sms_date: (ctx) => openSmartDateFilter(ctx, {
    title: 'Filter by transaction date',
    columnKey: 'sms_date',
    inputType: 'datetime-local',
    combine: true,
  }),

  filter_smartsms_synced: (ctx) => openSmartTagFilter(ctx, {
    title: 'Filter by synced',
    columnKey: 'synced',
    combine: true,
  }),

  filter_smartsms_synced_on: (ctx) => openSmartDateFilter(ctx, {
    title: 'Filter by synced on',
    columnKey: 'synced_on',
    inputType: 'datetime-local',
    combine: true,
  }),

  filter_smartsms_synced_type: (ctx) => openSmartTagFilter(ctx, {
    title: 'Filter by synced as',
    columnKey: 'synced_type',
    combine: true,
  }),

  filter_smartsms_txn_type: (ctx) => openSmartTagFilter(ctx, {
    title: 'Filter by txn type',
    columnKey: 'txn_type',
    combine: true,
  }),

  filter_smartsms_walletslist: (ctx) => openSmartMapFilter(ctx, {
    title: 'Filter by wallets list',
    searchSchema: WalletslistSchema,
    displayField: 'wallet_name',
    valueField: 'record_id',
    localColumnKey: 'wallet_id',
    combine: true,
  }),

  view_smartsms_accountslist_profile: async ({ rows, router }) => {
    const row = rows?.[0];
    if (!row?.account_id) return;
    const { default: AccountslistList } = await import('../../accountslist/uiControl/AccountslistList');
    const fixedQuery = { recordId: btoa(row.account_id) };
    // "View more" link: the list page reads <entity>_mosyfilter through MosySecureFilterEngine
    // (value = base64 of "key=<base64 value>&..."), the same format as multiGridRows links.
    const href = `/buffer/accountslist/list?${new URLSearchParams({ accounts_list_mosyfilter: btoa(new URLSearchParams(fixedQuery).toString()) })}`;
    MosyCard('', React.createElement(React.Fragment, null,
      React.createElement(AccountslistList, {
        customProfilePath: '../accountslist/profile',
        title: `Accounts list — ${row.account_name || ''}`,
        fixedQuery,
        hiddenActions: ['new'],
      }),
      React.createElement(ViewAllLink, { href, label: 'View more', onNavigate: router ? (url) => router.push(url) : undefined }),
    ), true, 'modal4', 'mosycard_wide');
  },

  view_smartsms_walletslist_profile: async ({ rows, router }) => {
    const row = rows?.[0];
    if (!row?.wallet_id) return;
    const { default: WalletslistList } = await import('../../walletslist/uiControl/WalletslistList');
    const fixedQuery = { recordId: btoa(row.wallet_id) };
    // "View more" link: the list page reads <entity>_mosyfilter through MosySecureFilterEngine
    // (value = base64 of "key=<base64 value>&..."), the same format as multiGridRows links.
    const href = `/buffer/walletslist/list?${new URLSearchParams({ wallets_list_mosyfilter: btoa(new URLSearchParams(fixedQuery).toString()) })}`;
    MosyCard('', React.createElement(React.Fragment, null,
      React.createElement(WalletslistList, {
        customProfilePath: '../walletslist/profile',
        title: `Wallets list — ${row.wallet_name || ''}`,
        fixedQuery,
        hiddenActions: ['new'],
      }),
      React.createElement(ViewAllLink, { href, label: 'View more', onNavigate: router ? (url) => router.push(url) : undefined }),
    ), true, 'modal4', 'mosycard_wide');
  },
  // </auto-relations:actions>
};


export default SmartsmsActions
