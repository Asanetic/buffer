'use client';
import { AccountsmoneyoutSchema } from '../AccountsmoneyoutSchema';
import SmartGrid from '../../moduleControl/UiControl/SmartGrid';
import AccountsmoneyoutActions from '../logicControl/actionsRegistry';
import SmartGridClean from '../../moduleControl/UiControl/SmartGridClean';
import GridViewSwitcher from '../../moduleControl/UiControl/GridViewSwitcher';
import ExcelSheetGrid from '../../moduleControl/UiControl/SmartGridSheet';

// Thin wrapper only — all real grid logic lives in components/EntityGrid.jsx
// export default function AccountsmoneyoutList() {
//   return <SmartGrid moduleActions={AccountsmoneyoutActions} schema={AccountsmoneyoutSchema} title="Accountsmoneyout" />;
// }PaidInvoicesSchema.label
export default function AccountsmoneyoutList({
  fixedQuery = {},
  dataOut = {},
  title = AccountsmoneyoutSchema.label,
  description = `${AccountsmoneyoutSchema.label} list`,
  customProfilePath = './profile',
  moduleActions = AccountsmoneyoutActions,
  schema = AccountsmoneyoutSchema,
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