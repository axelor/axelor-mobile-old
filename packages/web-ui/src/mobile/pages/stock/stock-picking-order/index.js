import React from "react";
import moment from "moment";
import { connect as reduxConnect } from "react-redux";
import { Toast } from "react-onsenui";

import connect from "../connect/stock-picking";
import Translate from "../../../locale";
import PageListTabsComponent, { Typo } from "../../page-tabs-list";
import { downloadFile, openFile } from "../../sale/sales/download";
import { CardView } from "../../../components";
import './style.css';

class StockPickingOrder extends PageListTabsComponent {
  constructor(props) {
    super(
      props,
      { filter: 1 },
      {
        // fetchRelatedFields: { lead: ['firstName', 'name', 'company', 'companyName'] },
      }
    );
  }

  async componentDidMount() {
    const { search } = this.props.api.refs.app;
    const data = {
      criteria: [{ fieldName: "code", operator: "=", value: "stock" }],
    };
    const stockAppResult = await search({ data });
    if (
      stockAppResult.data &&
      Array.isArray(stockAppResult.data) &&
      stockAppResult.data[0]
    ) {
      const stockAppRecordResult = await this.props.api.refs.appstock.fetch(
        stockAppResult.data[0]
      );
      if (
        stockAppRecordResult &&
        Array.isArray(stockAppRecordResult.data) &&
        stockAppRecordResult.data[0]
      ) {
        const isSeparateShipmentOperations =
          stockAppRecordResult.data[0].isSeparateShipmentOperations;
        this.setState({ isSeparateShipmentOperations });
      }
    }
    const { appbase } = this.props.api.refs;
    appbase.fetch({ id: 1 }).then((res) => {
      if (res.data && Array.isArray(res.data)) {
        const { enableMultiCompany } = res.data[0];
        if (enableMultiCompany) {
          this.setState({ enableMultiCompany });
        }
      }
    });
    this.fetchData();
  }

  getAPI() {
    return this.props.api;
  }

  getFetchFilterOptions(filter) {
    const fields = [
      { fieldName: "typeSelect", value: filter, operator: "=" },
      { fieldName: "isReversion", value: false, operator: "=" },
      { fieldName: "statusSelect", value: 2, operator: "=" },
    ];

    // add availabilityRequest only for typeSelect 2 i.e. outgoing moves
    if (filter === 2 && Boolean(this.state.isSeparateShipmentOperations)) {
      fields.push({
        fieldName: "availabilityRequest",
        value: true,
        operator: "=",
      });
    }
    return {
      fields,
      operator: "and",
    };
  }

  getFetchSearchOptions(keyword) {
    const searchCriteria = {
      fields: [
        { fieldName: "toAddressStr", value: keyword, operator: "like" },
        { fieldName: "partner.fullName", value: keyword, operator: "like" },

      ],
      operator: "or",
    };
    return searchCriteria;
  }

  // overall filter, you can used to customize limit, sortBy, offset etc
  getFetchOptions(searchOptions) {
    return super.getFetchOptions({
      ...searchOptions,
      // sortBy: ['start_date_time'],
    });
  }

  handleStockMovePdf(order) {
    const actionName = "action-print-stock-move";
    this.onViewPDF(order, actionName);
  }

  handlePickStockPdf(order) {
    const actionName = "action-print-picking-stock-move";
    this.onViewPDF(order, actionName);
  }

  onViewPDF(order, actionName) {
    const { action, wsFilesURL } = this.props.api;
    const data = {
      context: {
        ...order,
      },
    };
    this.setState({ downloadToast: true });
    action(actionName, data).then((d) => {
      wsFilesURL(d.data[0].view.views[0].name).then((res) => {
        var url_string = res;
        var url = new URL(url_string);
        var name = url.searchParams.get("name");
        console.log({ res, name });
        downloadFile(res, name).then(({ nativeURL }) => {
          setTimeout(() => {
            this.setState({ downloadToast: false });
            openFile(nativeURL, "application/pdf");
          }, 1500);
        });
      });
    });
  }

  renderRow(row, index) {
    console.log(row);
    const { enableMultiCompany } = this.state;
    return (
      <div style={{ flex: 1, backgroundColor: row.pickingIsEdited && 'orange' }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <Typo variant="title"> {row.stockMoveSeq} </Typo>
          <Typo variant="title"> {row.origin} </Typo>
        </div>

        {row.estimatedDate && (
          <Typo variant="body">
            {" "}
            {moment(row.estimatedDate).format("DD MMM YYYY")}{" "}
          </Typo>
        )}
        <Typo variant="body"> {row.partner && row.partner.full_name} </Typo>
        {enableMultiCompany && (
          <Typo variant="body"> {row.company && row.company.name} </Typo>
        )}
        <Typo variant="body"> {row.toAddressStr} </Typo>
        {row.fromStockLocation && (
          <Typo variant="body">
            {" "}
            <i className="fa fa-map-marker" /> {row.fromStockLocation.name}{" "}
          </Typo>
        )}
        <div className="stock-pick-action-view">
          <CardView.ActionItem
            titleClassName="stock-pick-action-title"
            iconClassName="stock-pick-action-icon"
            className="stock-pick-action"
            icon="fa-print"
            onClick={() => this.handleStockMovePdf(row)}
          >
            <Translate text="Stock.printStockMove" />
          </CardView.ActionItem>
          <CardView.ActionItem
            titleClassName="stock-pick-action-title"
            iconClassName="stock-pick-action-icon"
            className="stock-pick-action"
            icon="fa-print"
            onClick={() => this.handlePickStockPdf(row)}
          >
            <Translate text="Stock.printPickOrder" />
          </CardView.ActionItem>
        </div>
      </div>
    );
  }

  getListTabsData() {
    return [
      { text: <Translate text={"Stock.stock_move_internal"} />, value: 1 },
      { text: <Translate text={"Stock.stock_move_outgoing"} />, value: 2 },
    ];
  }

  renderPageTitle() {
    return (
      <React.Fragment>
        <div className="center center-align-title">
          <Translate text="app.stock.menu.picking_order" />
        </div>
        <Toast isOpen={Boolean(this.state.downloadToast)}>
          <div className="message">Opening a file, please wait...</div>
        </Toast>
      </React.Fragment>
    );
  }
}

const mapPropsToState = (state) => {
  return { user_data: state.user, app_state: state.app };
};

export default connect(reduxConnect(mapPropsToState)(StockPickingOrder));
