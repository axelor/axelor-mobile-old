export default {
  title: "app.production.title",
  icon: "fa-cubes",
  active: null,
  color: "#B6473F",
  menu: [
    {
      active: null,
      items: [
        {
          name: "operation_orders",
          title: "app.production.menu.operation_orders",
          icon: "fa-cubes",
          activeColor: "#e4aa3a",
        },
        {
          name: "manuf_orders",
          title: "app.production.menu.manuf_orders",
          icon: "fa-cogs",
          activeColor: "#7d3b9b",
        },
      ],
    },
    {
      name: "time_log",
      title: "app.production.menu.timesheet_log",
      icon: "fa-clock-o",
      activeColor: "#31b7ac",
    },
    {
      name: "configuration",
      title: "app.stock.menu.configuration",
      icon: "fa-cog",
      config: false,
      activeColor: "#86bc25",
    },
  ],
  configKey: "isProductionAppEnable",
  userConfigKey: "production",
};
