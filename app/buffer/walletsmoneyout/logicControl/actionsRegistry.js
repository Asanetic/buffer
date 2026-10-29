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
import { WalletslistSchema } from "../../walletslist/WalletslistSchema";
// </auto-relations:imports>


const WalletsmoneyoutActions = {
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

  // Hand-written (outside the auto-relations markers): the mirror row in the other ledger, matched on link_ref.
  view_walletsmoneyout_account_transaction: async ({ rows, router }) => {
    const row = rows?.[0];
    if (!row?.link_ref) {
      MosyCard('View account transaction', React.createElement('p', { className: 'p-3 mb-0' }, 'This entry has no linked account transaction.'), true, 'modal4');
      return;
    }
    const { default: AccountsmoneyoutList } = await import('../../accountsmoneyout/uiControl/AccountsmoneyoutList');
    const fixedQuery = { linkRef: btoa(row.link_ref) };
    // "View more" link: <entity>_mosyfilter, same format as the related-record popups above.
    const href = `/buffer/accountsmoneyout/list?${new URLSearchParams({ accounts_money_out_mosyfilter: btoa(new URLSearchParams(fixedQuery).toString()) })}`;
    MosyCard('', React.createElement(React.Fragment, null,
      React.createElement(AccountsmoneyoutList, {
        customProfilePath: '../accountsmoneyout/profile',
        title: 'Account transaction',
        fixedQuery,
        hiddenActions: ['new'],
      }),
      React.createElement(ViewAllLink, { href, label: 'View more', onNavigate: router ? (url) => router.push(url) : undefined }),
    ), true, 'modal4', 'mosycard_wide');
  },

  // <auto-relations:actions>
  filter_walletsmoneyout_category: (ctx) => openSmartTagFilter(ctx, {
    title: 'Filter by category',
    columnKey: 'category',
    combine: true,
  }),

  filter_walletsmoneyout_date: (ctx) => openSmartDateFilter(ctx, {
    title: 'Filter by date',
    columnKey: 'date',
    inputType: 'datetime-local',
    combine: true,
  }),

  filter_walletsmoneyout_walletslist: (ctx) => openSmartMapFilter(ctx, {
    title: 'Filter by wallets list',
    searchSchema: WalletslistSchema,
    displayField: 'wallet_name',
    valueField: 'record_id',
    localColumnKey: 'wallet_id',
    combine: true,
  }),

  view_walletsmoneyout_walletslist_profile: async ({ rows, router }) => {
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


export default WalletsmoneyoutActions
