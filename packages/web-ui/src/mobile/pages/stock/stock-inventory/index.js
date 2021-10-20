import React, { useEffect, useState } from "react";
import { connect as reduxConnect } from "react-redux";
import connect from "../connect/stock-inventory";
import {
  Icon,
  Modal,
  ProgressCircular,
  Toolbar,
  ToolbarButton,
} from "react-onsenui";
import { notification } from "onsenui";

import { CardView } from "../../../components";

import Translate, { translate } from "../../../locale";
import Page, { PageElement } from "../../page";
import { RenderManyToOne } from "../../page-comment-list";
import { scanCode } from "../../../cordova/barcodeScanner";
import "./styles.css";
import barcodeImage from "../../../images/barcode.png";
import * as ACTIONS from '../../../redux/actions';

function getGAP(inventoryLine) {
  return inventoryLine.currentQty - inventoryLine.realQty;
}

function StockInventory(props) {
  const [product, setProduct] = useState();
  const [inventory, setInventory] = useState();
  const [company, setCompany] = useState();
  const [stockLocation, setStockLocation] = useState();
  const [enableScanner, setEnableScanner] = useState(false);
  const [inventoryLine, setInventoryLine] = useState();
  const [loading, setLoading] = useState(false);
  const [initialInventoryLine, setInitialInventoryLine] = useState();

  const manyToOneProps = (name, value, label, placeholder) => ({
    edit: true,
    navigator: props.navigator,
    targetName: name,
    displayField: name,
    value,
    fieldLabel: label,
    placeholder: placeholder,
  });

  const handleProductChange = React.useCallback(
    (e) => {
      setProduct(e.target.value);
      fetchInventoryLine({
        _product: e.target.value,
        _company: company,
        _stockLocation: stockLocation,
        _inventory: inventory,
      });
    },
    [company, stockLocation, inventory, product]
  );

  const handleCompanyChange = React.useCallback(
    (e) => {
      setCompany(e.target.value);
      setInventory();
      setInventoryLine();
    },
    [product, stockLocation, inventory]
  );

  const handleStockLocationChange = React.useCallback(
    (e) => {
      setStockLocation(e.target.value);
      setInventory();
      setInventoryLine();
    },
    [company, product, inventory]
  );

  const handleInventoryChange = React.useCallback(
    (e) => {
      setInventory(e.target.value);
      fetchInventoryLine({
        _product: product,
        _company: company,
        _stockLocation: stockLocation,
        _inventory: e.target.value,
      });
    },
    [company, product, stockLocation]
  );

  const fetchInventoryLine = React.useCallback(
    async ({ _product, _company, _stockLocation, _inventory }) => {
      const { search } = props.api;
      if(_product && _company && _stockLocation && _inventory) {
        const data = {
          criteria: [
            { fieldName: "product.id", operator: "=", value: _product.id },
            {
              fieldName: "inventory.company.id",
              operator: "=",
              value: _company.id,
            },
            {
              fieldName: "inventory.stockLocation.id",
              operator: "=",
              value: _stockLocation.id,
            },
            { fieldName: "inventory.id", operator: "=", value: _inventory.id },
          ],
        };
        search({ data }).then((res) => {
          const { data } = res;
          if (data && Array.isArray(data)) {
            if (data[0]) {
              setInventoryLine({ ...data[0] });
              setInitialInventoryLine({ ...data[0] });
            } else {
              setInventoryLine();
              setInitialInventoryLine();
              const el = document.getElementsByTagName('ons-alert-dialog');
              if(el[0]) {
                el[0].remove();
              }
              el.length === 0 && notification.alert("Inventory not found", { title: "Not found" });
            }
          } else {
            const el = document.getElementsByTagName('ons-alert-dialog');
            if(el[0]) {
              el[0].remove();
            }
            notification.alert("Inventory not found", { title: "Not found" });
          }
        });
      }
    },
    []
  );

  const fetchProductFromSerialNumber = React.useCallback((serialNumber) => {
    const noProductMessage = translate("Stock.unreferenced_product");
    if (serialNumber) {
      const { search } = props.api.refs.product;
      const critera = {
        criteria: [
          { fieldName: "serialNumber", operator: "=", value: serialNumber },
        ],
      };
      search({ data: critera }).then((res) => {
        if (res.data && Array.isArray(res.data)) {
          if (res.data.length) {
            handleProductChange({ target: { value: { ...res.data[0] } } });
          } else {
            notification.alert(noProductMessage, { title: "Not found" });
          }
        }
      });
    } else {
      notification.alert(noProductMessage, { title: "Error" });
    }
  }, [inventory]);

  const handleScanCode = () => {
    scanCode().then((res) => {
      if (res.status === 1) {
        // fetchProduct from serial Number
        let serialNumber = res.result.text;
        const format = res.result.format;
        if (format === "EAN_13") {
          serialNumber = serialNumber.substring(0, 12);
        }
        if (format === "EAN_8") {
          serialNumber = serialNumber.substring(0, 7);
        }
        fetchProductFromSerialNumber(serialNumber);
      } else if (res.status === 0) {
        notification.alert(res.message, { title: translate("Alert.scanError") });
      }
    });
  };

  const handleChange = React.useCallback((key, value) => {
    setInventoryLine((line) => {
      return { ...line, [key]: value };
    });
  }, []);

  const saveInventoryLine = React.useCallback(() => {
    const { update } = props.api;
    setLoading(true);
    update(inventoryLine).then((res) => {
      setLoading(false);
      if (res && Array.isArray(res.data)) {
        setInventoryLine({ ...res.data[0] });
      } else {
        notification.alert(res.data.message, { title: translate("Alert.Alert.saveErrorTitle") });
      }
    });
  }, [inventoryLine]);

  useEffect(() => {
    // set active company
    setLoading(true);
    const { user_data } = props;
    const userData = user_data.data || {};
    const userInfo = userData.info;
    if (userInfo && userInfo.active_company) {
      setCompany(userInfo.active_company);
    }
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

  function renderInventoryLineView() {
    if (!inventoryLine) {
      return null;
    }
    return (
      <div>
        <CardView>
          <CardView.InputField
            title={translate("Inventory.currentQty")}
            onChange={(e) => handleChange("currentQty", e.target.value)}
            value={inventoryLine.currentQty}
          />
          <CardView.InputField
            edit={true}
            title={translate("Inventory.realQty")}
            onChange={(e) => handleChange("realQty", e.target.value)}
            value={inventoryLine.realQty}
          />
          <CardView.InputField
            edit={true}
            title={translate("Inventory.rack")}
            onChange={(e) => handleChange("rack", e.target.value)}
            value={inventoryLine.rack}
          />
          <RenderManyToOne
            name="unit"
            searchAPI={(e) => {
              return props.api.refs.unit.searchAll(e).then((res) => {
                return res;
              });
            }}
            onChange={(e) => handleChange("unit", e.target.value)}
            {...manyToOneProps(
              "name",
              inventoryLine.unit,
              translate("Inventory.unit"),
              translate("select_unit")
            )}
          />
          <CardView.InputField
            edit={false}
            title={translate("Inventory.GAP")}
            value={getGAP(inventoryLine)}
          />
        </CardView>
        <CardView>
          <RenderManyToOne
            name="trackingNumber"
            searchAPI={(e) => {
              e.data = {
                _domain: "self.product = :product",
                _domainContext: { product },
              };
              return props.api.refs.trackingnumber.searchAll(e).then((res) => {
                return res;
              });
            }}
            onChange={(e) => handleChange("trackingNumber", e.target.value)}
            {...manyToOneProps(
              "trackingNumberSeq",
              inventoryLine.trackingNumber,
              translate("Inventory.trackingNumber"),
              translate("select_trackingNumber")
            )}
          />
          <CardView.TextArea
            edit={true}
            value={inventoryLine.description}
            onChange={(e) => handleChange("description", e.target.value)}
            title={translate("Inventory.description")}
          />
        </CardView>
      </div>
    );
  }

  function renderToolbar() {
    const onClick = () => props.showModal("apps");
    return (
      <Toolbar noshadow modifier="transparent">
        <div className="left" onClick={onClick}>
          <ToolbarButton>
            <Icon icon="fa-th-large" />
          </ToolbarButton>
        </div>
        <div className="center">
          <Translate text="app.stock.menu.availability" />
        </div>
        <div
          key="1"
          className="right right-icons"
          style={{ color: "#717171", justifyContent: "flex-end" }}
        >
          <PageElement
            key="edit"
            offline={!(inventoryLine && inventoryLine.id)}
          >
            {inventoryLine ? (
              <div
                onClick={() => saveInventoryLine()}
                style={{ padding: "5px 15px 5px 0px" }}
              >
                <div
                  key="save"
                  style={{ color: "rgba(44, 196,211,1)" }}
                  className="round-icon"
                >
                  <Icon icon="fa-save" />
                </div>
              </div>
            ) : null}
          </PageElement>
        </div>
      </Toolbar>
    );
  }

  function isRecordChanged(close) {
    return new Promise((resolve, reject) => {
      if (
        JSON.stringify(inventoryLine) !==
          JSON.stringify(initialInventoryLine) &&
        close
      ) {
        notification
          .confirm(translate("Alert.confirmClose"), {
            title: translate("Alert.confirm"),
            id: "stock-inventory",
            buttonLabels: [
              translate("Alert.cancelButton"),
              translate("Alert.yesButton"),
            ],
          })
          .then((res) => {
            if (res === 1) {
              resolve(true);
            } else {
              resolve(false);
            }
          });
      } else {
        resolve(true);
      }
    });
  }

  return (
    <Page
      noBackIcon
      renderToolbar={() => renderToolbar()}
      isRecordChanged={() => isRecordChanged(true)}
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
      <div className="inventory-selection-row">
        <RenderManyToOne
          name="product"
          searchAPI={(e) => {
            return props.api.refs.product.searchAll(e).then((res) => {
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
          <div
            className="scanner-view"
            style={{ padding: 10, width: "100%" }}
            onClick={handleScanCode}
          >
            <img
              alt="barcode-scan"
              src={barcodeImage}
              className="barcode-icon"
            />
          </div>
        )}
      </div>
      <div className="inventory-selection-row">
        <RenderManyToOne
          name="company"
          searchAPI={(e) => {
            return props.api.refs.company.searchAll(e).then((res) => {
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
            e.data = {
              _domain: "self.typeSelect != 3 and self.company = :company",
              _domainContext: { company },
            };
            return props.api.refs.stocklocation.searchAll(e).then((res) => {
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
      <div className="inventory-selection-row">
        <RenderManyToOne
          name="inventory"
          searchAPI={(e) => {
            e.data = {
              _domain:
                "self.stockLocation = :stockLocation and self.company = :company",
              _domainContext: { company, stockLocation },
            };
            return props.api.refs.inventory.searchAll(e).then((res) => {
              return res;
            });
          }}
          onChange={handleInventoryChange}
          {...manyToOneProps(
            "inventorySeq",
            inventory,
            translate("Inventory.inventory"),
            translate("Inventory.select_inventory")
          )}
        />
      </div>
      {inventoryLine && renderInventoryLineView()}
    </Page>
  );
}

const mapPropsToState = (state) => {
  return { user_data: state.user, app_state: state.app };
};


const mapDispatchToProps = (dispatch, { navigator }) => {
  return {
    showModal: (e) => dispatch(ACTIONS.showModal(e)),
  };
}

export default connect(reduxConnect(mapPropsToState, mapDispatchToProps)(StockInventory));
