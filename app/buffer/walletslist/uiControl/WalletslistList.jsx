'use client';
import { WalletslistSchema } from '../WalletslistSchema';
import SmartGrid from '../../moduleControl/UiControl/SmartGrid';
import WalletslistActions from '../logicControl/actionsRegistry';
import SmartGridClean from '../../moduleControl/UiControl/SmartGridClean';
import GridViewSwitcher from '../../moduleControl/UiControl/GridViewSwitcher';
import ExcelSheetGrid from '../../moduleControl/UiControl/SmartGridSheet';


// Thin wrapper only — all real grid logic lives in components/EntityGrid.jsx
// export default function WalletslistList() {
//   return <SmartGrid moduleActions={WalletslistActions} schema={WalletslistSchema} title="Walletslist" />;
// }PaidInvoicesSchema.label
export default function WalletslistList({
  fixedQuery = {},
  dataOut = {},
  title = WalletslistSchema.label,
  description = `${WalletslistSchema.label} list`,
  customProfilePath = './profile',
  moduleActions = WalletslistActions,
  schema = WalletslistSchema,
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