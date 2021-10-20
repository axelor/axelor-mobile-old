import { connect } from '@axelor/web-client';

const mapExpenseConnectToProps = (props) => {
  const {...expense} = props;
  const api = expense;
  return { expense, api };
}

const expenseModel = {
  name: 'ExpenseLine',
  refs: [
    { model: 'TaskProject', field: 'project'},
    { model: 'ExpenseType', field: 'expenseType'}
  ],
};

const mapKMExpenseConnectToProps = (props) => {
  const {...kmExpense} = props;
  const api = kmExpense;
  return { kmExpense, api };
}

const kmExpenseModel = {
  name: 'KMExpenseLine',
  refs: [
    { model: 'TaskProject', field: 'project'},
    { model: 'ExpenseType', field: 'expenseType'},
    { model: 'KAP', field: 'kilometricAllowParam'},
  ],
};

export const models = [expenseModel, kmExpenseModel];

export const connectExpense = (ExpenseComponent) => connect(mapExpenseConnectToProps)(ExpenseComponent, expenseModel);
export const connectKMExpense = (ExpenseComponent) => connect(mapKMExpenseConnectToProps)(ExpenseComponent, kmExpenseModel);

export default connectExpense;

