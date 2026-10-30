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
import { openEntityCreateModal, buildPresetFromRow } from "../../moduleControl/UiControl/EntityCreateModal";
import WalletsmoneyinProfile from "../../walletsmoneyin/uiControl/WalletsmoneyinProfile";
import WalletsmoneyoutProfile from "../../walletsmoneyout/uiControl/WalletsmoneyoutProfile";
import WalletstransfersProfile from "../../walletstransfers/uiControl/WalletstransfersProfile";
import { openSmartTagFilter } from "../../moduleControl/UiControl/smartFilterActions";
import { WalletsmoneyinSchema } from "../../walletsmoneyin/WalletsmoneyinSchema";
import { WalletsmoneyoutSchema } from "../../walletsmoneyout/WalletsmoneyoutSchema";
import { WalletstransfersSchema } from "../../walletstransfers/WalletstransfersSchema";
// </auto-relations:imports>


const WalletslistActions = {
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
  add_walletslist_walletstransfers: ({ rows, refresh }) => {
    const row = rows?.[0];
    if (!row?.record_id) return;
    const fk = WalletstransfersSchema.fields?.find((f) => f.key === 'wallet_id');
    openEntityCreateModal({
      ProfileComponent: WalletstransfersProfile,
      schema: WalletstransfersSchema,
      title: `New Wallets transfer — ${row.wallet_name || row.record_id}`,
      presetValues: {
        ...buildPresetFromRow(row, [
          { sourceKey: 'record_id', destKey: 'wallet_id', destSchema: WalletstransfersSchema, labelValue: row.wallet_name },
        ]),
      },
      lockedFields: ['wallet_id', fk?.labelKey].filter(Boolean), // mapped from the row: not shown, not editable, still saved
      onSaved: refresh,
    });
  },

  filter_walletslist_wallet_type: (ctx) => openSmartTagFilter(ctx, {
    title: 'Filter by wallet type',
    columnKey: 'wallet_type',
    combine: true,
  }),

  view_walletslist_walletsmoneyin: async ({ rows, router }) => {
    const row = rows?.[0];
    if (!row?.record_id) return;
    const { default: WalletsmoneyinList } = await import('../../walletsmoneyin/uiControl/WalletsmoneyinList');
    const fixedQuery = { walletId: btoa(row.record_id) };
    // "View more" link: the list page reads <entity>_mosyfilter through MosySecureFilterEngine
    // (value = base64 of "key=<base64 value>&..."), the same format as multiGridRows links.
    const href = `/buffer/walletsmoneyin/list?${new URLSearchParams({ wallets_money_in_mosyfilter: btoa(new URLSearchParams(fixedQuery).toString()) })}`;
    MosyCard('', React.createElement(React.Fragment, null,
      React.createElement(WalletsmoneyinList, {
        customProfilePath: '../walletsmoneyin/profile',
        title: `Wallets money in — ${row.wallet_name || row.record_id}`,
        fixedQuery,
        hiddenActions: ['new'],
      }),
      React.createElement(ViewAllLink, { href, label: 'View more', onNavigate: router ? (url) => router.push(url) : undefined }),
    ), true, 'modal4', 'mosycard_wide');
  },

  view_walletslist_walletsmoneyout: async ({ rows, router }) => {
    const row = rows?.[0];
    if (!row?.record_id) return;
    const { default: WalletsmoneyoutList } = await import('../../walletsmoneyout/uiControl/WalletsmoneyoutList');
    const fixedQuery = { walletId: btoa(row.record_id) };
    // "View more" link: the list page reads <entity>_mosyfilter through MosySecureFilterEngine
    // (value = base64 of "key=<base64 value>&..."), the same format as multiGridRows links.
    const href = `/buffer/walletsmoneyout/list?${new URLSearchParams({ wallets_money_out_mosyfilter: btoa(new URLSearchParams(fixedQuery).toString()) })}`;
    MosyCard('', React.createElement(React.Fragment, null,
      React.createElement(WalletsmoneyoutList, {
        customProfilePath: '../walletsmoneyout/profile',
        title: `Wallets money out — ${row.wallet_name || row.record_id}`,
        fixedQuery,
        hiddenActions: ['new'],
      }),
      React.createElement(ViewAllLink, { href, label: 'View more', onNavigate: router ? (url) => router.push(url) : undefined }),
    ), true, 'modal4', 'mosycard_wide');
  },

  view_walletslist_walletstransfers: async ({ rows, router }) => {
    const row = rows?.[0];
    if (!row?.record_id) return;
    const { default: WalletstransfersList } = await import('../../walletstransfers/uiControl/WalletstransfersList');
    const fixedQuery = { walletId: btoa(row.record_id) };
    // "View more" link: the list page reads <entity>_mosyfilter through MosySecureFilterEngine
    // (value = base64 of "key=<base64 value>&..."), the same format as multiGridRows links.
    const href = `/buffer/walletstransfers/list?${new URLSearchParams({ wallets_transfers_mosyfilter: btoa(new URLSearchParams(fixedQuery).toString()) })}`;
    MosyCard('', React.createElement(React.Fragment, null,
      React.createElement(WalletstransfersList, {
        customProfilePath: '../walletstransfers/profile',
        title: `Wallets transfers — ${row.wallet_name || row.record_id}`,
        fixedQuery,
        hiddenActions: ['new'],
      }),
      React.createElement(ViewAllLink, { href, label: 'View more', onNavigate: router ? (url) => router.push(url) : undefined }),
    ), true, 'modal4', 'mosycard_wide');
  },
  // </auto-relations:actions>
};


export default WalletslistActions
