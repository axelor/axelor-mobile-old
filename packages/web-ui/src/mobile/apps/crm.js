export default {
  title: 'app.crm.title',
  icon: 'fa-user-circle',
  active: null,
  color: '#30854E',
  menu: [
    {
      active: null,
      items: [
        { name: 'crm_customers', title: 'app.crm.menu.customers', icon: 'fa-users', activeColor: '#31b7ac' },
        { name: 'crm_contacts', title: 'app.crm.menu.contacts', icon: 'fa-vcard-o', activeColor: '#31b7ac' },
        { name: 'crm_leads', title: 'app.crm.menu.leads', icon: 'fa-user-plus', activeColor: '#31b7ac' },
        { name: 'crm_prospect', title: 'app.crm.menu.prospect', icon: 'fa-users', activeColor: '#31b7ac' },
        { name: 'crm_catalog', title: 'app.crm.menu.catalog', icon: 'fa-users', activeColor: '#31b7ac' },
      ],
    },
    { name: 'crm_events', title: 'app.crm.menu.events', icon: 'fa-bell-o', activeColor: '#e4aa3a' },
    { name: 'crm_opportunity', title: 'app.crm.menu.opportunity', icon: 'fa-handshake-o', activeColor: '#b4443c' },
    { name: 'configuration', title: 'app.crm.menu.configuration', icon: 'fa-cog', config: false, activeColor: '#86bc25' },
  ],
  configKey: 'isCrmAppEnable',
  userConfigKey: 'crm',
  initialRoute: 'crm_events',
};
