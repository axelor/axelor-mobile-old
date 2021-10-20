import React from "react";
import PropTypes from "prop-types";
import moment from "moment";
import { connect as reduxConnect } from "react-redux";
import {
  AlertDialog,
  Modal,
  Toolbar,
  ToolbarButton,
  Icon,
  ProgressCircular,
  Select,
  PullHook
} from "react-onsenui";
import ons from "onsenui";
import Page, { PageElement } from "../../../page";
import connect from "../../connect/crm-event";
import Translate, { translate } from "../../../../locale";
import {
  statusSelect,
  callType,
  typeSelect,
  taskStatusSelect
} from "../common";
import EventFormView from "./../EventView";
import OpportunityView from "./../../crm-opportunity/OpportunityView";
import "./index.css";
import {
  CardView,
  SwiperView,
  EditorComponent
} from "./../../../../components";
import { debounceCallback } from "./../../../debounce";
import PageCommentList, {
  RenderManyToOne,
  Tabs
} from "../../../page-comment-list";
import OffLinePage from "../../../sale/customer/view/offlinePage";

class EventView extends PageCommentList {
  constructor(props) {
    super(props);
    const startDate = moment().format("YYYY-MM-DDTHH:mm");
    const endDate = moment()
      .add(1, "hours")
      .format("YYYY-MM-DDTHH:mm");
    this.state = {
      event: {},
      eventForm: {
        type_select: 0,
        meeting_type: null,
        call_type_select: null,
        status_select: 1,
        subject: null,
        start_date_time: startDate,
        end_date_time: endDate,
        duration: 1,
        user: {
          id: props.user_data.data.info["user.id"],
          full_name: props.user_data.data.info["user.name"]
        },
        description: null,
        client_partner: null,
        contact_partner: null,
        lead: null
      },
      hookState: "initial",
      edit: false,
      isNew: false,
      recordList: [],
      overviewPanel: 1,
      secondTabber: 1,
      submitError: {
        content: null,
        title: null
      },
      showErrorDialog: false,
      isLoading: false,
      commentMessage: "",
      all: [],
      total: 0,
      limit: 4,
      offset: 0,
      activeIndex: 0
    };
  }

  componentDidMount() {
    const { route } = this.props;
    const { data, getRecordsByIndex, record } = route;
    if (data && data.id !== undefined) {
      if (getRecordsByIndex) {
        const records = getRecordsByIndex(data, true);
        records.forEach(
          (r, i) =>
            (records[i].duration = (records[i].duration / 3600).toFixed(2))
        );
        const targetIndex = records.findIndex(r => r.id === data.id);
        this.swiper.slideTo(targetIndex, 0, true);
        this.setState({ recordList: records, activeIndex: targetIndex });
        this.fetchNewData(data);
      } else {
        this.setState({ recordList: [data], event: data }, () => {
          this.fetchNewData(data);
        });
      }
    } else {
      let { eventForm } = this.state;
      if (record) {
        eventForm = { ...eventForm, ...record };
      }
      this.setState({ edit: true, isNew: true, eventForm });
    }
  }

  getApi() {
    return this.props.event;
  }

  getCurrentRecord() {
    return this.state.event;
  }

  fetchNewData(data) {
    const { fetch } = this.props.event;
    const { limit, offset } = this.state;
    this.setState({ isLoading: true }, () => {
      setTimeout(() => {
        fetch(data, {
          lead: ["firstName", "name", "company", "companyName"]
        }).then(res => {
          const { data } = res;
          if (data[0] === undefined) {
            this.props.navigator.replacePage({
              component: OffLinePage,
              key: "err_contact_" + Date.now()
            });
          }
          if (data && data.length > 0) {
            const newData = Object.assign({}, data[0]);
            if (newData.lead) {
              newData.lead["full_name"] = `${newData.lead["first_name"]} ${
                newData.lead["name"]
              }`;
            }
            newData["duration"] = (newData.duration / 3600).toFixed(2);
            const { recordList } = this.state;
            const targetIndex = recordList.findIndex(r => r.id === newData.id);
            recordList[targetIndex] = Object.assign({}, newData);
            this.setState(
              { event: newData, recordList, isLoading: false },
              () => {
                this.getAllComment(limit, offset);
              }
            );
          }
        });
      }, 300);
    });
  }

