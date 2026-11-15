'use client';
import { SmartaccountwordsSchema } from '../SmartaccountwordsSchema';
import SmartGrid from '../../moduleControl/UiControl/SmartGrid';
import SmartaccountwordsActions from '../logicControl/actionsRegistry';
import SmartGridClean from '../../moduleControl/UiControl/SmartGridClean';
import GridViewSwitcher from '../../moduleControl/UiControl/GridViewSwitcher';
import ExcelSheetGrid from '../../moduleControl/UiControl/SmartGridSheet';

// Thin wrapper only — all real grid logic lives in components/EntityGrid.jsx
// export default function SmartaccountwordsList() {
//   return <SmartGrid moduleActions={SmartaccountwordsActions} schema={SmartaccountwordsSchema} title="Smartaccountwords" />;
// }PaidInvoicesSchema.label
export default function SmartaccountwordsList({
  fixedQuery = {},
  dataOut = {},
  title = SmartaccountwordsSchema.label,
  description = `${SmartaccountwordsSchema.label} (if a transaction contains these keywords it is posted to the chosen account)`,
  customProfilePath = './profile',
  moduleActions = SmartaccountwordsActions,
  schema = SmartaccountwordsSchema,
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