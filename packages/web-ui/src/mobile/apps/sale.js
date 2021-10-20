
export default {
  title: 'app.sale.title',
  icon: 'fa-sitemap',
  active: null,
  color: '#804199',
  menu: [
    {
      active: 0,
      items: [
        { name: 'sale_customers', title: 'app.sale.menu.customers', icon: 'fa-users', activeColor: '#e4aa3a' },
        { name: 'sale_contacts', title: 'app.sale.menu.contacts', icon: 'fa-vcard-o', activeColor: '#e4aa3a' },
      ],
    },
    {
      active: 0,
      items: [
        { name: 'sale_quotations', title: 'app.sale.menu.quotations', icon: 'fa-line-chart', activeColor: '#7d3b9b' },
        { name: 'sale_orders', title: 'app.sale.menu.sale_orders', icon: 'fa-shopping-cart', activeColor: '#7d3b9b' },
      ],
    },
    { name: 'sale_products', title: 'app.sale.menu.products', icon: 'fa-shopping-basket', activeColor: '#2187d4' },
    { name: 'configuration', title: 'app.sale.menu.configuration', icon: 'fa-cog', config: false, activeColor: '#86bc25' },
  ],
  configKey: 'isSaleAppEnable',
  userConfigKey: 'sale',
};
