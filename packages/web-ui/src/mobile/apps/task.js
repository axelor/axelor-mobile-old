
export default {
  title: 'app.task.title',
  icon: 'fa-tasks',
  active: null,
  color: '#2185D0',
  menu: [
    { name: 'tasks', title: 'app.task.title', icon: 'fa-tags', activeColor: '#31b7ac' },
    { name: 'planning', title: 'app.planning.title', icon: 'fa-calendar', activeColor: '#31b7ac' },
    { name: 'configuration', title: 'app.sale.menu.configuration', icon: 'fa-cog', config: false, activeColor: '#86bc25' },
  ],
  configKey: 'isTaskAppEnable',
  userConfigKey: 'task',
}
