
export default {
  title: 'app.timesheet.title',
  icon: 'fa-clock-o',
  active: null,
  color: 'rgb(49, 183, 172)',
  menu: [
    { name: 'timesheets', title: 'app.timesheet.menu.title', icon: 'fa-clock-o', activeColor: '#31b7ac' },
    // { name: 'timesheet_timer', title: 'app.timesheet.menu.timer', icon: 'fa-play', activeColor: '#86bc25' },
    // { name: 'search_timesheets', title: 'app.timesheet.menu.search', icon: 'fa-search', activeColor: '#e4aa3a' },
    // { name: 'add_timesheet', is_button: true, title: 'app.timesheet.menu.add', icon: 'fa-plus', activeColor: '#fff', backgroundColor: '#2cc4d3' },
    { name: 'timesheets_statistics', title: 'app.timesheet.menu.statistics', icon: 'fa-signal', activeColor: '#b4443c' },
    { name: 'configuration', title: 'app.timesheet.menu.configuration', icon: 'fa-cog', config: false, activeColor: '#86bc25' },
  ],
  configKey: 'isTimesheetAppEnable',
  userConfigKey: 'timesheet',
}
