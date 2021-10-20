import { connect } from "@axelor/web-client";

const mapConnectToProps = (props) => {
  const { ...product } = props;
  const api = product;
  return { product, api };
};

export const model = {
  name: "StockMove",
  refs: [
    { model: "StockLocation", field: "toStockLocation" },
    { model: "Partner", field: "partner" },
    { model: "Company", field: "company" },
    { model: "AppBase" },
    { model: "App" },
    { model: "AppStock"}
  ],
};

export default (StockMoveComponent) =>
  connect(mapConnectToProps)(StockMoveComponent, model);
