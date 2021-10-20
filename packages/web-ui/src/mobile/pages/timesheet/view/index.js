import React, { Component } from "react";
import connect from "./../connect";
import PropTypes from "prop-types";
import Page, { PageElement } from "../../page";
import Translate, { translate } from "../../../locale";
import {
  ToolbarButton,
  AlertDialog,
  Toolbar,
  Icon,
  Modal,
  ProgressCircular,
  Switch,
  PullHook
} from "react-onsenui";
import { CardView, SwiperView } from "../../../components";
import { TabberView } from "../../../components/Tabber";
import { debounceCallback } from "../../debounce";
import moment from "moment";
import classNames from "classnames";
import ons from "onsenui";
import "./index.css";

const Tabs = ({ tabs, activeColor, activeTab, onChange, ...rest }) => (
  <TabberView>
    {tabs.map((item, index) => (
      <TabberView.Tab
        key={index}
        activeColor={activeColor}
        title={item.title}
        active={activeTab === item.value}
        onClick={() => onChange(item.value)}
        hideTab={item.hide ? item.hide() : false}
        {...rest}
      />
    ))}
  </TabberView>
);

const RenderManyToOne = props => {
  const { name, fieldLabel, placeholder, targetName, value, searchAPI } = props;
  return (
    <CardView.ManyToOne
      {...props}
      style={{ width: "100%" }}
      name={name}
      className="inline select-control"
      title={fieldLabel}
      placeholder={placeholder}
      targetName={targetName}
      value={value}
      searchAPI={searchAPI}
      renderItem={(obj, i) => (
        <div
          style={{ width: "100%", display: "flex", flexDirection: "column" }}
        >
          <div
            style={{ padding: 0 }}
            className="field-input list-item list--inset__item list-item--chevron list-item--tappable"
          >
            <div key={i} className="many-to-one">
              {obj ? obj[targetName] : placeholder}
            </div>
          </div>
        </div>
      )}
      onChange={e => props.onChange(e)}
    />
  );
};

const getTimerValue = val => {
  if (!val) return "";
  const mins = (val / 60) % 60;
  const hrs = Math.floor(val / 3600);
  const mm = Number((mins * 100) / 60).toFixed(0);
  return `${hrs}.${Number(mm) > 10 ? mm : `0${mm}`}`;
};

class TimesheetView extends Component {
  constructor(props) {
    super(props);
    const { data = {} } = props.route;
    this.state = {
      data: {
        comments: "",
        project: {},
        product: {},
        durationStored: getTimerValue(data.interval || "0"),
        interval: 0,
        interval_str: "",
        toInvoice: false,
        date: moment().format("YYYY-MM-DD"),
        ...data
      },
      recordList: [],
      activeTab: 1,
      edit: false,
      isNew: false,
      alert: null,
      isLoading: false,
      activeIndex: 0
    };
  }

  fetchNewData(data) {
    this.setState({ isLoading: true }, () => {
      setTimeout(() => {
        Promise.resolve({ data: [data] }).then(res => {
          const { data } = res;
          if (data && data.length > 0) {
            const timesheet = Object.assign({}, data[0]);
            const { recordList } = this.state;
            const targetIndex = recordList.findIndex(
              r => r.id === timesheet.id
            );
            recordList[targetIndex] = Object.assign({}, timesheet);
            this.setState(
              { data: timesheet, recordList, isLoading: false },
              () => {}
            );
          }
        });
      }, 300);
    });
  }

  componentDidMount() {
    const { data, getRecordsByIndex } = this.props.route;
    if (data && data.id !== undefined) {
      if (getRecordsByIndex) {
        const records = getRecordsByIndex(data, true);
        const targetIndex = records.findIndex(r => r.id === data.id);
        this.swiper.slideTo(targetIndex, 0, true);
        this.setState({ recordList: records, activeIndex: targetIndex });
        this.fetchNewData(data);
      }
    } else {
      this.setState({
        isNew: true,
        edit: true,
        activeTab: 1
      });
    }
  }

  changeField(name, value) {
    const { data, recordList, isNew } = this.state;
    if (isNew) {
      this.setState({
        data: {
          ...data,
          [name]: value
        }
      });
    } else {
      const targetIndex = recordList.findIndex(r => r.id === data.id);
      const record = { ...recordList[targetIndex] };
      record[name] = value;
      recordList[targetIndex] = { ...record };
      this.setState({ recordList });
    }
  }

