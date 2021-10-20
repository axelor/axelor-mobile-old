import HomePage from './home';
import LoginPage from './login';
import NotFound from './no-found';
import Configuration from './config';
import CRM_PAGES from './crm';
import SALE_PAGES from './sale';
import TIMESHEET_PAGES from './timesheet';
import LEAVE_PAGES from './leave';
import EXPENSE_PAGES from './expense';
import TASK_PAGES from './task';
import QUALITY_PAGES from './quality';
import STOCK_PAGES from './stock';
import PRODUCTION_PAGES from './production';

const ROUTES = [
  { path: 'Home', component: HomePage },
  { path: 'NotFound', component: NotFound },
  { path: 'Login', component: LoginPage },
  { path: 'configuration', component: Configuration },
]
.concat(CRM_PAGES)
.concat(SALE_PAGES)
.concat(TIMESHEET_PAGES)
.concat(LEAVE_PAGES)
.concat(EXPENSE_PAGES)
.concat(TASK_PAGES)
.concat(QUALITY_PAGES)
.concat(STOCK_PAGES)
.concat(PRODUCTION_PAGES);

export default ROUTES;
