import React, { Component } from "react";
import connect from "./../connect";
import PropTypes from "prop-types";
import { connect as reduxConnect } from "react-redux";
import Page, { PageElement } from "../../page";
import Translate, { translate } from "../../../locale";
import {
  Toolbar,
  ToolbarButton,
  Icon,
  AlertDialog,
  Modal,
  ProgressCircular,
  PullHook
} from "react-onsenui";
import { CardView, SwiperView } from "../../../components";
import { TabberView } from "../../../components/Tabber";
import { debounceCallback } from "../../debounce";
import moment from "moment";
import classNames from "classnames";
import Form from "../../form";
import ons from "onsenui";
import "./index.css";

const startOnselect = {
  1: "Morning",
  2: "Afternoon"
};

const statusSelect = {
  1: "Draft",
  2: "Waiting",
  3: "Validated",
  4: "Refused"
};

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
              {obj ? obj.name : placeholder}
            </div>
          </div>
        </div>
      )}
      onChange={e => props.onChange(e)}
    />
  );
};

class LeaveView extends Component {
  constructor(props) {
    super(props);
    this.state = {
      leave: {
        startOnSelect: 1,
        endOnSelect: 2
      },
      recordList: [],
      activeTab: 1,
      hookState: "initial",
      edit: false,
      isNew: false,
      alert: null,
      isLoading: false,
      activeIndex: 0
    };
  }

  fetchNewData(data) {
    const { fetch } = this.props.api;
    this.setState({ isLoading: true }, () => {
      setTimeout(() => {
        fetch(data).then(res => {
          const { data } = res;
          if (data && data.length > 0) {
            const leave = Object.assign({}, data[0]);
            const { recordList } = this.state;
            const targetIndex = recordList.findIndex(r => r.id === leave.id);
            recordList[targetIndex] = Object.assign({}, leave);
            this.setState({ leave, recordList, isLoading: false }, () => {});
          }
        });
      }, 300);
    });
  }

