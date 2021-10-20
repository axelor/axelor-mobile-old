import AddExpense from './add';
import ExpenseList from './list';
import KMExpenseList from './kmExpense/list';

const ROUTES = [
  { path: 'expenses', component: ExpenseList },
  { path: 'add_expense', component: AddExpense },
  { path: 'km_expense', component: KMExpenseList },
];

export default ROUTES;
