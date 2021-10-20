import AddTimesheet from './view';
import TimesheetList from './list';
import SearchTimesheet from './search';
import TimesheetTimer from './timer';
import TimesheetStatistics from './statistics';

const ROUTES = [
  { path: 'timesheets', component: TimesheetList },
  { path: 'search_timesheets', component: SearchTimesheet },
  { path: 'add_timesheet', component: AddTimesheet },
  { path: 'timesheets_statistics', component: TimesheetStatistics },
  { path: 'timesheet_timer', component: TimesheetTimer },
];

export default ROUTES;
