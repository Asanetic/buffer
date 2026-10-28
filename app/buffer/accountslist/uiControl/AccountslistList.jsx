'use client';
import { AccountslistSchema } from '../AccountslistSchema';
import SmartGrid from '../../moduleControl/UiControl/SmartGrid';
import AccountslistActions from '../logicControl/actionsRegistry';
import SmartGridClean from '../../moduleControl/UiControl/SmartGridClean';
import GridViewSwitcher from '../../moduleControl/UiControl/GridViewSwitcher';
import ExcelSheetGrid from '../../moduleControl/UiControl/SmartGridSheet';


// Thin wrapper only — all real grid logic lives in components/EntityGrid.jsx
// export default function AccountslistList() {
//   return <SmartGrid moduleActions={AccountslistActions} schema={AccountslistSchema} title="Accountslist" />;
// }PaidInvoicesSchema.label
export default function AccountslistList({
  fixedQuery = {},
  dataOut = {},
  title = AccountslistSchema.label,
  description = `${AccountslistSchema.label} list`,
  customProfilePath = './profile',
  moduleActions = AccountslistActions,
  schema = AccountslistSchema,
  hiddenActions=[],

}) {
  return (
    <GridViewSwitcher
      table={SmartGridClean}
      sheet={ExcelSheetGrid}
      start="table"
      moduleActions={moduleActions}
      schema={schema}
      title={title}
      description={description}
      customProfilePath={customProfilePath}
      fixedQuery={fixedQuery}
      dataOut={dataOut}
      hiddenActions={hiddenActions}
    />
  );
}