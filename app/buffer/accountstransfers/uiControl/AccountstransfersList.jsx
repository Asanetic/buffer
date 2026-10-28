'use client';
import { AccountstransfersSchema } from '../AccountstransfersSchema';
import SmartGrid from '../../moduleControl/UiControl/SmartGrid';
import AccountstransfersActions from '../logicControl/actionsRegistry';
import SmartGridClean from '../../moduleControl/UiControl/SmartGridClean';
import GridViewSwitcher from '../../moduleControl/UiControl/GridViewSwitcher';
import ExcelSheetGrid from '../../moduleControl/UiControl/SmartGridSheet';

// Thin wrapper only — all real grid logic lives in components/EntityGrid.jsx
// export default function AccountstransfersList() {
//   return <SmartGrid moduleActions={AccountstransfersActions} schema={AccountstransfersSchema} title="Accountstransfers" />;
// }PaidInvoicesSchema.label
export default function AccountstransfersList({
  fixedQuery = {},
  dataOut = {},
  title = AccountstransfersSchema.label,
  description = `${AccountstransfersSchema.label} list`,
  customProfilePath = './profile',
  moduleActions = AccountstransfersActions,
  schema = AccountstransfersSchema,
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