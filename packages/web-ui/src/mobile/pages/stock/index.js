import StockAvailability from "./stock-availability";
import StockNewTransfer from "./stock-new-transfer";
import StockPickingOrder from "./stock-picking-order";
import StockInventory from "./stock-inventory";

const ROUTES = [
  {
    path: "stock_availability",
    component: StockAvailability,
  },
  {
    path: "stock_new_transfer",
    component: StockNewTransfer,
  },
  {
    path: "stock_picking_order",
    component: StockPickingOrder,
  },
  {
    path: "stock_inventory",
    component: StockInventory,
  },
];

export default ROUTES;