  componentDidMount() {
    const { data, getRecordsByIndex } = this.props.route;
    if (data && data.id !== undefined) {
      if (getRecordsByIndex) {
        const records = getRecordsByIndex(data);
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

  changeField(name, value, done) {
    const { leave, recordList, isNew } = this.state;
    if (isNew) {
      this.setState(
        {
          leave: {
            ...leave,
            [name]: value
          }
        },
        done
      );
    } else {
      const targetIndex = recordList.findIndex(r => r.id === leave.id);
      const record = { ...recordList[targetIndex] };
      record[name] = value;
      recordList[targetIndex] = { ...record };
      this.setState({ recordList }, done);
    }
  }

  isRecordChanged(close) {
    return new Promise((resolve, reject) => {
      const { recordList, leave } = this.state;
      const targetIndex = recordList.findIndex(
        record => record.id === leave.id
      );
      if (
        JSON.stringify(recordList[targetIndex]) !== JSON.stringify(leave) &&
        close
      ) {
        ons.notification
          .confirm(translate("Alert.confirmClose"), {
            title: translate("Alert.confirm"),
            id: "leave-view",
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
    const { recordList, leave } = this.state;
    return new Promise((resolve, reject) => {
      const targetIndex = recordList.findIndex(
        record => record.id === leave.id
      );
      this.isRecordChanged(close).then(ok => {
        if (ok) {
          recordList[targetIndex] = leave;
          this.setState({ edit: false, leave, recordList });
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

  addLeave(leave) {
    let { add, fetch } = this.props.leaveline;
    const { addRecord, updateRecord } = this.props.route;
    const { info } = this.props.user_data;
    add({
      ...leave,
      statusSelect: 1,
      user: { id: info["user.id"], fullName: info["user.name"] }
    }).then(result => {
      if (result.status === -1) {
        ons.notification.alert(result.error.message, {
          id: "leave-error"
        });
        this.setState({ isLoading: false });
      } else {
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
                leave: res.data[0],
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
              title: <Translate text={"app.leave.add.error"} />,
              content: result.error.message || (
                <Translate text={"app.leave.add.errorOthers"} />
              )
            }
          });
        }
      }
    });
  }

  onUpdate(leave) {
    const { update } = this.props.leaveline;
    update(leave).then(res => {
      if (res.status === -1) {
        ons.notification.alert(res.error.message, {
          id: "leave-error"
        });
        this.setState({ isLoading: false });
      } else {
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
              title: <Translate text={"app.leave.add.error"} />,
              content: res.error.message || (
                <Translate text={"app.leave.add.errorOthers"} />
              )
            }
          });
        }
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
    const { leave, recordList } = this.state;
    const record = recordList.find(r => r.row_id === leave.row_id);
    if (record && record.id !== undefined) {
      this.startLoading();
      this.onUpdate(record);
    } else {
      this.startLoading();
      this.addLeave(leave);
    }
  }

  getDuration(fromDate, toDate, startOnSelect, endOnSelect) {
    let dd = moment(toDate).diff(moment(fromDate), "days");
    if (startOnSelect !== endOnSelect) {
      if (startOnSelect === 2) {
        dd -= 0.5;
      } else if (startOnSelect === 1) {
        dd += 0.5;
      }
    }
    return (dd += 0.5);
  }

  computeDuration() {
    const { leave, recordList, isNew } = this.state;

    if (isNew) {
      const { startOnSelect, endOnSelect, fromDate, toDate } = leave;
      if (fromDate && toDate) {
        let dd = this.getDuration(fromDate, toDate, startOnSelect, endOnSelect);
        this.setState({ leave: { ...this.state.leave, duration: dd } });
      }
    } else {
      const targetIndex = recordList.findIndex(r => r.id === leave.id);
      const record = { ...recordList[targetIndex] };
      const { startOnSelect, endOnSelect, fromDate, toDate } = record;
      if (fromDate && toDate) {
        let dd = this.getDuration(fromDate, toDate, startOnSelect, endOnSelect);
        record.duration = dd;
        recordList[targetIndex] = record;
        this.setState({ recordList });
      }
    }
  }

  removeLeave(record) {
    const { remove } = this.props.leaveline;
    ons.notification
      .confirm(translate("Alert.confirmDelete"), {
        title: translate("Alert.confirm"),
        id: "remove-leave"
      })
      .then(res => {
        if (res === 1) {
          remove(record).then(res => {
            if (res.status !== 0) {
              ons.notification.alert(res.error.title, { id: "leave-error" });
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

  isFormValid() {
    const { fromDate, toDate, leaveLine } = this.state.leave;

    if (!fromDate || !toDate || !leaveLine) return false;
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

  goBack(canBack) {
    if (canBack) {
      this.props.navigator.popPage();
    } else {
      this.props.navigator.replacePage({ name: "leaves" });
    }
  }

  renderToolbar() {
    const { edit, isNew, leave } = this.state;
    const validity = this.isFormValid();
    const canBack = this.props.navigator.routes[0].name === "leaves";
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
              ? translate("app.leave.add.title")
              : translate("app.leave.edit.title")}
          </span>
        </div>
        {isNew ? (
          <div className="right icons" style={{ paddingRight: "10px" }}>
            <PageElement key="save" offline={!leave.id}>
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
            <PageElement key="close" offline={!leave.id}>
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
              <PageElement key="save" offline={!leave.id}>
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
            <PageElement key="delete" offline={!leave.id}>
              <div
                style={{ color: "#F44336", marginRight: 5 }}
                className="round-icon"
              >
                <Icon icon="fa-trash" onClick={() => this.removeLeave(leave)} />
              </div>
            </PageElement>
            <div
              style={{ padding: "5px 15px 5px 0px" }}
              onClick={() => this.setState({ edit: true, activeTab1: 1 })}
            >
              <PageElement key="edit" offline={!leave.id}>
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

  renderView(leave) {
    const { leavereason } = this.props.leaveline.refs;

    const manyToOneProps = (name, stateKey, label, placeholder) => ({
      edit: this.state.edit,
      navigator: this.props.navigator,
      targetName: name,
      displayField: name,
      value: leave[stateKey],
      fieldLabel: label,
      placeholder: placeholder,
      liveSearch: false,
      all: true,
      onChange: e => this.changeField(stateKey, e.target.value)
    });

    let dateText = "";
    if (leave.fromDate) {
      dateText = `${moment(leave.fromDate).format("DD MMM YYYY")}`;
    }
    if (leave.toDate) {
      dateText = `${dateText} ${translate("app.leave.to")} ${moment(
        leave.toDate
      ).format("DD MMM YYYY")}`;
    }
    return (
      <div style={{ marginBottom: "25px" }}>
        {this.renderAlertBox()}
        <CardView principalView>
          {this.state.edit ? (
            <div style={{ padding: "10px 10px 10px 10px" }}>
              <RenderManyToOne
                name="leaveLine"
                searchAPI={e => leavereason.searchAll(e)}
                {...manyToOneProps(
                  "name",
                  "leaveLine",
                  translate("app.leave.add.reason"),
                  translate("app.leave.add.select_reason")
                )}
              />

              <CardView.InputField
                edit={false}
                title={translate("app.leave.add.quantity")}
                value={leave && leave.leaveLine && leave.leaveLine.quantity}
              />

              <CardView.DateField
                name="fromDate"
                edit={this.state.edit}
                title={translate("app.leave.add.fromDate")}
                onChange={e =>
                  this.changeField(
                    "fromDate",
                    moment(e.target.value).format("YYYY-MM-DDTHH:mm:ss"),
                    () => this.computeDuration()
                  )
                }
                value={leave && leave.fromDate}
              />

              <CardView.DateField
                name="toDate"
                edit={this.state.edit}
                title={translate("app.leave.add.endDate")}
                onChange={e =>
                  this.changeField(
                    "toDate",
                    moment(e.target.value).format("YYYY-MM-DDTHH:mm:ss"),
                    () => this.computeDuration()
                  )
                }
                value={leave && leave.toDate}
              />
              <div>
                <Form.RadioWizard
                  label={translate("app.leave.startOn")}
                  options={[
                    { value: 1, label: translate("app.leave.morning") },
                    { value: 2, label: translate("app.leave.afternoon") }
                  ]}
                  value={leave.startOnSelect}
                  name="startOnSelect"
                  onChange={e =>
                    this.changeField("startOnSelect", e.target.value, () =>
                      this.computeDuration()
                    )
                  }
                />
                <Form.RadioWizard
                  label={translate("app.leave.endOn")}
                  options={[
                    { value: 1, label: translate("app.leave.morning") },
                    { value: 2, label: translate("app.leave.afternoon") }
                  ]}
                  value={leave.endOnSelect}
                  name="endOnSelect"
                  onChange={e =>
                    this.changeField("endOnSelect", e.target.value, () =>
                      this.computeDuration()
                    )
                  }
                />
              </div>
            </div>
          ) : (
            <div style={{ padding: "30px 0px 20px 0" }}>
              <div className="pricipal-view">
                {!this.state.isNew && (
                  <CardView.TagButton>
                    <Translate
                      text={`app.leave.status.${statusSelect[
                        leave.statusSelect
                      ] && statusSelect[leave.statusSelect].toLowerCase()}`}
                    />
                  </CardView.TagButton>
                )}
                <p
                  className="pricipal-view-detail"
                  style={{ fontSize: "11pt", fontWeight: 600 }}
                >
                  {leave.leaveLine && leave.leaveLine.name}
                </p>
                <p className="pricipal-view-detail">
                  {leave.leaveLine && leave.leaveLine.quantity} {translate("app.leave.qty")}
                </p>
                <p className="pricipal-view-detail">{dateText}</p>
                <p className="pricipal-view-detail">
                  {translate(
                    `app.leave.${startOnselect[
                      leave.startOnSelect
                    ].toLowerCase()}`
                  )}{" "}
                  {translate("app.leave.to")}{" "}
                  {translate(
                    `app.leave.${startOnselect[
                      leave.endOnSelect
                    ].toLowerCase()}`
                  )}
                </p>
                <p className="pricipal-view-detail">
                  {leave.duration} {translate("app.leave.days")}
                </p>

                <CardView.InputField
                  edit={false}
                  value={leave && leave.user && leave.user.fullName}
                />
              </div>
            </div>
          )}
        </CardView>

        <div style={{ paddingTop: "30px" }}>
          <Tabs
            tabs={[{ title: translate("Message.information"), value: 1 }]}
            activeTab={this.state.activeTab}
            onChange={e => this.setState({ activeTab: e })}
          />
          {this.props.app.mode === "online" ? (
            <CardView hidden={!this.state.edit}>
              <CardView.InputField
                edit={this.state.edit}
                title={translate("app.leave.add.duration")}
                onChange={e => this.changeField("duration", e.target.value)}
                value={leave && leave.duration}
              />
            </CardView>
          ) : (
            ""
          )}
        </div>

        <CardView title={translate("app.leave.comment")}>
          <CardView.TextArea
            edit={this.state.edit}
            value={leave.comments}
            onChange={e => this.changeField("comments", e.target.value)}
          />
        </CardView>
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
    const { hookState, isLoading, leave } = this.state;
    let hookContent = null;
    if (hookState === "action") {
      hookContent = this.renderPullHookLoader();
    }
    return (
      <PullHook
        disabled={isLoading}
        onChange={e => this.setState({ hookState: e.state })}
        onLoad={done => {
          this.fetchNewData(leave);
          done();
        }}
        fixedContent={true}
      >
        {hookContent}
      </PullHook>
    );
  }
  render() {
    const { leave, isNew, isLoading, recordList } = this.state;
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
          this.renderView(leave)
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

LeaveView.propTypes = {
  navigator: PropTypes.any,
  route: PropTypes.any
};

LeaveView = reduxConnect(state => ({
  app: state.app,
  user_data: state.user.data
}))(LeaveView);

export default connect(LeaveView);
