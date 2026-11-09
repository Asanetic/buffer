'use client';
import { ExpenseplanSchema } from '../ExpenseplanSchema';
import SmartGrid from '../../moduleControl/UiControl/SmartGrid';
import ExpenseplanActions from '../logicControl/actionsRegistry';
import SmartGridClean from '../../moduleControl/UiControl/SmartGridClean';
import GridViewSwitcher from '../../moduleControl/UiControl/GridViewSwitcher';
import ExcelSheetGrid from '../../moduleControl/UiControl/SmartGridSheet';

// Thin wrapper only — all real grid logic lives in components/EntityGrid.jsx
// export default function ExpenseplanList() {
//   return <SmartGrid moduleActions={ExpenseplanActions} schema={ExpenseplanSchema} title="Expenseplan" />;
// }PaidInvoicesSchema.label
export default function ExpenseplanList({
  fixedQuery = {},
  dataOut = {},
  title = ExpenseplanSchema.label,
  description = `${ExpenseplanSchema.label} list`,
  customProfilePath = './profile',
  moduleActions = ExpenseplanActions,
  schema = ExpenseplanSchema,
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