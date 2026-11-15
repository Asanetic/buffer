'use client';
import { SmartsmsSchema } from '../SmartsmsSchema';
import SmartGrid from '../../moduleControl/UiControl/SmartGrid';
import SmartsmsActions from '../logicControl/actionsRegistry';
import SmartGridClean from '../../moduleControl/UiControl/SmartGridClean';
import GridViewSwitcher from '../../moduleControl/UiControl/GridViewSwitcher';
import ExcelSheetGrid from '../../moduleControl/UiControl/SmartGridSheet';

// Thin wrapper only — all real grid logic lives in components/EntityGrid.jsx
// export default function SmartsmsList() {
//   return <SmartGrid moduleActions={SmartsmsActions} schema={SmartsmsSchema} title="Smartsms" />;
// }PaidInvoicesSchema.label
export default function SmartsmsList({
  fixedQuery = {},
  dataOut = {},
  title = SmartsmsSchema.label,
  description = `${SmartsmsSchema.label} (smart analysis finds your transactions; check the account, wallet and category, then Sync Now to post them)`,
  customProfilePath = './profile',
  moduleActions = SmartsmsActions,
  schema = SmartsmsSchema,
  hiddenActions=['new', 'import'],

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