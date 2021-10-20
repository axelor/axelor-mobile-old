import React, { useEffect, useState } from "react";
import { connect as reduxConnect } from "react-redux";
import connect from "../connect/time-log";
import {
  Icon,
  Modal,
  ProgressCircular,
  Toolbar,
  ToolbarButton,
} from "react-onsenui";
import { notification } from "onsenui";
import moment from 'moment';
import { CardView } from "../../../components";

import Translate, { translate } from "../../../locale";
import Page, { PageElement } from "../../page";
import { RenderManyToOne } from "../../page-comment-list";
import { scanCode } from "../../../cordova/barcodeScanner";
import barcodeImage from "../../../images/barcode.png";
import * as ACTIONS from '../../../redux/actions';

function TimeLog(props) {
  const [operationOrder, setOperationOrder] = useState();
  const [manufOrder, setManufOrder] = useState();
  const [timesheetLine, setTimesheetLine] = useState();
  const [timesheet, setTimesheet] = useState();
  const [loading, setLoading] = useState(false);
  const [initialTimesheetLine, setInitialTimesheetLine] = useState();

  const manyToOneProps = (name, value, label, placeholder) => ({
    edit: true,
    navigator: props.navigator,
    targetName: name,
    displayField: name,
    value,
    fieldLabel: label,
    placeholder: placeholder,
  });

  const handleManufOrderChange = React.useCallback(
    (e) => {
      setManufOrder(e.target.value);
    },
    []
  );

  const handleOperationOrderChange = React.useCallback(
    (e, fromScan) => {
      fetchOperationOrderLine(e.target.value, fromScan);
    },
    []
  );

  const fetchOperationOrderLine = React.useCallback(
    async (_operationOrder, fromScan = false) => {
      const { fetch } = props.api.refs.operationorder;
      if(_operationOrder.id) {
        const related = {
          manufOrder: ['product']
        }
        fetch(_operationOrder, related).then((res) => {
          const { data } = res;
          if (data && Array.isArray(data)) {
            if (data[0]) {
              const object = {
                comments: data[0].comments,
                product: data[0].manufOrder.product,
              };
              setOperationOrder(data[0]);
              if(fromScan) {
                setManufOrder(data[0].manufOrder);
              }
              setTimesheetLine(t => {
                return {...t, ...object}
              });
              setInitialTimesheetLine({...object});
            } else {
              setTimesheetLine(t => {
                return {...t, comments: null}
              });
              const el = document.getElementsByTagName('ons-alert-dialog');
              if(el[0]) {
                el[0].remove();
              }
              el.length === 0 && notification.alert("Operation order not found", { title: "Not found" });
            }
          } else {
            const el = document.getElementsByTagName('ons-alert-dialog');
            if(el[0]) {
              el[0].remove();
            }
            notification.alert("Operation order not found", { title: "Not found" });
          }
        });
      }
    },
    []
  );

  const scanOperationOrder = () => {
    props.disableBackButton();
    scanCode().then((res) => {
      if (res.status === 1) {
        // fetchProduct from serial Number
        let serialNumber = res.result.text;
        const id = serialNumber;
        handleOperationOrderChange({target: { value: {id} }}, true);

      } else if (res.status === 0) {
        notification.alert(res.message, { title: translate("Alert.scanError") });
      }
    });
  }

  const handleChange = React.useCallback((key, value) => {
    setTimesheetLine((line) => {
      return { ...line, [key]: value };
    });
  }, []);

  const saveTimesheetLine = React.useCallback(() => {
    const { add } = props.api;
    setLoading(true);
    const timesheetLineObject = {
      comments: timesheetLine.comments,
      project: null,
      product: timesheetLine.product,
      duration: timesheetLine.durationStored,
      toInvoice: false,
      date: moment().format("YYYY-MM-DD"),
      timesheet,
      manufOrder,
      operationOrder,
    }
    add(timesheetLineObject).then((res) => {
      setLoading(false);
      if (res && Array.isArray(res.data)) {
        setTimesheetLine(t => {
          return {...t, durationStored: 0}
        });
        notification.alert(translate("Alert.timesheetLineSuccess"), { title: translate("Success") });
      } else {
        notification.alert(res.data.message, { title: translate("Alert.saveErrorTitle") });
      }
    });
  }, [timesheetLine, operationOrder, manufOrder]);

  useEffect(() => {
    // set current timesheet
    setLoading(true);
    const actionName = 'edit.timesheet';
    const {action} = props.api.refs.timesheet;
    action(actionName, {context: {}}).then(res => {
      setLoading(false);
      if(res.data && Array.isArray(res.data) && res.data[0]) {
        const view = res.data[0].view || {};
        const {context = {}} = view;
        if(context._showRecord) {
          setTimesheet({id: context._showRecord});
        }
      }
    });
  }, []);

  function renderTimesheetLineView() {
    if (!timesheetLine) {
      return null;
    }
    return (
      <div>
        <CardView>
          <CardView.Number
            edit={true}
            title={translate("Production.duration")}
            onChange={(e) => handleChange("durationStored", e.target.value)}
            value={timesheetLine.durationStored}
            defaultValue="0.00"
          />
          <CardView.TextArea
            edit={true}
            title={translate("Production.comments")}
            onChange={(e) => handleChange("comments", e.target.value)}
            value={timesheetLine.comments}
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
          <Translate text="app.production.menu.timesheet_log" />
        </div>
        <div
          key="1"
          className="right right-icons"
          style={{ color: "#717171", justifyContent: "flex-end" }}
        >
          <PageElement
            key="edit"
          >
            {timesheetLine ? (
              <div
                onClick={() => saveTimesheetLine()}
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
        JSON.stringify(timesheetLine) !==
          JSON.stringify(initialTimesheetLine) &&
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
          name="manufOrder"
          searchAPI={(e) => {
            return props.api.refs.manuforder.searchAll(e).then((res) => {
              return res;
            });
          }}
          onChange={handleManufOrderChange}
          {...manyToOneProps(
            "manufOrderSeq",
            manufOrder,
            translate("Production.manufOrder"),
            translate("Production.select_manuf_order")
          )}
        />

      </div>
      <div className="inventory-selection-row">
        <RenderManyToOne
          name="operationOrder"
          searchAPI={(e) => {
            e.data = {
              _domain:
                "self.manufOrder = :manufOrder",
              _domainContext: { manufOrder },
            };
            return props.api.refs.operationorder.searchAll(e).then((res) => {
              return res;
            });
          }}
          onChange={handleOperationOrderChange}
          {...manyToOneProps(
            "name",
            operationOrder,
            translate("Production.operationOrder"),
            translate("Production.select_operation_order")
          )}
        />
        <div
          className="scanner-view"
          style={{ padding: 10, width: "100%" }}
          onClick={scanOperationOrder}
        >
          <img
            alt="barcode-scan"
            src={barcodeImage}
            className="barcode-icon"
          />
        </div>
      </div>

      {timesheetLine && renderTimesheetLineView()}
    </Page>
  );
}

const mapPropsToState = (state) => {
  return { user_data: state.user, app_state: state.app };
};

const mapDispatchToProps = (dispatch, { navigator }) => {
  return {
    showModal: (e) => dispatch(ACTIONS.showModal(e)),
    disableBackButton: () => dispatch(ACTIONS.disableBackButton()),
  };
}

export default connect(reduxConnect(mapPropsToState, mapDispatchToProps)(TimeLog));
