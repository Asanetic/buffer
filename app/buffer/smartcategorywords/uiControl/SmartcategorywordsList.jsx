'use client';
import { SmartcategorywordsSchema } from '../SmartcategorywordsSchema';
import SmartGrid from '../../moduleControl/UiControl/SmartGrid';
import SmartcategorywordsActions from '../logicControl/actionsRegistry';
import SmartGridClean from '../../moduleControl/UiControl/SmartGridClean';
import GridViewSwitcher from '../../moduleControl/UiControl/GridViewSwitcher';
import ExcelSheetGrid from '../../moduleControl/UiControl/SmartGridSheet';

// Thin wrapper only — all real grid logic lives in components/EntityGrid.jsx
// export default function SmartcategorywordsList() {
//   return <SmartGrid moduleActions={SmartcategorywordsActions} schema={SmartcategorywordsSchema} title="Smartcategorywords" />;
// }PaidInvoicesSchema.label
export default function SmartcategorywordsList({
  fixedQuery = {},
  dataOut = {},
  title = SmartcategorywordsSchema.label,
  description = `${SmartcategorywordsSchema.label} (if a transaction contains these keywords it is put in this category )`,
  customProfilePath = './profile',
  moduleActions = SmartcategorywordsActions,
  schema = SmartcategorywordsSchema,
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