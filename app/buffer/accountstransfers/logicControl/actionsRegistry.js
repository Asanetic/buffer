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
// </auto-relations:imports>


const AccountstransfersActions = {
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

  // <auto-relations:actions>
  filter_accountstransfers_accountslist: (ctx) => openSmartMapFilter(ctx, {
    title: 'Filter by accounts list',
    searchSchema: AccountslistSchema,
    displayField: 'account_name',
    valueField: 'record_id',
    localColumnKey: 'account_id',
    combine: true,
  }),

  filter_accountstransfers_category: (ctx) => openSmartTagFilter(ctx, {
    title: 'Filter by category',
    columnKey: 'category',
    combine: true,
  }),

  filter_accountstransfers_date: (ctx) => openSmartDateFilter(ctx, {
    title: 'Filter by date',
    columnKey: 'date',
    inputType: 'datetime-local',
    combine: true,
  }),

  filter_accountstransfers_direction: (ctx) => openSmartTagFilter(ctx, {
    title: 'Filter by direction',
    columnKey: 'direction',
    combine: true,
  }),

  view_accountstransfers_accountslist_profile: async ({ rows, router }) => {
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
  // </auto-relations:actions>
};


export default AccountstransfersActions
