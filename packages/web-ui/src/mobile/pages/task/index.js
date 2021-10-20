import TaskList from './Task/list';
import PlanningList from './Planned/TimelineView';
import MonthView from './Planned/MonthView';

const ROUTES = [
  { path: 'tasks', component: TaskList },
  { path: 'planning', component: PlanningList},
  { path: 'monthview', component: MonthView}
];

export default ROUTES;
