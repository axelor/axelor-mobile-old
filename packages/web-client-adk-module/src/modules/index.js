import BaseAPI from '../base';
import ContactAPI from './contact';
import LeaveReason from './leave-reason';
import ExpenseType from './expense-type';
import TimesheetActivity from './timesheet-activity';
import TaskProject from './task-project';
import TimesheetLine from './timesheet-line';
import ExpenseLine from './expense-line';
import KMExpenseLine from './km-expense-line';
import LeaveLine from './leave-line';
import KapAPI from './kap';

const MODULES = {
  Contact: ContactAPI,
  KAP: KapAPI,
  LeaveReason,
  ExpenseType,
  TimesheetActivity,
  TimesheetLine,
  ExpenseLine,
  KMExpenseLine,
  LeaveLine,
  TaskProject,
};

export {
  BaseAPI,
  MODULES,
};
