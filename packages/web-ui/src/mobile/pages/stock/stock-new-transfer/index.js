import React from "react";

import Translate from "../../../locale";
import Page from "../../page";

function StockNewTransfer(props) {
  return (
    <Page
      noBackIcon
      title={
        <div className="center">
          <Translate text="app.stock.menu.new_transfer" />
        </div>
      }
      {...props}
    ></Page>
  );
}

export default StockNewTransfer;
