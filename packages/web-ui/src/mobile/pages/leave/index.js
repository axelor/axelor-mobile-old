import AddLeave from './view';
import LeaveList from './list';

const ROUTES = [
  { path: 'leaves', component: LeaveList },
  { path: 'add_leave', component: AddLeave },
];

export default ROUTES;
