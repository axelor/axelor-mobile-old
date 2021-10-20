export const statusSelect = {
  1: "draft",
  2: "planned",
  3: "realized",
  4: "canceled",
};

export const typeSelect = {
  1: "internalMove",
  2: "outgoingMove",
  3: "incomingMove",
};

export const originTypeSelect = {
  "com.axelor.apps.stock.db.Inventory": "Inventory",
  "com.axelor.apps.sale.db.SaleOrder": "SaleOrder",
  "com.axelor.apps.purchase.db.PurchaseOrder": "PurchaseOrder",
  "com.axelor.apps.production.db.ManufOrder": "ManufacturingOrder",
  "com.axelor.apps.production.db.OperationOrder": "OperationOrder",
  "com.axelor.apps.stock.db.StockCorrection": "StockCorrection",
};

export const availableStatusSelect = {
  1: "Available",
  2: "PartiallyAvailable",
  3: "Unavailable",
}
