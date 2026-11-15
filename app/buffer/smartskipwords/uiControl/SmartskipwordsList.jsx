'use client';
import { SmartskipwordsSchema } from '../SmartskipwordsSchema';
import SmartGrid from '../../moduleControl/UiControl/SmartGrid';
import SmartskipwordsActions from '../logicControl/actionsRegistry';
import SmartGridClean from '../../moduleControl/UiControl/SmartGridClean';
import GridViewSwitcher from '../../moduleControl/UiControl/GridViewSwitcher';
import ExcelSheetGrid from '../../moduleControl/UiControl/SmartGridSheet';

// Thin wrapper only — all real grid logic lives in components/EntityGrid.jsx
// export default function SmartskipwordsList() {
//   return <SmartGrid moduleActions={SmartskipwordsActions} schema={SmartskipwordsSchema} title="Smartskipwords" />;
// }PaidInvoicesSchema.label
export default function SmartskipwordsList({
  fixedQuery = {},
  dataOut = {},
  title = SmartskipwordsSchema.label,
  description = `${SmartskipwordsSchema.label} (if a transaction contains any of these keywords it is ignored and not synced as a transaction)`,
  customProfilePath = './profile',
  moduleActions = SmartskipwordsActions,
  schema = SmartskipwordsSchema,
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