  isRecordChanged(close) {
    return new Promise((resolve, reject) => {
      const { recordList, data } = this.state;
      const targetIndex = recordList.findIndex(record => record.id === data.id);
      if (
        JSON.stringify(recordList[targetIndex]) !== JSON.stringify(data) &&
        close
      ) {
        ons.notification
          .confirm(translate("Alert.confirmClose"), {
            title: translate("Alert.confirm"),
            id: "app-timesheet",
            buttonLabels: [
              translate("Alert.cancelButton"),
              translate("Alert.yesButton")
            ]
          })
          .then(res => {
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

  onBackButtonClick(canBack) {
    const { edit } = this.state;
    if (!edit) {
      this.goBack(canBack);
      return;
    }
    this.isRecordChanged(true).then(ok => {
      if (ok) {
        this.goBack(canBack);
      }
    });
  }

  closeEdit(close) {
    const { recordList, data } = this.state;
    return new Promise((resolve, reject) => {
      const targetIndex = recordList.findIndex(record => record.id === data.id);
      this.isRecordChanged(close).then(ok => {
        if (ok) {
          recordList[targetIndex] = data;
          this.setState({ edit: false, data, recordList });
          resolve(true);
        }
      });
    });
  }

  onRecordSwipe(record) {
    const { getRecordsByIndex } = this.props.route;
    if (getRecordsByIndex) {
      const list = getRecordsByIndex(record);
      this.setState({ recordList: list }, () => {
        const { recordList } = this.state;
        const targetIndex = recordList.findIndex(r => r.id === record.id);
        this.fetchNewData(record);
        this.swiper.slideTo(targetIndex, 0, true);
      });
    } else {
      this.setState({ recordList: [record], expense: record });
    }
    debounceCallback(() => {
      this.closeEdit().then(res => {
        this.fetchNewData(record);
      });
    });
  }

  addTimesheet(record) {
    let { add, fetch } = this.props.api;
    const { addRecord, updateRecord } = this.props.route;
    add(record).then(result => {
      if (`${result.status}` === "0") {
        let { data } = result;
        if (addRecord) {
          addRecord(data[0]);
        }
        if (updateRecord) {
          updateRecord(data[0]);
        }

        fetch(data[0]).then(res => {
          this.setState(
            {
              data: res.data[0],
              isNew: false,
              edit: false,
              activeTab: 1
            },
            () => {
              this.onRecordSwipe(res.data[0]);
            }
          );
        });
      } else {
        this.setState({
          alert: {
            title: <Translate text={"app.timesheet.add.error"} />,
            content: result.error.message || (
              <Translate text={"app.timesheet.add.errorOthers"} />
            )
          }
        });
      }
    });
  }

  onUpdate(record) {
    const { update } = this.props.api;
    update(record).then(res => {
      if (`${res.status}` === "0") {
        const { data } = res;
        if (data && data.length > 0) {
          const newRecord = data[0];
          this.fetchNewData(newRecord);
          if (this.props.route.updateRecord) {
            this.props.route.updateRecord(data[0]);
          }
          this.setState({ edit: false });
          this.fetchNewData(newRecord);
        }
      } else {
        this.setState({
          alert: {
            title: <Translate text={"app.timesheet.add.error"} />,
            content: res.error.message || (
              <Translate text={"app.timesheet.add.errorOthers"} />
            )
          }
        });
      }
    });
  }

  closeLoading() {
    this.setState({ isLoading: false });
  }

  startLoading() {
    this.setState({ isLoading: true });
  }

  onSave() {
    const { data, recordList } = this.state;
    const record = recordList.find(r => r.row_id === data.row_id);

    if (record && record.id !== undefined) {
      this.startLoading();
      record.durationStored = Number(record.durationStored).toFixed(2);
      if(record.product) {
        delete record.product.row_id;
      }
      if(record.project) {
        delete record.project.row_id;
      }
      this.onUpdate(record);
    } else {
      this.startLoading();
      data.durationStored = Number(data.durationStored).toFixed(2);
      if(data.product) {
        delete data.product.row_id;
      }
      if(data.project) {
        delete data.project.row_id;
      }
      this.addTimesheet({...data});
    }
  }

  isFormValid() {
    const { project, product, durationStored, date } = this.state.data;
    if (
      !project ||
      !project.id ||
      !product ||
      !product.id ||
      !durationStored ||
      Number(durationStored) <= 0 ||
      !date
    )
      return false;
    return true;
  }

  renderAlertBox() {
    const { alert } = this.state;
    const {
      title = "",
      content = "",
      onOk = () => this.setState({ alert: null })
    } = alert || {};
    return (
      <AlertDialog isOpen={!!alert} isCancelable={false}>
        <div className="alert-dialog-title">{title}</div>
        <div className="alert-dialog-content">{content}</div>
        <div className="alert-dialog-footer">
          <button onClick={onOk} className="alert-dialog-button">
            <Translate text="common.dialog.ok" />
          </button>
        </div>
      </AlertDialog>
    );
  }

  removeTimesheet(record) {
    const { remove } = this.props.api;
    ons.notification
      .confirm(translate("Alert.confirmDelete"), {
        title: translate("Alert.confirm"),
        id: "remove-timesheet"
      })
      .then(res => {
        if (res === 1) {
          remove(record).then(res => {
            if (res.status !== 0) {
              ons.notification.alert(res.error.title, {
                id: "timesheet-error"
              });
            } else {
              if (this.props.route.removeRecord) {
                this.props.route.removeRecord(record);
              }
              this.props.navigator.popPage();
            }
          });
        }
      });
  }

  goBack(canBack) {
    if (canBack) {
      this.props.navigator.popPage();
    } else {
      this.props.navigator.replacePage({ name: "timesheets" });
    }
  }

  renderToolbar() {
    const { edit, isNew, data } = this.state;
    const validity = this.isFormValid();
    const canBack = this.props.navigator.routes[0].name === "timesheets";
    return (
      <Toolbar noshadow modifier="transparent">
        <div className="left left-icon-width">
          <ToolbarButton onClick={() => this.onBackButtonClick(canBack)}>
            <Icon icon="chevron-left" />
          </ToolbarButton>
        </div>
        <div className="center left-align-title ellipse-toolbar">
          <span
            onClick={() => this.onBackButtonClick()}
            style={{ display: "inline-block" }}
          >
            {isNew
              ? translate("app.timesheet.add.title")
              : translate("app.timesheet.edit.title")}
          </span>
        </div>
        {isNew ? (
          <div className="right icons" style={{ paddingRight: "10px" }}>
            <PageElement key="save" offline={!data.id}>
              <div
                style={{ color: "rgba(44, 196,211,1)" }}
                className={classNames("round-icon", { disabled: !validity })}
                onClick={() => validity && this.onSave()}
              >
                <Icon icon="fa-save" />
              </div>
            </PageElement>
          </div>
        ) : edit ? (
          <div className="right icons" style={{ paddingRight: "10px" }}>
            <PageElement key="close" offline={!data.id}>
              <div
                style={{ color: "rgba(44, 196,211,1)", marginRight: 5 }}
                className="round-icon"
                onClick={() => this.closeEdit(true)}
              >
                <Icon icon="fa-times" />
              </div>
            </PageElement>
            <div
              style={{ padding: "5px 15px 5px 0px" }}
              onClick={() => this.onSave()}
            >
              <PageElement key="save" offline={!data.id}>
                <div
                  style={{ color: "rgba(44, 196,211,1)" }}
                  className="round-icon"
                >
                  <Icon icon="fa-save" />
                </div>
              </PageElement>
            </div>
          </div>
        ) : (
          <div className="right icons" style={{ paddingRight: "10px" }}>
            <PageElement key="delete" offline={!data.id}>
              <div
                style={{ color: "#F44336", marginRight: 5 }}
                className="round-icon"
              >
                <Icon
                  icon="fa-trash"
                  onClick={() => this.removeTimesheet(data)}
                />
              </div>
            </PageElement>
            <div
              style={{ padding: "5px 15px 5px 0px" }}
              onClick={() =>
                this.setState({ edit: true, activeTab1: 1 }, this.forceUpdate)
              }
            >
              <PageElement key="edit" offline={!data.id}>
                <div
                  style={{ color: "rgba(44, 196,211,1)" }}
                  className="round-icon"
                >
                  <Icon icon="fa-pencil" />
                </div>
              </PageElement>
            </div>
          </div>
        )}
      </Toolbar>
    );
  }

  renderView(row) {
    const { taskProject, timesheetActivity, projectTask } = this.props;

    const manyToOneProps = (name, stateKey, label, placeholder) => ({
      edit: this.state.edit,
      navigator: this.props.navigator,
      targetName: name,
      displayField: name,
      value: row[stateKey],
      fieldLabel: label,
      placeholder: placeholder,
      liveSearch: false,
      onChange: e => this.changeField(stateKey, e.target.value)
    });
    return (
      <div style={{ marginBottom: "25px" }}>
        {this.renderAlertBox()}
        <CardView principalView>
          {this.state.edit ? (
            <div style={{ padding: "10px 10px 10px 10px" }}>
              <RenderManyToOne
                name="project"
                searchAPI={e => taskProject.searchAll(e)}
                {...manyToOneProps(
                  "fullName",
                  "project",
                  translate("app.timesheet.add.project"),
                  translate("app.timesheet.add.select_project")
                )}
              />

              <RenderManyToOne
                name="product"
                searchAPI={e => timesheetActivity.searchAll(e)}
                {...manyToOneProps(
                  "fullName",
                  "product",
                  translate("app.timesheet.add.activity"),
                  translate("app.timesheet.add.select_activity")
                )}
              />

              <RenderManyToOne
                name="task"
                searchAPI={e => projectTask.searchAll(e)}
                {...manyToOneProps(
                  "fullName",
                  "task",
                  translate("app.timesheet.add.task"),
                  translate("app.timesheet.add.select_task")
                )}
              />

              <CardView.Number
                edit={this.state.edit}
                title={translate("app.timesheet.add.hours")}
                onChange={e =>
                  this.changeField("durationStored", e.target.value)
                }
                value={row.durationStored}
                defaultValue="0.00"
              />

              <CardView.DateField
                title={translate("app.timesheet.add.date")}
                onChange={e => this.changeField("date", e.target.value)}
                value={row.date || ""}
                edit={this.state.edit}
              />
            </div>
          ) : (
            <div style={{ padding: "30px 0px 30px 0" }}>
              <div className="pricipal-view">
                <p
                  className="pricipal-view-detail"
                  style={{ fontSize: "11pt", fontWeight: 600 }}
                >
                  {row.project && row.project.fullName}
                </p>
                <p className="pricipal-view-detail">
                  {row.product && row.product.fullName}
                </p>
                <p className="pricipal-view-detail">
                  {row.projectTask && row.projectTask.fullName}
                </p>
                <p className="pricipal-view-detail">
                  {row.durationStored ? row.durationStored + " Hrs." : ""}
                </p>
                <p className="pricipal-view-detail">
                  {moment(row.date).format("DD MMM YYYY")}{" "}
                </p>
                <p className="pricipal-view-detail"></p>
              </div>
            </div>
          )}
        </CardView>

        <div style={{ paddingTop: "30px" }}>
          <Tabs
            tabs={[{ title: "Information", value: 1 }]}
            activeTab={this.state.activeTab}
            onChange={e => this.setState({ activeTab: e })}
          />

          <CardView title="Comment">
            <CardView.TextArea
              edit={this.state.edit}
              value={row.comments}
              onChange={e => this.changeField("comments", e.target.value)}
            />
          </CardView>

          <div className="switch-container">
            <span>
              <Translate text="app.timesheet.add.to_invoice" />
            </span>
            <span className="expense-switch">
              <Switch
                checked={row.toInvoice}
                onChange={e => this.changeField("toInvoice", e.value)}
              />
            </span>
          </div>
        </div>
      </div>
    );
  }

  renderPullHookLoader(props = {}) {
    return (
      <div style={{ marginTop: 60 }} className="custom-hook-loader" {...props}>
        <ProgressCircular indeterminate />
      </div>
    );
  }

  renderPullHook() {
    const { hookState, isLoading, data } = this.state;
    let hookContent = null;
    if (hookState === "action") {
      hookContent = this.renderPullHookLoader();
    }
    return (
      <PullHook
        disabled={isLoading}
        onChange={e => this.setState({ hookState: e.state })}
        onLoad={done => {
          this.fetchNewData(data);
          done();
        }}
        fixedContent={true}
      >
        {hookContent}
      </PullHook>
    );
  }
  render() {
    const { data, isLoading, isNew, recordList } = this.state;
    return (
      <Page
        {...this.props}
        isRecordChanged={() => this.isRecordChanged(true)}
        renderToolbar={() => this.renderToolbar()}
        renderModal={
          isLoading && (
            <Modal className="auth-modal swiper-view-loader" isOpen={isLoading}>
              <ProgressCircular indeterminate />
            </Modal>
          )
        }
      >
        {isNew ? (
          this.renderView(data)
        ) : (
          <React.Fragment>
            {this.renderPullHook()}
            <SwiperView
              recordList={recordList}
              renderItem={record => this.renderView(record)}
              onActive={record => this.onRecordSwipe(record)}
              onInitSwiper={swiper => (this.swiper = swiper)}
            />
          </React.Fragment>
        )}
      </Page>
    );
  }
}

TimesheetView.propTypes = {
  navigator: PropTypes.any,
  route: PropTypes.any
};

export default connect(TimesheetView);
