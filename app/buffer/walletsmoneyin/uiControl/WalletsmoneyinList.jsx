'use client';
import { WalletsmoneyinSchema } from '../WalletsmoneyinSchema';
import SmartGrid from '../../moduleControl/UiControl/SmartGrid';
import WalletsmoneyinActions from '../logicControl/actionsRegistry';
import SmartGridClean from '../../moduleControl/UiControl/SmartGridClean';
import GridViewSwitcher from '../../moduleControl/UiControl/GridViewSwitcher';
import ExcelSheetGrid from '../../moduleControl/UiControl/SmartGridSheet';

// Thin wrapper only — all real grid logic lives in components/EntityGrid.jsx
// export default function WalletsmoneyinList() {
//   return <SmartGrid moduleActions={WalletsmoneyinActions} schema={WalletsmoneyinSchema} title="Walletsmoneyin" />;
// }PaidInvoicesSchema.label
export default function WalletsmoneyinList({
  fixedQuery = {},
  dataOut = {},
  title = WalletsmoneyinSchema.label,
  description = `${WalletsmoneyinSchema.label} list`,
  customProfilePath = './profile',
  moduleActions = WalletsmoneyinActions,
  schema = WalletsmoneyinSchema,
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