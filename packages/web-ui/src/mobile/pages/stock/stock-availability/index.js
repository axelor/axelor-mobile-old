import React, { useEffect, useState } from "react";
import { connect as reduxConnect } from "react-redux";
import connect from "../connect/stock-availability";
import {
  Icon,
  Modal,
  ProgressCircular,
} from "react-onsenui";
import { notification } from "onsenui";

import Translate, { translate } from "../../../locale";
import Page from "../../page";
import { RenderManyToOne } from "../../page-comment-list";
import { scanCode } from "../../../cordova/barcodeScanner";
import "./styles.css";
import barcodeImage from "../../../images/barcode.png";

function InfoView({ title, value, icon }) {
  return (
    <div className="info-box">
      <div className="info-icon-view">
        <Icon icon={icon} className="stock-icon" />
      </div>
      <div className="info-view">
        <span className="info-value">{value}</span>
        <span className="info-title">{translate(`Stock.${title}`)}</span>
      </div>
    </div>
  );
}

function InfoRow(props) {
  return (
    <div className="info-row">
      {props.children}
    </div>
  )
}

function StockAvailability(props) {
  const [product, setProduct] = useState();
  const [company, setCompany] = useState();
  const [stockLocation, setStockLocation] = useState();
  const [enableScanner, setEnableScanner] = useState(false);
  const [stockInfo, setStockInfo] = useState();
  const [loading, setLoading] = useState(false);

  const manyToOneProps = (name, value, label, placeholder) => ({
    edit: true,
    navigator: props.navigator,
    targetName: name,
    displayField: name,
    value,
    fieldLabel: label,
    placeholder: placeholder,
  });

  const handleProductChange = React.useCallback((e) => {
    setProduct(e.target.value);
    fetchStock({_product: e.target.value, _company: company, _stockLocation: stockLocation});
  }, [company, stockLocation, product]);

  const handleCompanyChange = React.useCallback((e) => {
    setCompany(e.target.value);
    fetchStock({_company: e.target.value, _product: product, _stockLocation: stockLocation});
  }, [product, stockLocation]);


  const handleStockLocationChange = React.useCallback((e) => {
    setStockLocation(e.target.value);
    fetchStock({_product: product, _company: company, _stockLocation: e.target.value});
  }, [company, product]);

  const fetchStock = React.useCallback(async ({_product, _company, _stockLocation}) => {
    const { action } = props.api;
    const data = {
      context: {
        _model: "com.axelor.apps.base.db.Product",
        _isFromMenu: true,
        _id: null,
        product: _product,
        company: _company,
        stockLocation: _stockLocation,
        _source: "$company",
      },
    };
    action("action-group-supplychain-update-indicators", data).then((res) => {
      const {data} = res;
      if(data && Array.isArray(data)) {
        if(data[1]) {
          setStockInfo({...data[1].values});
        } else {
          notification.alert("Stock not found", {title: 'Not found'})
        }
      } else {
        notification.alert("Stock not found", {title: 'Not found'})
      }
    });
  }, []);

  const fetchProductFromSerialNumber = React.useCallback((serialNumber) => {
    const noProductMessage = translate("Stock.unreferenced_product");
    if (serialNumber) {
      const { search } = props.api;
      const critera = {
        criteria: [{fieldName: 'serialNumber', operator: '=', value: serialNumber}]
      };
      search({ data: critera }).then((res) => {
        if (res.data && Array.isArray(res.data)) {
          if (res.data.length) {
            handleProductChange({target: { value: {...res.data[0]} }});
          } else {
            notification.alert(noProductMessage, {title: 'Not found'});
          }
        }
        // this.setState({ attachments: res.data });
      });
    } else {
      notification.alert(noProductMessage, { title: "Error" });
    }
  }, []);

  const handleScanCode = () => {
    scanCode().then((res) => {
      if (res.status === 1) {
        // fetchProduct from serial Number
        let serialNumber = res.result.text;
        const format = res.result.format;
        if(format === 'EAN_13') {
          serialNumber = serialNumber.substring(0, 12);
        }
        if(format === 'EAN_8') {
          serialNumber = serialNumber.substring(0, 7);
        }
        console.log({serialNumber});
        fetchProductFromSerialNumber(serialNumber);
      } else if (res.status === 0) {
        notification.alert(res.message, { title: translate("Alert.scanError") });
      }
    });
  };

  useEffect(() => {
    // set active company
    setLoading(true);
    const {user_data} = props;
    const userData = user_data.data || {};
    const userInfo = userData.info;
    if(userInfo && userInfo.active_company) {
      setCompany(userInfo.active_company);
    }
    console.log(props);
    // fetch appbase
    // activateBarCodeGeneration
    const { fetch } = props.api.refs.appbase;
    fetch({ id: 1 }).then((res) => {
      setLoading(false);
      if (res.data && Array.isArray(res.data)) {
        if (res.data[0].activateBarCodeGeneration) {
          setEnableScanner(true);
        } else {
          setEnableScanner(false);
        }
      }
    });
  }, []);

  return (
    <Page
      noBackIcon
      title={
        <div className="center">
          <Translate text="app.stock.menu.availability" />
        </div>
      }
      renderModal={
        loading && (
          <Modal className="auth-modal swiper-view-loader" isOpen={loading}>
            <ProgressCircular indeterminate />
          </Modal>
        )
      }
      {...props}
    >
      <div className="company_info">
        <RenderManyToOne
          name="product"
          searchAPI={(e) => {
            // if (partner && partner.id) {
            //   e.data = { criteria: [{ fieldName: 'mainPartner.id', operator: '=', value: partner.id }] };
            // }
            return props.api.searchAll(e).then((res) => {
              console.log(res);
              return res;
            });
          }}
          onChange={handleProductChange}
          {...manyToOneProps(
            "name",
            product,
            translate("Stock.product"),
            translate("Stock.select_product")
          )}
        />
        {enableScanner && (
          <div className="scanner-view" style={{ padding: 10, width: '100%' }} onClick={handleScanCode}>
            <img alt="barcode-scan" src={barcodeImage} className="barcode-icon" />
          </div>
        )}
      </div>
      <div className="company_info">
        <RenderManyToOne
          name="company"
          searchAPI={(e) => {
            return props.api.refs.company.searchAll(e).then((res) => {
              console.log(res);
              return res;
            });
          }}
          onChange={handleCompanyChange}
          {...manyToOneProps(
            "name",
            company,
            translate("Opportunity.company"),
            translate("select_company")
          )}
        />
        <RenderManyToOne
          name="stockLocation"
          searchAPI={(e) => {
            e.data = {_domain: "self.typeSelect != 3 and self.company = :company", _domainContext: {company}}
            return props.api.refs.stocklocation.searchAll(e).then((res) => {
              console.log(res);
              return res;
            });
          }}
          onChange={handleStockLocationChange}
          {...manyToOneProps(
            "name",
            stockLocation,
            translate("Stock.stockLocation"),
            translate("Stock.select_stockLocation")
          )}
        />
      </div>
      {stockInfo && <div className="product-stock-info-view">
        <InfoRow>
          <InfoView icon="building" title="realQty" value={stockInfo.$realQty} />
          <InfoView icon="building" title="availableQty" value={stockInfo.$availableQty} />
        </InfoRow>
        <InfoRow>
          <InfoView icon="building" title="reservedQty" value={stockInfo.$reservedQty} />
          <InfoView icon="building" title="requestedReservedQty" value={stockInfo.$requestedReservedQty} />
        </InfoRow>
        <InfoRow>
          <InfoView icon="building" title="futureQty" value={stockInfo.$futureQty} />
          <InfoView icon="cogs" title="buildingQty" value={stockInfo.$buildingQty} />
        </InfoRow>
        <InfoRow>
          <InfoView icon="cogs" title="consumeManufOrderQty" value={stockInfo.$consumeManufOrderQty} />
          <InfoView icon="cogs" title="missingManufOrderQty" value={stockInfo.$missingManufOrderQty} />
        </InfoRow>
        <InfoRow>
          <InfoView icon="shopping-cart" title="purchaseOrderQty" value={stockInfo.$purchaseOrderQty} />
          <InfoView icon="shopping-cart" title="saleOrderQty" value={stockInfo.$saleOrderQty} />
        </InfoRow>
      </div>}
    </Page>
  );
}

const mapPropsToState = (state) => {
  return { user_data: state.user, app_state: state.app };
};

export default connect(reduxConnect(mapPropsToState)(StockAvailability));
