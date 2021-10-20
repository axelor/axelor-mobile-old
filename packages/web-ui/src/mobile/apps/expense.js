export default {
  title: 'app.expense.title',
  icon: 'fa-credit-card',
  active: null,
  color: '#FFC107',
  menu: [
    { name: 'expenses', title: 'app.expense.menu.title', icon: 'fa-credit-card', activeColor: '#31b7ac' },
    // { name: 'add_expense', is_button: true, title: 'app.expense.menu.add', icon: 'fa-plus', activeColor: '#fff', backgroundColor: '#2cc4d3' },
    { name: 'km_expense', title: 'app.expense.menu.km_title', icon: 'fa-taxi', activeColor: '#31b7ac' },
    { name: 'configuration', title: 'app.timesheet.menu.configuration', icon: 'fa-cog', config: false, activeColor: '#86bc25' },
    // { name: 'km_expense', title: 'app.expense.menu.title', icon: 'fa-credit-card', config: false, activeColor: '#86bc25' },
  ],
  configKey: 'isExpenseAppEnable',
  userConfigKey: 'expense',
}
