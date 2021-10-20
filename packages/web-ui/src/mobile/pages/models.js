import { models as TimesheetModels } from './timesheet/connect';
import { models as ExpenseModels } from './expense/connect';
import { models as LeaveModels } from './leave/connect';
import { models as SaleModels } from './sale/connect';
import { models as CrmModels } from './crm/connect';
import { models as TaskModels } from './task/connect'
import { models as QualityModels } from './quality/connect'
export default (
  []
  .concat(TimesheetModels)
  .concat(ExpenseModels)
  .concat(LeaveModels)
  .concat(SaleModels)
  .concat(CrmModels)
  .concat(TaskModels)
  .concat(QualityModels)
);
