import OperationOrderList from "./operation-orders/list";
import ManufOrderList from "./manuf-order/list";
import TimeLog from "./time-log";

const ROUTES = [
  {
    path: "operation_orders",
    component: OperationOrderList,
  },
  {
    path: "manuf_orders",
    component: ManufOrderList,
  },
  {
    path: "time_log",
    component: TimeLog,
  },
];

export default ROUTES;
