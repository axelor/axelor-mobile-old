import React from "react";
import PropTypes from "prop-types";
import moment from "moment";
import connect from "../../connect/crm-lead";
import {
  List,
  ListItem,
  Toolbar,
  ToolbarButton,
  Icon,
  ProgressCircular,
  Select,
  PullHook
} from "react-onsenui";
import ons from "onsenui";
import { connect as reduxConnect } from "react-redux";

import Page, { PageElement } from "../../../page";
import Translate, { translate } from "../../../../locale";
import "./index.css";
import { statusSelect, titleSelect } from "./../common";
import OpportunityView from "./../../crm-opportunity/OpportunityView";
import EventView from "./../../crm-events/EventView";
import EventObjects from "./../../crm-events/common";
import MailPage from "./../../../email/mail";
import { CardView, TabberView, SwiperView } from "./../../../../components";
import { AlertDialog, Modal } from "react-onsenui";
import PageCommentList, {
  RenderManyToOne,
  Tabs
} from "../../../page-comment-list";

class LeadView extends PageCommentList {
  constructor(props) {
    super(props);
    const { info } = this.props.user_data.data;
    const activeTeam = info.active_team || null;
    this.state = {
      lead: {},
      leadForm: {
        title_select: null,
        name: null,
        first_name: null,
        company: null,
        industry_sector: null,
        status_select: 1,
        subject: null,
        job_title: null,
        mobile_phone: null,
        fixed_phone: null,
        user: {
          id: props.user_data.data.info["user.id"],
          full_name: props.user_data.data.info["user.name"]
        },
        primary_address: null,
        primary_city: null,
        primary_postal_code: null,
        primary_state: null,
        primary_country: null,
        team: activeTeam ? { id: activeTeam.id, name: activeTeam.name } : null,
        source: null,
        email_address: null,
        description: null
      },
      recordList: [],
      upcomingEventList: [],
      completedEventList: [],
      dashletType: 1,
      overviewPanel: 1,
      activityLoading: false,
      submitError: {
        content: null,
        title: null
      },
      hookState: "initial",
      edit: false,
      isNew: false,
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
    const { data, getRecordsByIndex } = route;
    if (data && data.id !== undefined) {
      if (getRecordsByIndex) {
        const records = getRecordsByIndex(data, true);
        const targetIndex = records.findIndex(r => r.id === data.id);
        this.swiper.slideTo(targetIndex, 0, true);
        this.setState({ recordList: records, activeIndex: targetIndex });
        this.fetchNewData(data);
      }
    } else {
      this.setState({ isNew: true, edit: true });
    }
  }

  getApi() {
    return this.props.lead;
  }

  getCurrentRecord() {
    return this.state.lead;
  }

  fetchNewData(data) {
    const { fetch } = this.props.lead;
    const { limit, offset } = this.state;
    this.setState({ isLoading: true }, () => {
      setTimeout(() => {
        fetch(data).then(res => {
          const { data } = res;
          if (data && data.length > 0) {
            const lead = Object.assign({}, data[0]);
            const { recordList } = this.state;
            const targetIndex = recordList.findIndex(r => r.id === lead.id);
            recordList[targetIndex] = Object.assign({}, lead);
            this.setState({ lead, recordList, isLoading: false }, () => {
              this.getDashletData();
              this.getAllComment(limit, offset);
            });
          }
        });
      }, 300);
    });
  }

  sendEmail() {
    const contextData = {
      model: "com.axelor.apps.crm.db.Lead",
      tag: "Lead",
      templateContextModel: "com.axelor.apps.crm.db.Lead",
      prop: this.props.lead
    };
    this.props.navigator.pushPage(
      {
        component: MailPage,
        path: "MailPage",
        viewProps: this.props.route,
        data: { user: { ...this.state.lead }, contextData }
      },
      { animation: "none" }
    );
  }

  getDashletData() {
    const { lead } = this.state;
    const { search } = this.props.lead.refs.event;
    const ids = lead.event_list ? lead.event_list.map(event => event.id) : [];
    if (ids.length === 0) {
      this.setState({ eventList: [] });
      return;
    }
    this.setState({ activityLoading: true, eventList: [] });
    setTimeout(() => {
      search({ id: ids || [] }).then(({ data = [] }) => {
        if (data) {
          const today = moment(new Date());
          const upcomingEventList = data.filter(d =>
            today.isBefore(d.start_date_time)
          );
          this.setState({ upcomingEventList, activityLoading: false });
          const completedEventList = data.filter(d =>
            today.isAfter(d.end_date_time)
          );
          this.setState({ completedEventList, activityLoading: false });
        }
        this.setState({ activityLoading: false });
      });
    }, 500);
  }

  changeField(field, value) {
    const { lead, recordList, leadForm, isNew } = this.state;
    if (isNew) {
      leadForm[field] = value;
      this.setState({ leadForm });
    } else {
      const targetIndex = recordList.findIndex(r => r.id === lead.id);
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
      const { recordList, lead } = this.state;
      const targetIndex = recordList.findIndex(record => record.id === lead.id);
      if (
        JSON.stringify(recordList[targetIndex]) !== JSON.stringify(lead) &&
        close
      ) {
        ons.notification
          .confirm(translate("Alert.confirmClose"), {
            title: translate("Alert.confirm"),
            id: "crm-lead",
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
    const { recordList, lead } = this.state;
    return new Promise((resolve, reject) => {
      const targetIndex = recordList.findIndex(record => record.id === lead.id);
      this.isRecordChanged(close).then(ok => {
        if (ok) {
          recordList[targetIndex] = lead;
          this.setState({ edit: false, lead, recordList });
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

  validateEmail(emailField = {}) {
    const { address } = emailField;
    var reg = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+?\.[a-zA-Z]{2,3}$/;
    return reg.test(address);
  }

  validateData(leadForm) {
    let isValid = true;
    if (!leadForm.name || !(leadForm.name.length > 0)) {
      isValid = false;
      this.setState({
        submitError: {
          title: translate("Alert.saveErrorTitle"),
          content: translate("Alert.nameRequired")
        }
      });
    }
    // validate an email
    if (leadForm.email_address && !this.validateEmail(leadForm.email_address)) {
      isValid = false;
      this.setState({
        submitError: {
          title: translate("Alert.saveErrorTitle"),
          content: translate("Alert.invalidEmail")
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
    const { lead, recordList, leadForm, isNew } = this.state;
    const { onUpdate, onNewUpdate } = this.props.route;
    const { add, update } = this.props.lead;
    if (isNew) {
      if (!this.validateData(leadForm)) {
        this.setState({ showErrorDialog: true });
        return;
      }
      this.startLoading();
      add(leadForm).then(res => {
        if (res.status === -1) {
          ons.notification.alert(res.error.message, {
            id: "lead-error"
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
      const record = recordList.find(r => r.row_id === lead.row_id);
      if (!this.validateData(record)) {
        this.setState({ showErrorDialog: true });
        return;
      }
      if (record.id !== undefined) {
        this.startLoading();
        update(record).then(res => {
          if (res.status === -1) {
            ons.notification.alert(res.error.message, {
              id: "lead-error"
            });
            this.setState({ isLoading: false });
          } else {
            const { data } = res;
            if (data && data.length > 0) {
              const newRecord = data[0];
              if (onUpdate) {
                onUpdate(newRecord);
              }
              this.closeEdit().then(res => {
                this.fetchNewData(newRecord);
              });
            } else {
              this.closeLoading();
            }
          }
        });
      }
    }
  }

  removeRecord(record) {
    const { remove } = this.props.lead;
    ons.notification
      .confirm(translate("Alert.confirmDelete"), {
        title: translate("Alert.confirm"),
        id: "remove-lead"
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
    const { lead } = this.state;
    this.props.navigator.pushPage(
      {
        component: EventView,
        path: "EventView",
        record: { lead: { id: lead.id, company: lead.company, ...lead } }
      },
      { animation: "none" }
    );
  }

  createOpportunity() {
    const { lead } = this.state;
    this.props.navigator.pushPage(
      {
        component: OpportunityView,
        path: "OpportunityView",
        record: { lead: { id: lead.id, company: lead.company, ...lead } }
      },
      { animation: "none" }
    );
  }

  hasField(fieldName) {
    const { fields } = this.props.lead;
    const targetIndex = fields.findIndex(field => field.name === fieldName);
    return targetIndex !== -1 ? true : false;
  }

  isFollowUpPanelEmpty() {
    const { lead } = this.state;
    if (lead.user || lead.team) {
      return false;
    }
    return true;
  }

  isContactPanelEmpty() {
    const { lead } = this.state;
    if (lead.mobile_phone || lead.fixed_phone || lead.email_address) {
      return false;
    }
    return true;
  }

  onSuccess(result) {
    console.log("Success:" + result);
  }

  onError(result) {
    console.log("Error:" + result);
    ons.notification.alert(result, {
      id: "phone-error"
    });
  }

  onMobileClick(e, leadForm) {
    e.preventDefault();
    window.plugins.CallNumber &&
      window.plugins.CallNumber.callNumber(
        this.onSuccess,
        this.onError,
        leadForm.mobile_phone,
        true
      );
  }

  isPrimaryAddressEmpty() {
    const { lead } = this.state;
    if (
      lead.primary_address ||
      lead.primary_city ||
      lead.primary_country ||
      lead.primary_state ||
      lead.primary_postal_code
    ) {
      return false;
    }
    return true;
  }

  getFieldLabel(fieldName) {
    const { fields } = this.props.lead;
    const targetIndex = fields.findIndex(field => field.name === fieldName);
    return targetIndex !== -1
      ? translate(fields[targetIndex].label)
      : undefined;
  }

  mapObjectToList(object) {
    return Object.keys(object).map(key => {
      return { id: key, name: object[key] };
    });
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

  openEvent(data) {
    const { eventList } = this.state;
    this.props.navigator.pushPage(
      {
        component: EventView,
        path: "EventView",
        data: data,
        removeRecord: record => {
          const targetIndex = eventList.findIndex(e => e.id === record.id);
          let newList = eventList.splice(targetIndex, 1);
          this.setState({ eventList: newList });
        },
        onUpdate: record => {
          const targetIndex = eventList.findIndex(e => e.id === record.id);
          eventList[targetIndex] = { ...record };
          this.setState({ eventList });
        }
      },
      { animation: "none" }
    );
  }

  renderRowItem(item, index) {
    return (
      <ListItem
        key={index}
        modifier="longdivider"
        className="dashlet-row"
        onClick={() => this.openEvent(item)}
      >
        <div className="customer-item">
          <span className="dashlet-list-head">{item.subject}</span>
          <span className="dashlet-list-normal">
            {translate(
              `Event.${EventObjects.statusSelect[item.status_select]}`
            )}
          </span>
          <span className="dashlet-list-normal">
            {translate(`Event.${EventObjects.typeSelect[item.type_select]}`)}
          </span>
        </div>
      </ListItem>
    );
  }

  renderToolbar() {
    const { recordList, isNew } = this.state;
    const original = this.state.lead;
    let lead = {};
    if (isNew) {
      lead = this.state.leadForm;
    } else {
      lead = recordList.find(r => r.row_id === original.row_id) || {};
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
            {lead.first_name} {lead.name}
          </span>
        </div>
        <div
          key="1"
          className="right right-icons"
          style={{ color: "#717171", justifyContent: "flex-end" }}
        >
          <PageElement key="delete" offline={!lead.id}>
            {this.state.edit ? (
              <div
                key="cancel"
                style={{
                  color: "rgba(44, 196,211,1)",
                  marginRight: 5,
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
                onClick={() => this.removeRecord(lead)}
              >
                <Icon icon="fa-trash" />
              </div>
            )}
          </PageElement>
          <PageElement key="edit" offline={!lead.id}>
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

  manyToOneProps = (name, value, label, placeholder) => ({
    edit: this.state.edit,
    navigator: this.props.navigator,
    targetName: name,
    displayField: name,
    value,
    fieldLabel: label,
    placeholder: placeholder
  });

  renderLeadBasicFields(leadForm) {
    const { lead } = this.state;
    return (
      <div>
        {this.hasField("title_select") && (
          <CardView.FieldWrapper
            fieldLabel={this.getFieldLabel("title_select")}
            edit={this.state.edit}
          >
            <Select
              className="status-select-input"
              value={`${leadForm.title_select}`}
              onChange={e => this.changeField("title_select", e.target.value)}
              style={{ width: "100%" }}
            >
              <option disabled value></option>
              {Object.keys(titleSelect).map((s, i) => (
                <option key={i} value={s}>
                  {translate(`Lead.${titleSelect[s]}`)}
                </option>
              ))}
            </Select>
          </CardView.FieldWrapper>
        )}
        {this.hasField("name") && (
          <CardView.InputField
            edit={this.state.edit}
            title={this.getFieldLabel("name")}
            onChange={e => this.changeField("name", e.target.value)}
            value={leadForm.name}
          />
        )}
        {this.hasField("first_name") && (
          <CardView.InputField
            edit={this.state.edit}
            title={this.getFieldLabel("first_name")}
            onChange={e => this.changeField("first_name", e.target.value)}
            value={leadForm.first_name}
          />
        )}
        {this.hasField("status_select") && (
          <CardView.FieldWrapper
            fieldLabel={this.getFieldLabel("status_select")}
            edit={this.state.edit}
          >
            <Select
              className="status-select-input"
              value={`${leadForm.status_select}`}
              onChange={e => this.changeField("status_select", e.target.value)}
              style={{ width: "100%" }}
            >
              <option disabled value></option>
              {Object.keys(statusSelect).map(
                (s, i) =>
                  ([null, undefined].includes(lead.status_select) ||
                    s >= lead.status_select) && (
                    <option key={i} value={s}>
                      {translate(`Lead.${statusSelect[s]}`)}
                    </option>
                  )
              )}
            </Select>
          </CardView.FieldWrapper>
        )}
        {this.hasField("user") && (
          <RenderManyToOne
            name="user"
            searchAPI={e => this.props.lead.refs.user.searchAll(e)}
            onChange={e => this.changeField("user", e.target.value)}
            {...this.manyToOneProps(
              "full_name",
              leadForm.user,
              this.getFieldLabel("user"),
              translate("select_user")
            )}
          />
        )}
      </div>
    );
  }

  renderLeadBasic(leadForm) {
    return (
      <CardView className="lead-principal-tab">
        {this.renderLeadBasicFields(leadForm)}
      </CardView>
    );
  }

  /* render lead view */
  renderItem(leadForm) {
    const { activityLoading, isNew, edit } = this.state;
    const fullName = `${translate(
      "Lead." + titleSelect[leadForm.title_select]
    ) || ""} ${leadForm.first_name || ""} ${leadForm.name || ""}`;

    return (
      <div style={{ marginBottom: 25 }}>
        {isNew && edit ? (
          this.renderLeadBasic(leadForm)
        ) : (
          <CardView principalView>
            {edit ? (
              <div style={{ padding: "10px 10px 10px 15px" }}>
                {this.renderLeadBasicFields(leadForm)}
              </div>
            ) : (
              <div
                style={{
                  paddingBottom: 10,
                  paddingTop: 20,
                  textAlign: "center"
                }}
              >
                <CardView.TagButton>
                  {translate(`Lead.${statusSelect[leadForm.status_select]}`)}
                </CardView.TagButton>
                <CardView.InputField
                  value={fullName}
                  textClassName="lead-person-name"
                  className="principal-details-field"
                  style={{ marginTop: 25, marginBottom: 2 }}
                />
                <CardView.InputField
                  value={leadForm.user && leadForm.user.full_name}
                  textClassName="lead-assigned-user"
                  className="principal-details-field"
                />
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
                {this.props.app_state.mode === "online" && (
                  <CardView.ActionItem
                    icon="md-email"
                    onClick={() => this.sendEmail()}
                  >
                    <Translate text="send_mail" />
                  </CardView.ActionItem>
                )}
                <CardView.ActionItem
                  icon="fa-handshake-o"
                  onClick={() => this.createOpportunity()}
                >
                  <Translate text="new_opportunity" />
                </CardView.ActionItem>
              </CardView.ActionView>
            )}
          </CardView>
        )}
        <CardView>
          {this.hasField("mobile_phone") && (
            <CardView.InputField
              edit={this.state.edit}
              title={this.getFieldLabel("mobile_phone")}
              onChange={e => this.changeField("mobile_phone", e.target.value)}
              type="tel"
              value={leadForm.mobile_phone}
              onClick={e => this.onMobileClick(e, leadForm)}
            />
          )}
          {this.hasField("fixed_phone") && (
            <CardView.InputField
              edit={this.state.edit}
              title={this.getFieldLabel("fixed_phone")}
              onChange={e => this.changeField("fixed_phone", e.target.value)}
              type="tel"
              value={leadForm.fixed_phone}
            />
          )}
          {this.hasField("email_address") && (
            <CardView.InputField
              title={this.getFieldLabel("email_address")}
              edit={this.state.edit}
              value={
                (leadForm.email_address && leadForm.email_address.address) || ""
              }
              onChange={e =>
                this.changeField("email_address", {
                  ...leadForm.email_address,
                  address: e.target.value,
                  version:
                    leadForm.email_address && leadForm.email_address.$version
                })
              }
            />
          )}
        </CardView>
        <Tabs
          tabs={[
            { title: <Translate text="lead_deatils_panel" />, value: 1 },
            {
              title: `${translate("common.comments")}(${this.state.total})`,
              value: 2,
              hide: () => this.state.isNew
            }
          ]}
          activeColor="#2187d4"
          activeTab={this.state.overviewPanel}
          onChange={e => this.setState({ overviewPanel: e })}
        />
        <div className="lead-tab-container">
          {this.state.overviewPanel === 2 && this.renderCommentList()}
          <CardView
            className="lead-details-tab"
            hidden={this.state.overviewPanel !== 1}
          >
            {this.hasField("job_title") && (
              <CardView.InputField
                edit={this.state.edit}
                title={this.getFieldLabel("job_title")}
                onChange={e => this.changeField("job_title", e.target.value)}
                value={leadForm.job_title}
              />
            )}
            {this.hasField("company") && (
              <CardView.InputField
                edit={this.state.edit}
                title={this.getFieldLabel("company")}
                onChange={e => this.changeField("company", e.target.value)}
                value={leadForm.company}
              />
            )}
            {this.hasField("industry_sector") && (
              <RenderManyToOne
                name="industry_sector"
                searchAPI={e => this.props.lead.refs.industry.searchAll(e)}
                onChange={e =>
                  this.changeField("industry_sector", e.target.value)
                }
                {...this.manyToOneProps(
                  "name",
                  leadForm.industry_sector,
                  this.getFieldLabel("industry_sector"),
                  translate("select_industry_sector")
                )}
              />
            )}
            {this.hasField("source") && (
              <RenderManyToOne
                name="source"
                searchAPI={e => this.props.lead.refs.source.searchAll(e)}
                onChange={e => this.changeField("source", e.target.value)}
                {...this.manyToOneProps(
                  "name",
                  leadForm.source,
                  this.getFieldLabel("source"),
                  translate("select_source")
                )}
              />
            )}
          </CardView>
        </div>
        <CardView
          title={`${translate("Address.fullName")}`}
          hidden={this.state.overviewPanel !== 1}
        >
          {this.hasField("primary_address") && (
            <CardView.InputField
              edit={this.state.edit}
              showTitle={false}
              title={this.getFieldLabel("primary_address")}
              className="address-text"
              onChange={e =>
                this.changeField("primary_address", e.target.value)
              }
              value={leadForm.primary_address}
            />
          )}

          {this.hasField("primary_city") && (
            <CardView.InputField
              edit={this.state.edit}
              showTitle={false}
              title={this.getFieldLabel("primary_city")}
              className="address-text"
              onChange={e => this.changeField("primary_city", e.target.value)}
              value={
                leadForm.primary_city && leadForm.primary_city.name ? leadForm.primary_city.name : leadForm.primary_city
              }
            />
          )}
          {this.hasField("primary_state") && (
            <CardView.InputField
              edit={this.state.edit}
              showTitle={false}
              title={this.getFieldLabel("primary_state")}
              className="address-text"
              onChange={e => this.changeField("primary_state", e.target.value)}
              value={leadForm.primary_state && leadForm.primary_state.name}
            />
          )}
          {this.hasField("primary_postal_code") && (
            <CardView.InputField
              edit={this.state.edit}
              showTitle={false}
              title={this.getFieldLabel("primary_postal_code")}
              className="address-text"
              onChange={e =>
                this.changeField("primary_postal_code", e.target.value)
              }
              value={leadForm.primary_postal_code}
            />
          )}
          {this.hasField("primary_country") && (
            <RenderManyToOne
              name="primary_country"
              searchAPI={e => this.props.lead.refs.country.searchAll(e)}
              onChange={e =>
                this.changeField("primary_country", e.target.value)
              }
              {...this.manyToOneProps(
                "name",
                leadForm.primary_country,
                this.getFieldLabel("primary_country"),
                translate("Lead.selectPrimaryCountry")
              )}
            />
          )}
        </CardView>
        <CardView hidden={this.state.overviewPanel !== 1}>
          {this.hasField("description") && (
            <CardView.TextArea
              edit={this.state.edit}
              title={this.getFieldLabel("description")}
              value={leadForm.description}
              onChange={e => this.changeField("description", e.target.value)}
            />
          )}
          {this.hasField("team") && (
            <RenderManyToOne
              name="team"
              searchAPI={e => this.props.lead.refs.team.searchAll(e)}
              onChange={e => this.changeField("team", e.target.value)}
              {...this.manyToOneProps(
                "name",
                leadForm.team,
                this.getFieldLabel("team"),
                translate("select_team")
              )}
            />
          )}
        </CardView>
        {!this.state.isNew && (
          <div>
            <TabberView>
              <TabberView.Tab
                className="event-list-tab"
                titleClassName="event-list-tabber-title"
                activeColor="#E2AA46"
                title={translate("upcoming_events")}
                active={this.state.dashletType === 1}
                onClick={() => this.setState({ dashletType: 1 })}
              />
              <TabberView.Tab
                className="event-list-tab"
                titleClassName="event-list-tabber-title"
                activeColor="#E2AA46"
                title={translate("historical_events_completed")}
                active={this.state.dashletType === 2}
                onClick={() => this.setState({ dashletType: 2 })}
              />
            </TabberView>
            <div className="tab-content">
              {this.state.dashletType === 1 && (
                <div className="upcoming-list">
                  <List
                    dataSource={this.state.upcomingEventList}
                    renderRow={(row, index) => this.renderRowItem(row, index)}
                  />
                  {this.state.upcomingEventList.length === 0 && (
                    <div className="empty-activity-list">
                      <Translate text="common.noUpComingEvent" />
                    </div>
                  )}
                  {activityLoading && (
                    <div className="loader-ui">
                      <ProgressCircular indeterminate />
                    </div>
                  )}
                </div>
              )}
              {this.state.dashletType === 2 && (
                <div className="completed-list">
                  <List
                    dataSource={this.state.completedEventList}
                    renderRow={(row, index) => this.renderRowItem(row, index)}
                  />
                  {this.state.completedEventList.length === 0 && (
                    <div className="empty-activity-list">
                      <Translate text="common.noCompletedEvent" />
                    </div>
                  )}
                  {activityLoading && (
                    <div className="loader-ui">
                      <ProgressCircular indeterminate />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
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
    const { hookState, isLoading,lead } = this.state;
    let hookContent = null;
    if (hookState === "action") {
      hookContent = this.renderPullHookLoader();
    }
    return (
      <PullHook
        disabled={isLoading}
        onChange={e => this.setState({ hookState: e.state })}
        onLoad={done =>
          {  this.fetchNewData(lead)
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
    const { isLoading, recordList, leadForm, isNew } = this.state;
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
          this.renderItem(leadForm)
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

LeadView.propTypes = {
  navigator: PropTypes.any,
  route: PropTypes.any
};

const mapPropsToState = state => {
  return { user_data: state.user, app_state: state.app };
};

export default connect(reduxConnect(mapPropsToState)(LeadView));
