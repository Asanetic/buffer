'use client';
import { AccountsmoneyinSchema } from '../AccountsmoneyinSchema';
import SmartGrid from '../../moduleControl/UiControl/SmartGrid';
import AccountsmoneyinActions from '../logicControl/actionsRegistry';
import SmartGridClean from '../../moduleControl/UiControl/SmartGridClean';
import GridViewSwitcher from '../../moduleControl/UiControl/GridViewSwitcher';
import ExcelSheetGrid from '../../moduleControl/UiControl/SmartGridSheet';

// Thin wrapper only — all real grid logic lives in components/EntityGrid.jsx
// export default function AccountsmoneyinList() {
//   return <SmartGrid moduleActions={AccountsmoneyinActions} schema={AccountsmoneyinSchema} title="Accountsmoneyin" />;
// }PaidInvoicesSchema.label
export default function AccountsmoneyinList({
  fixedQuery = {},
  dataOut = {},
  title = AccountsmoneyinSchema.label,
  description = `${AccountsmoneyinSchema.label} list`,
  customProfilePath = './profile',
  moduleActions = AccountsmoneyinActions,
  schema = AccountsmoneyinSchema,
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