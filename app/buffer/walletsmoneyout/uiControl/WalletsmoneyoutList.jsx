'use client';
import { WalletsmoneyoutSchema } from '../WalletsmoneyoutSchema';
import SmartGrid from '../../moduleControl/UiControl/SmartGrid';
import WalletsmoneyoutActions from '../logicControl/actionsRegistry';
import SmartGridClean from '../../moduleControl/UiControl/SmartGridClean';
import GridViewSwitcher from '../../moduleControl/UiControl/GridViewSwitcher';
import ExcelSheetGrid from '../../moduleControl/UiControl/SmartGridSheet';

// Thin wrapper only — all real grid logic lives in components/EntityGrid.jsx
// export default function WalletsmoneyoutList() {
//   return <SmartGrid moduleActions={WalletsmoneyoutActions} schema={WalletsmoneyoutSchema} title="Walletsmoneyout" />;
// }PaidInvoicesSchema.label
export default function WalletsmoneyoutList({
  fixedQuery = {},
  dataOut = {},
  title = WalletsmoneyoutSchema.label,
  description = `${WalletsmoneyoutSchema.label} list`,
  customProfilePath = './profile',
  moduleActions = WalletsmoneyoutActions,
  schema = WalletsmoneyoutSchema,
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