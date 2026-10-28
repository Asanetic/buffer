'use client';
import { WalletstransfersSchema } from '../WalletstransfersSchema';
import SmartGrid from '../../moduleControl/UiControl/SmartGrid';
import WalletstransfersActions from '../logicControl/actionsRegistry';
import SmartGridClean from '../../moduleControl/UiControl/SmartGridClean';
import GridViewSwitcher from '../../moduleControl/UiControl/GridViewSwitcher';
import ExcelSheetGrid from '../../moduleControl/UiControl/SmartGridSheet';

// Thin wrapper only — all real grid logic lives in components/EntityGrid.jsx
// export default function WalletstransfersList() {
//   return <SmartGrid moduleActions={WalletstransfersActions} schema={WalletstransfersSchema} title="Walletstransfers" />;
// }PaidInvoicesSchema.label
export default function WalletstransfersList({
  fixedQuery = {},
  dataOut = {},
  title = WalletstransfersSchema.label,
  description = `${WalletstransfersSchema.label} list`,
  customProfilePath = './profile',
  moduleActions = WalletstransfersActions,
  schema = WalletstransfersSchema,
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