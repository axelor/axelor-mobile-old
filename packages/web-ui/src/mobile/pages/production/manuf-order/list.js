import React from "react";
import moment from "moment";
import PropTypes from "prop-types";
import { connect as reduxConnect } from "react-redux";
import connect from "./../connect/manuf-order";
import Translate, {translate} from "../../../locale";
import PageListComponent, { Typo } from "../../page-list";
import { Icon, Toast } from "react-onsenui";
import OperationOrderView from "./view";
import { scanCode } from "../../../cordova/barcodeScanner";
import {notification} from "onsenui";
import {statusSelect, prioritySelect} from "./common";
import { CardView } from "../../../components";
import { downloadFile, openFile } from "../../sale/sales/download";
import * as ACTIONS from "../../../redux/actions"

import "./style.css";

class ManufOrderList extends PageListComponent {
  constructor(props) {
    super(
      props,
      {},
      {
        fetchRelatedFields: {},
        allowSorting: true,
      }
    );
  }
  getAPI() {
    return this.props.api;
  }

  async componentDidMount() {
    const { search } = this.props.api.refs.app;
    const appInfo = await this.props.api.app();
    const sortingFields = [{key: "manufOrderSeq", title: translate('Production.sortByManufOrderSeq')}, {key: "plannedStartDateT", title: translate("Production.sortByPlannedStartDateT")}];
    this.setState({sortingFields, mOFilterOnStockDetailStatusSelect: appInfo.mOFilterOnStockDetailStatusSelect});
    const productionAppdata = {
      criteria: [{ fieldName: "code", operator: "=", value: "production" }],
    };
    const productionAppResult = await search({ data: productionAppdata });
    if (
      productionAppResult.data &&
      Array.isArray(productionAppResult.data) &&
      productionAppResult.data[0]
    ) {
      const productionAppRecordResult = await this.props.api.refs.appproduction.fetch(
        productionAppResult.data[0]
      );
      if (
        productionAppRecordResult &&
        Array.isArray(productionAppRecordResult.data) &&
        productionAppRecordResult.data[0]
      ) {
        const manageWorkshop =
          productionAppRecordResult.data[0].manageWorkshop;
        this.setState({ manageWorkshop });
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

  getFetchOptions(searchOptions = {}) {
    const statusList = this.state.mOFilterOnStockDetailStatusSelect;

    const criteria = [
      { fieldName: "outsourcing", operator: "=", value: false },
      // { fieldName: "typeSelect", operator: "=", value: 1 },
    ];
    if(statusList && statusList.length) {
      criteria.push({ fieldName: "statusSelect", operator: "in", value: statusList});
    }
    searchOptions.search = { fields: criteria, operator: 'and' };
    searchOptions.sortBy = [...this.state.sortBy];
    return super.getFetchOptions(searchOptions, {
      fields: ['manufOrderSeq']
    });
  }

  fetchOrderFromId = (id) => {
    const noProductMessage = translate("Production.unreferenced_product");
    if (id) {
      const { search } = this.props.api;
      const critera = {
        criteria: [{fieldName: 'manufOrderSeq', operator: '=', value: id}]
      };
      search({ data: critera }).then((res) => {
        if (res.data && Array.isArray(res.data)) {
          if (res.data.length) {
            this.viewOperationOrder({...res.data[0]});
            // handleProductChange({target: { value: {...res.data[0]} }});
          } else {
            notification.alert(noProductMessage, {title: 'Not found'});
          }
        }
        // this.setState({ attachments: res.data });
      });
    } else {
      notification.alert(noProductMessage, { title: "Error" });
    }
  }

  scanOperationOrder() {
    this.props.disableBackButton();
    scanCode().then((res) => {
      // this.props.enableBackButton();
      if (res.status === 1) {
        // fetchProduct from serial Number
        let serialNumber = res.result.text;
        this.fetchOrderFromId(serialNumber);
      } else if (res.status === 0) {
        notification.alert(res.message, { title: translate("Alert.scanError") });
      }
    });
  }

  handleManufOrderPdf(e, order) {
    e.stopPropagation();
    const actionName = "action-manuf-order-method-print";
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
        downloadFile(res, name).then(({ nativeURL }) => {
          setTimeout(() => {
            this.setState({ downloadToast: false });
            openFile(nativeURL, "application/pdf");
          }, 1500);
        });
      });
    });
  }

  addOperationOrder() {
    const { data } = this.state;
    this.props.navigator.pushPage(
      {
        component: OperationOrderView,
        path: "LeadView",
        onUpdate: (record) => {
          const target = data.findIndex((d) => d.id === record.id);
          data[target] = { ...record };
          this.setState({ data: [...data] });
        },
        removeRecord: (record) => {
          const targetIndex = data.findIndex((l) => l.id === record.id);
          data.splice(targetIndex, 1);
          this.setState({ data });
        },
        getRecordsByIndex: (record, isMount) =>
          this.getRecordsByIndex(record, isMount),
        onNewUpdate: (record) => this.setState({ data: [record, ...data] }),
      },
      { animation: "none" }
    );
  }

  viewOperationOrder(record) {
    const { data, enableMultiCompany, manageWorkshop } = this.state;
    const index = data.findIndex((d) => d.id === record.id);
    this.props.navigator.pushPage(
      {
        component: OperationOrderView,
        path: "LeadView",
        onUpdate: (record) => {
          const target = data.findIndex((d) => d.id === record.id);
          data[target] = { ...record };
          this.setState({ data: [...data] });
        },
        removeRecord: (record) => {
          const targetIndex = data.findIndex((l) => l.id === record.id);
          data.splice(targetIndex, 1);
          this.setState({ data });
        },
        data: record,
        manageWorkshop,
        enableMultiCompany,
        recordIndex: index,
        getRecordsByIndex: (record, isMount) =>
          this.getRecordsByIndex(record, isMount),
      },
      { animation: "none" }
    );
  }

  onListItemClick(item) {
    return this.viewOperationOrder(item);
  }

  renderRow(item, index) {
    return (
      <div className="operation-order-row">
        <Typo variant="title"> {item.manufOrderSeq}</Typo>
        {item.workshopStockLocation && this.state.manageWorkshop && (
          <Typo variant="body row-field">{item.workshopStockLocation.name}</Typo>
        )}
        {item.product && (
          <Typo variant="body row-field">{item.product.fullName}</Typo>
        )}
        {item.workCenter && (<Typo variant="body row-field">
          <i className="fas fa-toolbox work-center-icon" />
          {item.workCenter.name}
        </Typo>)}
        {item.plannedStartDateT && <Typo variant="body row-field">{moment(item.plannedStartDateT).format('DD MMM YYYY HH:mm')}</Typo>}
        {item.company && this.state.enableMultiCompany && <Typo variant="body row-field row-info-item"> {item.company ? item.company.name : ''} </Typo>}
        {
          item.qty &&
          <div className="tags-view">
            <Typo variant="body tags-item"> {item.qty ? Number(item.qty).toFixed(2) : ''} </Typo>
            <Typo variant="body tags-item"> {item.unit ? item.unit.name : ''} </Typo>
          </div>
        }
        <div className="tags-view">
          <Typo variant={`leave-line-status tags-item prioritySelect-${item.prioritySelect}`}> {translate(`Production.priorityStatus.${prioritySelect[item.prioritySelect]}`)} </Typo>
          <Typo variant="leave-line-status Validated tags-item status-select"> {translate(`Production.status.${statusSelect[item.statusSelect]}`)} </Typo>
          <CardView.ActionItem
            titleClassName="order-action-title"
            iconClassName="print-order-icon"
            className="print-order-container"
            icon="fa-print"
            onClick={(e) => this.handleManufOrderPdf(e, item)}
          >
            <Translate text="Production.printManufOrder" />
          </CardView.ActionItem>
        </div>
      </div>
    );
  }

  renderList() {
    return super.renderList({
      style: { marginTop: 45, marginBottom: 50, backgroundImage: "none" },
    });
  }


  renderListSearch() {
    return super.renderListSearch({
      placeholder: translate("app.production.searchByName")
    });
  }

  renderPageTitle() {
    return (
      <React.Fragment>
        <Toast isOpen={Boolean(this.state.downloadToast)}>
          <div className="message">Opening a file, please wait...</div>
        </Toast>
        <div className="center center-align-title">
          <Translate text="app.production.menu.manuf_orders" />
        </div>
        <div className="right icons  list_add_button">
          <div style={{ flex: 1 }} onClick={() => this.scanOperationOrder()}>
            <div
              className="round-icon add-button-icon"
              style={{ margin: "0px auto" }}
            >
              <Icon icon="fa-qrcode" />
            </div>
          </div>
        </div>
      </React.Fragment>
    );
  }
}

ManufOrderList.propTypes = {
  navigator: PropTypes.any,
  route: PropTypes.any,
};


const mapDispatchToProps = (dispatch, { navigator }) => {
  return {
    disableBackButton: () => dispatch(ACTIONS.disableBackButton()),
  };
}

ManufOrderList = reduxConnect((state) => ({
  app: state.app,
  user_data: state.user.data,
}), mapDispatchToProps)(ManufOrderList);

export default connect(ManufOrderList);
