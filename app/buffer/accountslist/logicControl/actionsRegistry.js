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

// Hand-written import: kept outside the auto-relations markers so build-relations.js doesn't wipe it.
import TransferToWalletCard from "../uiControl/TransferToWalletCard";

// <auto-relations:imports>
import React from 'react';
import { MosyCard } from "../../../components/MosyCard";
import ViewAllLink from "../../../components/ViewAllLink";
import { openEntityCreateModal, buildPresetFromRow } from "../../moduleControl/UiControl/EntityCreateModal";
import AccountsmoneyinProfile from "../../accountsmoneyin/uiControl/AccountsmoneyinProfile";
import AccountsmoneyoutProfile from "../../accountsmoneyout/uiControl/AccountsmoneyoutProfile";
import AccountstransfersProfile from "../../accountstransfers/uiControl/AccountstransfersProfile";
import { openSmartTagFilter } from "../../moduleControl/UiControl/smartFilterActions";
import { AccountsmoneyinSchema } from "../../accountsmoneyin/AccountsmoneyinSchema";
import { AccountsmoneyoutSchema } from "../../accountsmoneyout/AccountsmoneyoutSchema";
import { AccountstransfersSchema } from "../../accountstransfers/AccountstransfersSchema";
// </auto-relations:imports>


const AccountslistActions = {
  // Bound by gridOptions.checkFunction in schema.js. Fires with every row
  // the user ticked in the grid's checkbox column. Swap the display-name
  // fallback chain for whatever field this module's rows actually have.
  gridCheckBoxAction: async ({ rows }) => {
    const displayName = (row) => row?.title || row?.name || row?.record_id || 'record';
    alert(`${rows.length} record(s) selected: ${rows.map(displayName).join(', ')}`);
  },

  // Add more as needed — see actionRegistryDocs.md for patterns to copy.
  // Every one of them gets whatever's on ctx: { rows, schema, router,
  // refresh, create, update, remove, filter, setFilterValue,
  // setAdvancedQuery, setDateRange, applyFilter, clearFilterValue }.

  // Hand-written (outside the auto-relations markers): allocate part of this account's balance to a wallet.
  transfer_accountslist_to_wallet: ({ rows, refresh }) => {
    const row = rows?.[0];
    if (!row?.record_id) return;
    MosyCard(
      'Transfer to wallet',
      React.createElement(TransferToWalletCard, { account: row, onDone: refresh, modalId: 'modal3' }),
      true,
      'modal3'
    );
  },

  // <auto-relations:actions>
  add_accountslist_accountstransfers: ({ rows, refresh }) => {
    const row = rows?.[0];
    if (!row?.record_id) return;
    const fk = AccountstransfersSchema.fields?.find((f) => f.key === 'account_id');
    openEntityCreateModal({
      ProfileComponent: AccountstransfersProfile,
      schema: AccountstransfersSchema,
      title: `New Accounts transfer — ${row.account_name || row.record_id}`,
      presetValues: {
        ...buildPresetFromRow(row, [
          { sourceKey: 'record_id', destKey: 'account_id', destSchema: AccountstransfersSchema, labelValue: row.account_name },
        ]),
      },
      lockedFields: ['account_id', fk?.labelKey].filter(Boolean), // mapped from the row: not shown, not editable, still saved
      onSaved: refresh,
    });
  },

  filter_accountslist_account_type: (ctx) => openSmartTagFilter(ctx, {
    title: 'Filter by account type',
    columnKey: 'account_type',
    combine: true,
  }),

  view_accountslist_accountsmoneyin: async ({ rows, router }) => {
    const row = rows?.[0];
    if (!row?.record_id) return;
    const { default: AccountsmoneyinList } = await import('../../accountsmoneyin/uiControl/AccountsmoneyinList');
    const fixedQuery = { accountId: btoa(row.record_id) };
    // "View more" link: the list page reads <entity>_mosyfilter through MosySecureFilterEngine
    // (value = base64 of "key=<base64 value>&..."), the same format as multiGridRows links.
    const href = `/buffer/accountsmoneyin/list?${new URLSearchParams({ accounts_money_in_mosyfilter: btoa(new URLSearchParams(fixedQuery).toString()) })}`;
    MosyCard('', React.createElement(React.Fragment, null,
      React.createElement(AccountsmoneyinList, {
        customProfilePath: '../accountsmoneyin/profile',
        title: `Accounts money in — ${row.account_name || row.record_id}`,
        fixedQuery,
        hiddenActions: ['new'],
      }),
      React.createElement(ViewAllLink, { href, label: 'View more', onNavigate: router ? (url) => router.push(url) : undefined }),
    ), true, 'modal4', 'mosycard_wide');
  },

  view_accountslist_accountsmoneyout: async ({ rows, router }) => {
    const row = rows?.[0];
    if (!row?.record_id) return;
    const { default: AccountsmoneyoutList } = await import('../../accountsmoneyout/uiControl/AccountsmoneyoutList');
    const fixedQuery = { accountId: btoa(row.record_id) };
    // "View more" link: the list page reads <entity>_mosyfilter through MosySecureFilterEngine
    // (value = base64 of "key=<base64 value>&..."), the same format as multiGridRows links.
    const href = `/buffer/accountsmoneyout/list?${new URLSearchParams({ accounts_money_out_mosyfilter: btoa(new URLSearchParams(fixedQuery).toString()) })}`;
    MosyCard('', React.createElement(React.Fragment, null,
      React.createElement(AccountsmoneyoutList, {
        customProfilePath: '../accountsmoneyout/profile',
        title: `Accounts money out — ${row.account_name || row.record_id}`,
        fixedQuery,
        hiddenActions: ['new'],
      }),
      React.createElement(ViewAllLink, { href, label: 'View more', onNavigate: router ? (url) => router.push(url) : undefined }),
    ), true, 'modal4', 'mosycard_wide');
  },

  view_accountslist_accountstransfers: async ({ rows, router }) => {
    const row = rows?.[0];
    if (!row?.record_id) return;
    const { default: AccountstransfersList } = await import('../../accountstransfers/uiControl/AccountstransfersList');
    const fixedQuery = { accountId: btoa(row.record_id) };
    // "View more" link: the list page reads <entity>_mosyfilter through MosySecureFilterEngine
    // (value = base64 of "key=<base64 value>&..."), the same format as multiGridRows links.
    const href = `/buffer/accountstransfers/list?${new URLSearchParams({ accounts_transfers_mosyfilter: btoa(new URLSearchParams(fixedQuery).toString()) })}`;
    MosyCard('', React.createElement(React.Fragment, null,
      React.createElement(AccountstransfersList, {
        customProfilePath: '../accountstransfers/profile',
        title: `Accounts transfers — ${row.account_name || row.record_id}`,
        fixedQuery,
        hiddenActions: ['new'],
      }),
      React.createElement(ViewAllLink, { href, label: 'View more', onNavigate: router ? (url) => router.push(url) : undefined }),
    ), true, 'modal4', 'mosycard_wide');
  },
  // </auto-relations:actions>
};


export default AccountslistActions
