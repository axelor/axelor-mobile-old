
export default {
  title: 'app.leave.title',
  icon: 'fa-plane',
  active: null,
  color: '#FF5722',
  menu: [
    { name: 'leaves', title: 'app.leave.menu.title', icon: 'fa-plane', activeColor: '#31b7ac' },
    // { name: 'add_leave', is_button: true, title: 'app.leave.menu.add', icon: 'fa-plus', activeColor: '#fff', backgroundColor: '#2cc4d3' },
    { name: 'configuration', title: 'app.leave.menu.configuration', icon: 'fa-cog', config: false, activeColor: '#86bc25' },
  ],
  configKey: 'isLeaveAppEnable',
  userConfigKey: 'leave',
}
