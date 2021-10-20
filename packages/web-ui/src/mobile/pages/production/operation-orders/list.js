import React from "react";
import moment from "moment";
import PropTypes from "prop-types";
import { connect as reduxConnect } from "react-redux";
import connect from "./../connect/operation-orders";
import Translate, {translate} from "../../../locale";
import PageListComponent, { Typo } from "../../page-list";
import classNames from "classnames";
import { Icon } from "react-onsenui";
import OperationOrderView from "./view";
import { scanCode } from "../../../cordova/barcodeScanner";
import {notification} from "onsenui";
import {statusSelect} from "./common";
import * as ACTIONS from "../../../redux/actions"
import "./style.css";

class OperationOrderList extends PageListComponent {
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
    const sortingFields = [{key: "manufOrder.manufOrderSeq", title: translate('Production.sortByManufOrderSeq')}, {key: "plannedStartDateT", title: translate("Production.sortByPlannedStartDateT")}];
    this.setState({sortingFields, mOFilterOnStockDetailStatusSelect: appInfo.mOFilterOnStockDetailStatusSelect});
    // const {}
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
      { fieldName: "prodProcessLine.outsourcing", operator: "=", value: false },
      // { fieldName: "manufOrder.typeSelect", operator: "=", value: 1 },
    ];
    if(statusList && statusList.length) {
      criteria.push({ fieldName: 'manufOrder.statusSelect', operator: 'in', value: statusList });
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
        criteria: [{fieldName: 'id', operator: '=', value: id}]
      };
      search({ data: critera }).then((res) => {
        if (res.data && Array.isArray(res.data)) {
          if (res.data.length) {
            // const _data = [...this.state.data, {...res.data}];
            this.viewOperationOrder({...res.data[0]}, false);
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
      if (res.status === 1) {
        // fetchProduct from serial Number
        let serialNumber = res.result.text;
        const id = serialNumber;
        this.fetchOrderFromId(id);
      } else if (res.status === 0) {
        notification.alert(res.message, { title: translate("Alert.scanError") });
      }
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

  viewOperationOrder(record, fromList = true) {
    const { data, manageWorkshop, enableMultiCompany } = this.state;
    const index = data.findIndex((d) => d.id === record.id);
    this.props.navigator.pushPage(
      {
        component: OperationOrderView,
        path: "OperationOrderView",
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
        recordIndex: index,
        manageWorkshop,
        enableMultiCompany,
        ...(fromList && {getRecordsByIndex: (record, isMount) =>
          this.getRecordsByIndex(record, isMount),})
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
        <Typo variant="title"> {item["manufOrder.manufOrderSeq"]}</Typo>
        {item.prodProcessLine && (
          <Typo variant="body row-field">{item.prodProcessLine.name}</Typo>
        )}
        {item["manufOrder.product"] && (
          <Typo variant="body row-field">{item["manufOrder.product"].fullName}</Typo>
        )}
        {item["manufOrder.workshopStockLocation"] && this.state.manageWorkshop && (
          <Typo variant="body row-field">{item["manufOrder.workshopStockLocation"].name}</Typo>
        )}
        {item.workCenter && (<Typo variant="body row-field">
          <i className="fas fa-toolbox work-center-icon" />
          {item.workCenter.name}
        </Typo>)}
        {item.plannedStartDateT && <Typo variant="body row-field">{moment(item.plannedStartDateT).format('DD MMM YYYY HH:mm')}</Typo>}
        <div>
        {item['manufOrder.company'] && this.state.enableMultiCompany && <Typo variant="body row-field row-info-item"> {item['manufOrder.company'] ? item['manufOrder.company'].name : ''} </Typo>}
        {item.machine && <Typo variant="body row-field row-info-item">{item.machine ? item.machine.name : ''}</Typo>}

        </div>
        <div className="tags-view">
          <Typo variant="leave-line-status Draft tags-item"> {item.priority} </Typo>
          <Typo variant="leave-line-status Validated tags-item status-select"> {translate(`Production.status.${statusSelect[item.statusSelect]}`)} </Typo>
        </div>

      </div>
    );
  }

  renderList() {
    return super.renderList({
      style: { marginTop: 45, marginBottom: 50, backgroundImage: "none" },
    });
  }

  renderPageTitle() {
    return (
      <React.Fragment>
        <div className="center center-align-title">
          <Translate text="app.production.menu.operation_orders" />
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

OperationOrderList.propTypes = {
  navigator: PropTypes.any,
  route: PropTypes.any,
};

const mapDispatchToProps = (dispatch, { navigator }) => {
  return {
    disableBackButton: () => dispatch(ACTIONS.disableBackButton()),
  };
}

OperationOrderList = reduxConnect((state) => ({
  app: state.app,
  user_data: state.user.data,
}), mapDispatchToProps)(OperationOrderList);

export default connect(OperationOrderList);