  getFieldLabel(fieldName) {
    const { fields } = this.props.event;
    const targetIndex = fields.findIndex(field => field.name === fieldName);
    return targetIndex !== -1
      ? translate(fields[targetIndex].label)
      : undefined;
  }

  changeField(field, value) {
    const { event, recordList, eventForm, isNew } = this.state;
    if (isNew) {
      eventForm[field] = value;
      this.setState({ eventForm });
    } else {
      const targetIndex = recordList.findIndex(r => r.id === event.id);
      const record = { ...recordList[targetIndex] };
      record[field] = value;
      recordList[targetIndex] = { ...record };
      this.setState({ recordList });
    }
  }

  editRecord() {
    this.setState({ edit: true });
  }

  isRecordChanged(close) {
    return new Promise((resolve, reject) => {
      const { recordList, event } = this.state;
      const targetIndex = recordList.findIndex(
        record => record.id === event.id
      );
      if (
        JSON.stringify(recordList[targetIndex]) !== JSON.stringify(event) &&
        close
      ) {
        ons.notification
          .confirm(translate("Alert.confirmClose"), {
            title: translate("Alert.confirm"),
            id: "crm-event",
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

  closeEdit(close) {
    const { recordList, event } = this.state;
    return new Promise((resolve, reject) => {
      const targetIndex = recordList.findIndex(
        record => record.id === event.id
      );
      this.isRecordChanged(close).then(ok => {
        if (ok) {
          recordList[targetIndex] = event;
          this.setState({ edit: false, event, recordList });
          resolve(true);
        }
      });
    });
  }

  onBackButtonClick() {
    const { edit } = this.state;
    if (!edit) {
      this.props.navigator.popPage();
      return;
    }
    this.isRecordChanged(true).then(ok => {
      if (ok) {
        this.props.navigator.popPage();
      }
    });
  }

  onRecordSwipe(record) {
    const { getRecordsByIndex } = this.props.route;
    if (getRecordsByIndex) {
      const list = getRecordsByIndex(record);
      list.forEach(
        (r, i) => (list[i].duration = (list[i].duration / 3600).toFixed(2))
      );
      this.setState({ recordList: list, offset: 0, total: 0, all: [] }, () => {
        const { recordList } = this.state;
        const targetIndex = recordList.findIndex(r => r.id === record.id);
        this.fetchNewData(record);
        this.swiper.slideTo(targetIndex, 0, true);
      });
    } else {
      this.setState({ recordList: [record], event: record });
    }
    debounceCallback(() => {
      this.closeEdit().then(res => {
        this.fetchNewData(record);
      });
    });
  }

  validateData(record) {
    let isValid = true;
    const eventForm = record;
    if (eventForm.type_select === null) {
      isValid = false;
      this.setState({
        submitError: {
          title: translate("Alert.saveErrorTitle"),
          content: translate("Alert.typeRequired")
        }
      });
    }
    if (!eventForm.subject || !(eventForm.subject.length > 0)) {
      isValid = false;
      this.setState({
        submitError: {
          title: translate("Alert.saveErrorTitle"),
          content: translate("Alert.subjectRequired")
        }
      });
    }
    if (!eventForm.start_date_time || !(eventForm.start_date_time.length > 0)) {
      isValid = false;
      this.setState({
        submitError: {
          title: translate("Alert.saveErrorTitle"),
          content: translate("Alert.startDateRequired")
        }
      });
    }
    return isValid;
  }

  closeLoading() {
    this.setState({ isLoading: false });
  }

  startLoading() {
    this.setState({ isLoading: true });
  }

  saveRecord() {
    const { onUpdate, onNewUpdate } = this.props.route;
    const { event, recordList, eventForm, isNew } = this.state;
    const { add, update } = this.props.event;
    if (isNew) {
      if (!this.validateData(eventForm)) {
        this.setState({ showErrorDialog: true });
        return;
      }
      this.startLoading();
      add({
        ...eventForm,
        duration: Math.round(eventForm.duration * 3600)
      }).then(res => {
        if (res.status === -1) {
          ons.notification.alert(res.error.message, {
            id: "event-error"
          });
          this.setState({ isLoading: false });
        } else {
          const { data } = res;
          if (data && data.length > 0) {
            const newRecord = data[0];
            if (onNewUpdate) {
              onNewUpdate(newRecord);
            }
            this.setState({ isNew: false, edit: false }, () => {
              this.onRecordSwipe(newRecord);
            });
          } else {
            this.closeLoading();
          }
        }
      });
    } else {
      const record = recordList.find(r => r.row_id === event.row_id);
      if (!this.validateData(record)) {
        this.setState({ showErrorDialog: true });
        return;
      }
      if (record.id !== undefined) {
        this.startLoading();
        update({
          ...record,
          duration: Math.round(record.duration * 3600)
        }).then(res => {
          if (res.status === -1) {
            ons.notification.alert(res.error.message, {
              id: "event-error"
            });
            this.setState({ isLoading: false });
          } else {
            const { data } = res;
            if (data && data.length > 0) {
              const newRecord = data[0];
              if (onUpdate) {
                onUpdate(data[0]);
              }
              this.setState({ edit: false });
              this.fetchNewData(newRecord);
            } else {
              this.closeLoading();
            }
          }
        });
      }
    }
  }

  removeRecord(record) {
    const { remove } = this.props.event;
    ons.notification
      .confirm(translate("Alert.confirmDelete"), {
        title: translate("Alert.confirm"),
        id: "remove-event"
      })
      .then(res => {
        if (res === 1) {
          remove(record).then(res => {
            if (this.props.route.removeRecord) {
              this.props.route.removeRecord(record);
            }
            this.props.navigator.popPage();
          });
        }
      });
  }

  createEvent() {
    const { event } = this.state;
    const record = {
      type_select: event.type_select,
      client_partner: event.client_partner,
      contact_partner: event.contact_partner,
      user: event.user
    };
    this.props.navigator.pushPage(
      { component: EventFormView, path: "EventFormView_" + Date.now(), record },
      { animation: "none" }
    );
  }

  createOpportunity() {
    const { event } = this.state;
    const record = {
      lead: event.lead,
      partner: event.client_partner
    };
    this.props.navigator.pushPage(
      { component: OpportunityView, path: "OpportunityView", record },
      { animation: "none" }
    );
  }

  hasField(fieldName) {
    const { fields } = this.props.event;
    const targetIndex = fields.findIndex(field => field.name === fieldName);
    return targetIndex !== -1 ? true : false;
  }

  renderAlertBox() {
    const { showErrorDialog, submitError } = this.state;
    const onOk = () => this.setState({ showErrorDialog: false });
    return (
      <AlertDialog isOpen={showErrorDialog} isCancelable={false}>
        <div className="alert-dialog-title">{submitError.title}</div>
        <div className="alert-dialog-content">{submitError.content}</div>
        <div className="alert-dialog-footer">
          <button onClick={onOk} className="alert-dialog-button">
            <Translate text="button_ok" />
          </button>
        </div>
      </AlertDialog>
    );
  }

  mapObjectToList(object) {
    return Object.keys(object).map(key => {
      return { id: key, name: object[key] };
    });
  }

  getDuration(start, end) {
    return Number(moment.duration(end.diff(start)).asHours());
  }

  changeStartDate(value) {
    const { recordList, event, isNew } = this.state;
    const targetIndex = recordList.findIndex(r => r.row_id === event.row_id);
    const eventForm = isNew
      ? { ...this.state.eventForm }
      : { ...recordList[targetIndex] };

    let start = moment(value);
    let end = moment(value).add(eventForm.duration, "hours");
    eventForm.end_date_time = end.format("YYYY-MM-DDTHH:mm");
    eventForm.start_date_time = start.format("YYYY-MM-DDTHH:mm");

    if (isNew) {
      this.setState({ eventForm });
    } else {
      recordList[targetIndex] = { ...eventForm };
      this.setState({
        recordList
      });
    }
  }

  changeEndDate(value) {
    const { recordList, event, isNew } = this.state;
    const targetIndex = recordList.findIndex(r => r.row_id === event.row_id);
    const eventForm = isNew
      ? { ...this.state.eventForm }
      : { ...recordList[targetIndex] };

    let end = moment(value);
    let start = moment(eventForm.start_date_time);
    if (!end.isAfter(start)) {
      end = start;
    }
    const duration = this.getDuration(start, end);
    eventForm.end_date_time = end.format("YYYY-MM-DDTHH:mm");
    eventForm.duration = Number(duration.toFixed(2));
    eventForm.start_date_time = start.format("YYYY-MM-DDTHH:mm");

    if (isNew) {
      this.setState({ eventForm });
    } else {
      recordList[targetIndex] = { ...eventForm };
      this.setState({
        recordList
      });
    }
  }

  changeDuration(value) {
    const { recordList, event, isNew } = this.state;
    const targetIndex = recordList.findIndex(r => r.row_id === event.row_id);
    const eventForm = isNew
      ? { ...this.state.eventForm }
      : { ...recordList[targetIndex] };

    let end = moment(eventForm.start_date_time).add(value, "hours");
    eventForm.end_date_time = end.format("YYYY-MM-DDTHH:mm");
    eventForm.duration = value;

    if (isNew) {
      this.setState({ eventForm });
    } else {
      recordList[targetIndex] = { ...eventForm };
      this.setState({
        recordList
      });
    }
  }

  isLinkedToPanelEmpty() {
    const { event } = this.state;
    if (event.client_partner || event.lead || event.contact_partner) {
      return false;
    }
    return true;
  }

  renderToolbar() {
    const { recordList, eventForm, isNew } = this.state;
    const original = this.state.event;
    let event = {};
    if (isNew) {
      event = { ...eventForm };
    } else {
      event = recordList.find(r => r.row_id === original.row_id) || {};
    }
    return (
      <Toolbar noshadow modifier="transparent" style={{ background: "#fff" }}>
        <div className="left left-icon-width">
          <ToolbarButton
            onClick={() => this.onBackButtonClick()}
            style={{ color: "gray" }}
          >
            <Icon icon="chevron-left" />
          </ToolbarButton>
        </div>
        <div
          className="center ellipse-toolbar left-align-title"
          style={{ color: "#000" }}
        >
          <span
            onClick={() => this.onBackButtonClick()}
            style={{ display: "inline-block" }}
          >
            {event.subject}
          </span>
        </div>

        <div
          key="1"
          className="right right-icons"
          style={{ color: "#717171", justifyContent: "flex-end" }}
        >
          <PageElement key="delete" offline={!event.id}>
            {this.state.edit ? (
              <div
                key="cancel"
                style={{
                  marginRight: 5,
                  color: "rgba(44, 196,211,1)",
                  display: isNew ? "none" : "inherit"
                }}
                className="round-icon"
                onClick={() => this.closeEdit(true)}
              >
                <Icon icon="fa-close" />
              </div>
            ) : (
              <div
                key="delete"
                style={{ color: "#F44336", marginRight: 5 }}
                className="round-icon"
                onClick={() => this.removeRecord(event)}
              >
                <Icon icon="fa-trash" />
              </div>
            )}
          </PageElement>
          <PageElement key="edit" offline={!event.id}>
            {this.state.edit ? (
              <div
                onClick={() => this.saveRecord()}
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
            ) : (
              <div
                onClick={() => this.editRecord()}
                style={{ padding: "5px 15px 5px 0px" }}
              >
                <div
                  key="edit"
                  style={{ color: "rgba(44, 196,211,1)" }}
                  className="round-icon"
                >
                  <Icon icon="fa-pencil" />
                </div>
              </div>
            )}
          </PageElement>
        </div>
      </Toolbar>
    );
  }

  searchCallType(e, callType) {
    const data = this.mapObjectToList(callType);
    const { search = {} } = e;
    const fields = search.fields || [];
    const field = fields[0];
    let newData = [];
    if (field) {
      data.forEach(d => {
        const str = d[field];
        if (str.indexOf(search.value) !== -1) {
          newData.push(d);
        }
      });
    } else {
      newData = data;
    }
    newData.forEach((d, i) => {
      newData[i]["name"] = translate(`Event.${d.name}`);
    });
    return Promise.resolve({ data: newData, total: newData.length });
  }

  manyToOneProps = (name, value, label, placeholder) => ({
    edit: this.state.edit,
    navigator: this.props.navigator,
    targetName: name,
    displayField: name,
    value,
    fieldLabel: label,
    placeholder: placeholder
  });

  renderItem(eventForm) {
    const { isNew, event } = this.state;
    let eventTypeText = translate(`Event.${typeSelect[eventForm.type_select]}`);
    if (
      typeSelect[eventForm.type_select] === "Call" &&
      eventForm.call_type_select
    ) {
      eventTypeText = `${eventTypeText} - ${translate(
        `Event.${callType[eventForm.call_type_select]}`
      )}`;
    } else if (
      typeSelect[eventForm.type_select] === "Meeting" &&
      eventForm.meeting_type
    ) {
      eventTypeText = `${eventTypeText} - ${eventForm.meeting_type &&
        eventForm.meeting_type.name}`;
    }

    return (
      <div style={{ marginBottom: 25 }}>
        <CardView principalView>
          {this.state.edit ? (
            <div style={{ padding: "10px 10px 10px 15px" }}>
              {this.hasField("status_select") && (
                <CardView.FieldWrapper
                  fieldLabel={this.getFieldLabel("status_select")}
                  edit={this.state.edit}
                >
                  <Select
                    className="status-select-input"
                    value={`${eventForm.status_select}`}
                    onChange={e =>
                      this.changeField("status_select", e.target.value)
                    }
                    style={{ width: "100%" }}
                  >
                    <option disabled value></option>
                    {eventForm.type_select === 3
                      ? Object.keys(taskStatusSelect).map(
                          (s, i) =>
                            ([null, undefined].includes(event.status_select) ||
                              s >= event.status_select) && (
                              <option key={i} value={s}>
                                {translate(`Event.${taskStatusSelect[s]}`)}
                              </option>
                            )
                        )
                      : Object.keys(statusSelect).map(
                          (s, i) =>
                            ([null, undefined].includes(event.status_select) ||
                              s >= event.status_select) && (
                              <option key={i} value={s}>
                                {translate(`Event.${statusSelect[s]}`)}
                              </option>
                            )
                        )}
                  </Select>
                </CardView.FieldWrapper>
              )}
              {this.hasField("type_select") && (
                <CardView.FieldWrapper
                  fieldLabel={this.getFieldLabel("type_select")}
                  edit={this.state.edit}
                >
                  <Select
                    className="status-select-input"
                    value={`${eventForm.type_select}`}
                    onChange={e =>
                      this.changeField("type_select", e.target.value)
                    }
                    style={{ width: "100%" }}
                  >
                    <option disabled value></option>
                    {Object.keys(typeSelect).map((s, i) => (
                      <option key={i} value={s}>
                        {translate(`Event.${typeSelect[s]}`)}
                      </option>
                    ))}
                  </Select>
                </CardView.FieldWrapper>
              )}
              {typeSelect[eventForm.type_select] === "Meeting" &&
                this.hasField("meeting_type") && (
                  <RenderManyToOne
                    name="meeting_type"
                    searchAPI={e =>
                      this.props.event.refs.meetingtype.searchAll(e)
                    }
                    onChange={e =>
                      this.changeField("meeting_type", e.target.value)
                    }
                    {...this.manyToOneProps(
                      "name",
                      eventForm.meeting_type,
                      this.getFieldLabel("meeting_type"),
                      translate("select_meeting_type")
                    )}
                  />
                )}
              {typeSelect[eventForm.type_select] === "Call" &&
                this.hasField("call_type_select") && (
                  <RenderManyToOne
                    name="call_type_select"
                    searchAPI={e => this.searchCallType(e, callType)}
                    onChange={e =>
                      this.changeField("call_type_select", e.target.value)
                    }
                    {...this.manyToOneProps(
                      "name",
                      eventForm.call_type_select,
                      this.getFieldLabel("call_type_select"),
                      translate("Event.callTypeTitle")
                    )}
                  />
                )}
              {this.hasField("subject") && (
                <CardView.InputField
                  edit={this.state.edit}
                  title={this.getFieldLabel("subject")}
                  onChange={e => this.changeField("subject", e.target.value)}
                  value={eventForm.subject}
                />
              )}
            </div>
          ) : (
            <div
              style={{ paddingBottom: 10, paddingTop: 20, textAlign: "center" }}
            >
              <CardView.TagButton>
                {translate(`Event.${statusSelect[eventForm.status_select]}`)}
              </CardView.TagButton>
              <CardView.InputField
                value={eventForm.subject}
                textClassName="lead-person-name"
                className="principal-details-field"
                style={{ marginTop: 25, marginBottom: 2 }}
              />
              <CardView.InputField
                value={eventTypeText}
                textClassName="lead-assigned-user"
                className="principal-details-field"
              />
              {(eventForm.client_partner ||
                eventForm.contact_partner ||
                eventForm.lead) && (
                <div className="linkto-view">
                  <div>{translate("linkedto_panel")} : </div>
                  <div className="linkto-field-list">
                    <span>
                      {eventForm.client_partner &&
                        `${eventForm.client_partner.full_name} (${translate(
                          "Event.clientPartner"
                        )})`}
                    </span>
                    <span>
                      {eventForm.contact_partner &&
                        `${eventForm.contact_partner.full_name} (${translate(
                          "Event.contactPartner"
                        )})`}
                    </span>
                    <span>
                      {eventForm.lead &&
                        `${eventForm.lead.full_name} (${translate(
                          "Event.lead"
                        )})`}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
          {!isNew && (
            <CardView.ActionView>
              <CardView.ActionItem
                icon="md-calendar"
                onClick={() => this.createEvent()}
              >
                <Translate text="event_new_event" />
              </CardView.ActionItem>
              <CardView.ActionItem
                icon="fa-handshake-o"
                onClick={() => this.createOpportunity()}
              >
                <Translate text="new_opportunity" />
              </CardView.ActionItem>
            </CardView.ActionView>
          )}
        </CardView>
        <Tabs
          tabs={[
            { title: <Translate text="event_details" />, value: 1 },
            {
              title: `${translate("common.comments")}(${this.state.total})`,
              value: 2,
              hide: () => this.state.isNew
            }
          ]}
          activeTab={this.state.overviewPanel}
          onChange={e => this.setState({ overviewPanel: e })}
        />

        <div className="opportunity-tab-container">
          {this.state.overviewPanel === 2 && this.renderCommentList()}

          <CardView
            className="opportunity-details-tab"
            hidden={this.state.overviewPanel !== 1}
          >
            {this.hasField("start_date_time") && (
              <CardView.DateTimeField
                edit={this.state.edit}
                title={this.getFieldLabel("start_date_time")}
                value={eventForm.start_date_time}
                onChange={e => {
                  this.changeStartDate(e.target.value);
                }}
              />
            )}
            {this.hasField("end_date_time") && eventForm.duration !== 0 && (
              <CardView.DateTimeField
                edit={this.state.edit}
                title={this.getFieldLabel("end_date_time")}
                value={eventForm.end_date_time}
                onChange={e => {
                  this.changeEndDate(e.target.value);
                }}
              />
            )}
            {this.hasField("duration") && (
              <CardView.Number
                edit={this.state.edit}
                type="tel"
                title={this.getFieldLabel("duration")}
                value={eventForm.duration}
                onChange={e => this.changeDuration(e.target.value)}
                defaultValue="0"
              />
            )}
          </CardView>
        </div>
        {typeSelect[eventForm.type_select] !== "Call" &&
          this.hasField("description") && (
            <CardView
              title={this.getFieldLabel("description")}
              hidden={this.state.overviewPanel !== 1}
            >
              {this.state.edit ? (
                <EditorComponent
                  content={eventForm.description}
                  onContentChange={e => this.changeField("description", e)}
                  style={{ minHeight: 100 }}
                />
              ) : (
                <CardView.TextArea
                  edit={false}
                  value={eventForm.description}
                  onChange={e =>
                    this.changeField("description", e.target.value)
                  }
                />
              )}
            </CardView>
          )}
        <Tabs
          tabs={[
            { title: <Translate text="assignedto_panel" />, value: 1 },
            { title: <Translate text="linkedto_panel" />, value: 2 }
          ]}
          activeColor="#e4aa3a"
          activeTab={this.state.secondTabber}
          onChange={e => this.setState({ secondTabber: e })}
        />
        <div className="second-tabber">
          <CardView
            className="assigned-to-tab"
            hidden={this.state.secondTabber !== 1}
          >
            {this.hasField("user") && (
              <RenderManyToOne
                name="user"
                searchAPI={e => this.props.event.refs.user.searchAll(e)}
                onChange={e => this.changeField("user", e.target.value)}
                {...this.manyToOneProps(
                  "full_name",
                  eventForm.user,
                  this.getFieldLabel("user"),
                  translate("select_user")
                )}
              />
            )}
          </CardView>
          <CardView
            className="linked-to-tab"
            hidden={this.state.secondTabber !== 2}
          >
            {this.hasField("client_partner") && (
              <RenderManyToOne
                name="client_partner"
                searchAPI={e => this.props.event.refs.crmcustomer.searchAll(e)}
                onChange={e =>
                  this.changeField("client_partner", e.target.value)
                }
                {...this.manyToOneProps(
                  "full_name",
                  eventForm.client_partner,
                  this.getFieldLabel("client_partner"),
                  translate("select_customer")
                )}
              />
            )}
            {this.hasField("contact_partner") && (
              <RenderManyToOne
                name="contact_partner"
                searchAPI={e => {
                  // if (partner && partner.id) {
                  //   e.data = { criteria: [{ fieldName: 'mainPartner.id', operator: '=', value: partner.id }] };
                  // }
                  return this.props.event.refs.crmcontact.searchAll(e);
                }}
                onChange={e =>
                  this.changeField("contact_partner", e.target.value)
                }
                {...this.manyToOneProps(
                  "full_name",
                  eventForm.contact_partner,
                  this.getFieldLabel("contact_partner"),
                  translate("select_contact")
                )}
              />
            )}
            {this.hasField("lead") && (
              <RenderManyToOne
                name="lead"
                searchAPI={e => this.props.event.refs.lead.searchAll(e)}
                onChange={e => this.changeField("lead", e.target.value)}
                {...this.manyToOneProps(
                  "full_name",
                  eventForm.lead,
                  this.getFieldLabel("lead"),
                  translate("select_lead")
                )}
              />
            )}
          </CardView>
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
    const { hookState, isLoading,event } = this.state;
    let hookContent = null;
    if (hookState === "action") {
      hookContent = this.renderPullHookLoader();
    }
    return (
      <PullHook
        disabled={isLoading}
        onChange={e => this.setState({ hookState: e.state })}
        onLoad={done =>
          {  this.fetchNewData(event)
            done();
          }

        }
        fixedContent={true}
      >
        {hookContent}
      </PullHook>
    );
  }

  render() {
    const { recordList, isLoading, eventForm, isNew } = this.state;
    return (
      <Page
        {...this.props}
        renderToolbar={() => this.renderToolbar()}
        isRecordChanged={() => this.isRecordChanged(true)}
        renderModal={
          isLoading && (
            <Modal className="auth-modal swiper-view-loader" isOpen={isLoading}>
              <ProgressCircular indeterminate />
            </Modal>
          )
        }
      >
        {this.renderAlertBox()}
        {isNew ? (
          this.renderItem(eventForm)
        ) : (
          <React.Fragment>
            {this.renderPullHook()}
            <SwiperView
              recordList={recordList}
              renderItem={record => this.renderItem(record)}
              onActive={record => this.onRecordSwipe(record)}
              onInitSwiper={swiper => (this.swiper = swiper)}
            />
          </React.Fragment>
        )}
      </Page>
    );
  }
}

EventView.propTypes = {
  navigator: PropTypes.any,
  route: PropTypes.any
};

const mapPropsToState = state => {
  return { user_data: state.user, app_state: state.app };
};

export default connect(reduxConnect(mapPropsToState)(EventView));
