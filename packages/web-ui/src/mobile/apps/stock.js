export default {
  title: "app.stock.title",
  icon: "fa-cubes",
  active: null,
  color: "#B6473F",
  menu: [
    {
      name: "stock_availability",
      title: "app.stock.menu.availability",
      icon: "fa-cubes",
      activeColor: "#e4aa3a",
    },
    // currently no page for this menu but needs this menu
    // {
    //   name: "stock_new_transfer",
    //   title: "app.stock.menu.new_transfer",
    //   icon: "fa-chevron-circle-right",
    //   activeColor: "#7d3b9b",
    // },
    {
      active: null,
      items: [
        {
          name: "stock_picking_order",
          title: "app.stock.menu.picking_order",
          icon: "fa-map-signs",
          activeColor: "#2187d4",
        },
        {
          name: "stock_inventory",
          title: "app.stock.menu.inventory",
          icon: "fa-cube",
          activeColor: "#31b7ac",
        },
      ],
    },
    {
      name: "configuration",
      title: "app.stock.menu.configuration",
      icon: "fa-cog",
      config: false,
      activeColor: "#86bc25",
    },
  ],
  configKey: "isStockAppEnable",
  userConfigKey: "Stock",
};
