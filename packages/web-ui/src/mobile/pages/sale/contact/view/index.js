import React from "react";
import PropTypes from "prop-types";
import { connect as reduxConnect } from "react-redux";
import { connect } from "@axelor/web-client";
import Page, { PageElement } from "../../../page";
import { CardView, SwiperView } from "../../../../components";
import { openCamera, URLToBlob } from "./../../../../cordova";
import Translate, { translate } from "../../../../locale";
import {
  Toolbar,
  ToolbarButton,
  Icon,
  Modal,
  ProgressCircular,
  AlertDialog,
  Select,
  PullHook
} from "react-onsenui";
import ons from "onsenui";
import MailPage from "../../../email/mail";
import EventView from "../../../crm/crm-events/EventView";
import OpportunityView from "../../../crm/crm-opportunity/OpportunityView";
import { statusSelect, typeSelect } from "../../../crm/crm-events/common";
import moment from "moment";
import PageCommentList, {
  RenderManyToOne,
  RenderManyToMany,
  Tabs
} from "../../../page-comment-list";
import OffLinePage from "../../customer/view/offlinePage";

const getTitleSelect = () => ({
  data: [
    { id: 1, value: translate("common.titleSelectStatus.Mr") },
    { id: 2, value: translate("common.titleSelectStatus.Ms") },
    { id: 3, value: translate("common.titleSelectStatus.Dr") },
    { id: 4, value: translate("common.titleSelectStatus.Prof") }
  ],
  total: 4
});

const ListView = ({ data, fields, onClick, message }) =>
  data && data.length > 0 ? (
    data.map((item, i) => (
      <div className="list-container" key={i} onClick={() => onClick(item.id)}>
        <div className="list-items">
          {fields.map((field, index) => (
            <span style={{ fontWeight: field.varient }} key={index}>
              {field.name === "status_select"
                ? statusSelect[item[field.name]]
                : field.name === "type_select"
                ? typeSelect[item[field.name]]
                : item[field.name]}
            </span>
          ))}
        </div>
      </div>
    ))
  ) : (
    <div
      className="list-container"
      style={{ padding: "15px", justifyContent: "center" }}
    >
      {message}
    </div>
  );

class ViewContact extends PageCommentList {
  constructor(props) {
    super(props);
    const { info } = this.props.user_data.data;
    this.state = {
      activeTab1: 2,
      activeTab2: 1,
      contact: {
        isContact: true,
        currency: info.active_company && info.active_company.currency,
        company_set: [info.active_company],
        team: info.active_team,
        user: {
          id: info["user.id"],
          full_name: info["user.name"]
        }
      },
      recordList: [],
      isLoading: false,
      hookState: "initial",
      edit: false,
      isNew: false,
      showErrorDialog: false,
      submitError: {
        title: null,
        content: null
      },
      commentMessage: "",
      all: [],
      total: 0,
      limit: 4,
      offset: 0,
      activeIndex: 0
    };
  }

  fetchNewData(data) {
    const { fetch } = this.props.contact;
    const { limit, offset } = this.state;

    this.setState({ isLoading: true }, () => {
      setTimeout(() => {
        fetch(data, {
          contactPartnerSet: ["fullName"],
          partnerAddressList: ["fullName"],
          emailAddress: ["fullName"]
        }).then(res => {
          const { data } = res;
          if (data[0] === undefined) {
            this.props.navigator.replacePage({
              component: OffLinePage,
              key: "err_contact_" + Date.now()
            });
          }
          if (data && data.length > 0) {
            const contact = Object.assign({}, data[0]);
            const { recordList } = this.state;
            const targetIndex = recordList.findIndex(r => r.id === contact.id);
            recordList[targetIndex] = Object.assign({}, contact);

            this.setState(
              {
                contact,
                recordList,
                activeTab1: 2,
                activeTab2: 1,
                isLoading: false
              },
              () => {
                this.getAllComment(limit, offset);
                this.showUpcomingEventDashlet();
                this.historicalEventCompletedDashlet();
              }
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
      } else {
        this.setState(
          {
            recordList: [data]
          },
          () => this.fetchNewData(data)
        );
      }
    } else {
      this.setState({
        isNew: true,
        edit: true
      });
    }
  }

  getApi() {
    return this.props.contact;
  }

  getCurrentRecord() {
    return this.state.contact;
  }

  showUpcomingEventDashlet() {
    const { event } = this.props;
    const { contact } = this.state;
    let searchOptions = {};

    searchOptions = {
      fields: [
        {
          fields: [
            { fieldName: "contactPartner.id", value: contact.id, operator: "=" }
          ],
          operator: "or"
        },
        {
          fields: [
            {
              fieldName: "startDateTime",
              value: moment().format(),
              operator: ">"
            }
          ],
          operator: "or"
        }
      ],
      operator: "and"
    };

    let options = { search: searchOptions };
    event.searchAll(options).then(result => {
      const { data } = result;
      this.setState({ upComingEvent: data });
    });
  }

  historicalEventCompletedDashlet() {
    const { event } = this.props;
    const { contact } = this.state;
    let searchOptions = {};

    searchOptions = {
      fields: [
        {
          fields: [
            { fieldName: "contactPartner.id", value: contact.id, operator: "=" }
          ],
          operator: "or"
        },
        {
          fields: [
            {
              fieldName: "startDateTime",
              value: moment().format(),
              operator: "<"
            }
          ],
          operator: "or"
        }
      ],
      operator: "and"
    };

    let options = { search: searchOptions };
    event.searchAll(options).then(result => {
      const { data } = result;
      this.setState({ completedEvent: data });
    });
  }

  selectFile(e) {
    let file = this.fileInput.files[0] || {};
    if (["image/jpeg", "image/jpg", "image/png"].indexOf(file.type) !== -1) {
      const chunkSize = 512 * 1024;
      const chunkProgress = [];
      for (let j = 0; j <= file.size / chunkSize; j += 1) {
        chunkProgress.push(0);
      }
      const end = chunkSize < file.size ? chunkSize : file.size;
      const blob = file.slice(0, end);
      const headers = {
        "X-File-Name": file.name,
        "X-File-Offset": Math.min(0, file.size),
        "X-File-Size": file.size,
        "X-File-Type": file.type
      };

      var reader = new FileReader();
      let { recordList, isNew } = this.state;
      if (isNew) {
        let contact = this.state.contact;
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const base64data = reader.result;
          contact.pictureURL = base64data;
          this.setState({ blob, headers, contact });
        };
      } else {
        const original = this.state.contact;
        const targetIndex = recordList.findIndex(r => r.id === original.id);
        let contact = { ...recordList[targetIndex] };
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const base64data = reader.result;
          contact.pictureURL = base64data;
          recordList[targetIndex] = { ...contact };
          this.setState({ blob, headers, recordList });
        };
      }
    }
  }

  sendEmail() {
    const contextData = {
      model: "com.axelor.apps.base.db.Partner",
      tag: "Partner",
      templateContextModel: "com.axelor.apps.base.db.Partner",
      prop: this.props.contact
    };
    this.props.navigator.pushPage(
      {
        component: MailPage,
        path: "MailPage",
        viewProps: this.props.route,
        data: { user: { ...this.state.contact }, contextData },
        contact: this.props.contact
      },
      { animation: "none" }
    );
  }

  onCreateEvent() {
    let { contact } = this.state;
    this.props.navigator.pushPage(
      {
        component: EventView,
        path: "EventView",
        record: {
          contact_partner: {
            id: contact.id,
            full_name:
              contact.full_name || `${contact.name} ${contact.first_name}`
          },
          client_partner: { ...contact.main_partner }
        }
      },
      { animation: "none" }
    );
  }

  onCreateOpportunity() {
    const { contact } = this.state;
    this.props.navigator.pushPage(
      {
        component: OpportunityView,
        path: "OpportunityView",
        record: {
          partner: {
            id: contact.id,
            full_name:
              contact.full_name || `${contact.name} ${contact.first_name}`
          }
        }
      },
      { animation: "none" }
    );
  }

  changeField(name, value) {
    const { contact, recordList, isNew } = this.state;
    if (isNew) {
      this.setState({
        contact: {
          ...contact,
          [name]: value
        }
      });
    } else {
      const targetIndex = recordList.findIndex(r => r.id === contact.id);
      const record = { ...recordList[targetIndex] };
      record[name] = value;
      recordList[targetIndex] = { ...record };
      this.setState({ recordList });
    }
  }

  isRecordChanged(close) {
    return new Promise((resolve, reject) => {
      const { recordList, contact } = this.state;
      const targetIndex = recordList.findIndex(
        record => record.id === contact.id
      );
      if (
        JSON.stringify(recordList[targetIndex]) !== JSON.stringify(contact) &&
        close
      ) {
        ons.notification
          .confirm(translate("Alert.confirmClose"), {
            title: translate("Alert.confirm"),
            id: "app-contact",
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

  closeEdit(close) {
    const { recordList, contact } = this.state;
    return new Promise((resolve, reject) => {
      const targetIndex = recordList.findIndex(
        record => record.id === contact.id
      );
      this.isRecordChanged(close).then(ok => {
        if (ok) {
          recordList[targetIndex] = contact;
          this.setState({ edit: false, contact, recordList });
          resolve(true);
        }
      });
    });
  }

  validateData() {
    let isValid = true;
    const { contact } = this.state;
    if (!contact.name || !(contact.name.length > 0)) {
      isValid = false;
      this.setState({
        submitError: {
          title: translate("Alert.saveErrorTitle"),
          content: translate("Alert.nameRequired")
        }
      });
      return isValid;
    }
    if (contact.fixed_phone && !(contact.fixed_phone.length >= 8)) {
      isValid = false;
      this.setState({
        submitError: {
          title: translate("Alert.saveErrorTitle"),
          content: translate("Alert.phoneMinimumLenth")
        }
      });
      return isValid;
    }
    if (contact.mobile_phone && !(contact.mobile_phone.length >= 8)) {
      isValid = false;
      this.setState({
        submitError: {
          title: translate("Alert.saveErrorTitle"),
          content: translate("Alert.mobileMinimumLenth")
        }
      });
      return isValid;
    }
    return isValid;
  }

  onUpdate(record) {
    const { update } = this.props.contact;
    update(record).then(res => {
      if (res.status === -1) {
        ons.notification.alert(res.error.message, {
          id: "contact-error"
        });
        this.setState({ isLoading: false });
      } else {
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
      }
    });
  }

  addContact(contact) {
    const { add, fetch } = this.props.contact;
    const { addRecord, updateRecord } = this.props.route;
    add(contact).then(result => {
      if (result.status === -1) {
        ons.notification.alert(result.error.message, {
          id: "contact-error"
        });
        this.setState({ isLoading: false });
      } else {
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
              contact: res.data[0],
              isNew: false,
              edit: false,
              activeTab1: 2
            },
            () => {
              this.onRecordSwipe(res.data[0]);
            }
          );
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

  getHeaders(file = {}) {
    const headers = {
      "X-File-Name": file.name,
      "X-File-Offset": Math.min(0, file.size),
      "X-File-Size": file.size,
      "X-File-Type": file.type
    };

    return headers;
  }

  getBlobAndHeader(url) {
    return new Promise(resolve => {
      URLToBlob(url).then(res => {
        if (res.status === 1) {
          const headers = this.getHeaders(res.file);
          resolve({ headers, blob: res.blob });
        } else {
          resolve({ status: 0 });
        }
      });
    });
  }

  onSave() {
    const { contact, recordList, blob, headers } = this.state;
    const record = recordList.find(r => r.row_id === contact.row_id);

    if (record && record.id !== undefined) {
      this.startLoading();
      let { uploadFile } = this.props.contact;

      if (record.first_name) {
        record.full_name = `${record.name} ${record.first_name}`;
      } else {
        record.full_name = record.name;
      }

      this.getBlobAndHeader(record.pictureURL).then(({ blob, headers }) => {
        if (blob && headers) {
          uploadFile(blob, headers).then(res => {
            record.picture = { ...res.result };
            record.pictureURL = res.url;
            this.onUpdate(record);
          });
        } else {
          this.onUpdate(record);
        }
      });
    } else {
      let { uploadFile } = this.props.contact;

      if (!this.validateData()) {
        this.setState({ showErrorDialog: true });
        return;
      }
      this.startLoading();
      if (contact.first_name) {
        contact.full_name = `${contact.name} ${contact.first_name}`;
      } else {
        contact.full_name = contact.name;
      }

      if (contact.email_address && !contact.email_address.address) {
        contact.email_address = null;
      }
      this.getBlobAndHeader(contact.pictureURL).then(({ blob, headers }) => {
        if (blob && headers) {
          uploadFile(blob, headers).then(res => {
            contact.picture = { ...res.result };
            contact.pictureURL = res.url;
            this.setState({ contact: { ...contact } });
            this.addContact(contact);
          });
        } else {
          this.addContact(contact);
        }
      });
      if (blob && headers) {
        uploadFile(blob, headers).then(res => {
          contact.picture = { ...res.result };
          contact.pictureURL = res.url;
          this.setState({ contact: { ...contact } });
          this.addContact(contact);
        });
      } else {
        this.addContact(contact);
      }
    }
  }

  removeContact(record) {
    const { remove } = this.props.contact;
    ons.notification
      .confirm(translate("Alert.confirmDelete"), {
        title: translate("Alert.confirm"),
        id: "remove-contact"
      })
      .then(res => {
        if (res === 1) {
          remove(record).then(res => {
            if (res.status !== 0) {
              ons.notification.alert(res.error.title, {
                id: "remove-contact-error"
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

  onRemoveImage(e) {
    e.stopPropagation();
    const { contact, recordList } = this.state;
    const record = recordList.find(r => r.id === contact.id);
    record.picture = null;
    record.pictureURL = null;
    this.changeField("picture", null);
    this.changeField("pictureURL", null);
  }

  getFieldLabel(fieldName) {
    const { fields } = this.props.contact;
    const targetIndex = fields.findIndex(field => field.name === fieldName);
    return targetIndex !== -1
      ? translate(fields[targetIndex].label)
      : undefined;
  }

  getCivility(value) {
    const { data } = getTitleSelect();
    return data.find(item => item.id === Number(value));
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
            <Translate text="common.dialog.ok" />
          </button>
        </div>
      </AlertDialog>
    );
  }

  renderUpComingEvent(id) {
    const { upComingEvent } = this.state;
    let index = upComingEvent.findIndex(record => record.id === id);
    this.props.navigator.pushPage({
      component: EventView,
      path: "EventView",
      data: upComingEvent[index],
      removeRecord: record => {
        const targetIndex = upComingEvent.findIndex(l => l.id === record.id);
        upComingEvent.splice(targetIndex, 1);
        this.setState({ upComingEvent });
      },
      onUpdate: record => {
        const targetIndex = upComingEvent.findIndex(l => l.id === record.id);
        upComingEvent[targetIndex] = record;
        this.setState({ upComingEvent });
      }
    });
  }

  renderHistoricalEvent(id) {
    const { completedEvent } = this.state;
    let index = completedEvent.findIndex(record => record.id === id);
    this.props.navigator.pushPage({
      component: EventView,
      path: "EventView",
      data: completedEvent[index],
      removeRecord: record => {
        const targetIndex = completedEvent.findIndex(l => l.id === record.id);
        completedEvent.splice(targetIndex, 1);
        this.setState({ completedEvent });
      },
      onUpdate: record => {
        const targetIndex = completedEvent.findIndex(l => l.id === record.id);
        completedEvent[targetIndex] = record;
        this.setState({ completedEvent });
      }
    });
  }

  openFileGallary() {
    openCamera().then(res => {
      if (res.status === 1) {
        const pictureURL = res.image;
        const { isNew, contact } = this.state;
        if (isNew) {
          contact.pictureURL = pictureURL;
        } else {
          const { recordList } = this.state;
          const targetIndex = recordList.findIndex(r => r.id === contact.id);
          recordList[targetIndex] = { ...recordList[targetIndex], pictureURL };
          this.setState({ recordList });
        }
        this.setState({ contact });
      }
    });
  }
  onSuccess(result){
    console.log("Success:"+result);
  }

  onError(result) {
    console.log("Error:"+result);
    ons.notification.alert(result, {
      id: "phone-error"
    });
  }

  onMobileClick(e,contact){
    e.preventDefault();
    window.plugins.CallNumber && window.plugins.CallNumber.callNumber(this.onSuccess, this.onError, contact.mobile_phone, true);
  }

  renderToolbar() {
    const { recordList, edit, isNew } = this.state;
    const original = this.state.contact;
    let contact = original;
    if (!isNew) {
      contact = recordList.find(r => r.row_id === original.row_id) || {};
    }
    return (
      <Toolbar noshadow modifier="transparent">
        <div className="left left-icon-width">
          <ToolbarButton onClick={() => this.onBackButtonClick()}>
            <Icon icon="chevron-left" />
          </ToolbarButton>
        </div>
        <div className="center left-align-title ellipse-toolbar">
          <span
            onClick={() => this.onBackButtonClick()}
            style={{ display: "inline-block" }}
          >
            {contact && contact.name} {contact && contact.first_name}
          </span>
        </div>
        {isNew ? (
          <div className="right icons" style={{ paddingRight: "10px" }}>
            <PageElement key="save" offline={!contact.id}>
              <div
                style={{ color: "rgba(44, 196,211,1)", marginRight: 10 }}
                className="round-icon"
                onClick={() => this.onSave()}
              >
                <Icon icon="fa-save" />
              </div>
            </PageElement>
          </div>
        ) : edit ? (
          <div className="right icons" style={{ paddingRight: "10px" }}>
            <PageElement key="close" offline={!contact.id}>
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
              <PageElement key="save" offline={!contact.id}>
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
            <PageElement key="delete" offline={!contact.id}>
              <div
                style={{ color: "#F44336", marginRight: 5 }}
                className="round-icon"
              >
                <Icon
                  icon="fa-trash"
                  onClick={() => this.removeContact(contact)}
                />
              </div>
            </PageElement>
            <div
              style={{ padding: "5px 15px 5px 0px" }}
              onClick={() => this.setState({ edit: true })}
            >
              <PageElement key="edit" offline={!contact.id}>
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

  renderItem(contact) {
    const { activeTab1, activeTab2, isNew } = this.state;

    const manyToOneProps = (name, stateKey, label, placeholder) => ({
      edit: this.state.edit,
      navigator: this.props.navigator,
      targetName: name,
      displayField: name,
      value: contact[stateKey],
      fieldLabel: label,
      placeholder: placeholder,
      onChange: e => this.changeField(stateKey, e.target.value)
    });

    return (
      <div style={{ marginBottom: "25px" }}>
        {this.renderAlertBox()}
        <CardView principalView>
          <div
            style={{
              padding:
                this.props.app.mode === "offline"
                  ? "10px 0px 10px 0"
                  : "30px 0px 10px 0"
            }}
          >
            {this.props.app.mode === "offline" ? (
              ""
            ) : (
              <div className="customer-info">
                {this.state.edit ? (
                  <div
                    className="picture-container"
                    onClick={() => this.openFileGallary()}
                  >
                    {contact.pictureURL ? (
                      <div>
                        <img
                          src={contact.pictureURL}
                          style={{ height: 75, width: 75 }}
                          alt="No images"
                        />
                        <div
                          onClick={e => this.onRemoveImage(e)}
                          className="remove-picture-icon-container"
                        >
                          <Icon icon="close" className="remove-picture-icon" />
                        </div>
                      </div>
                    ) : (
                      <div
                        style={{
                          height: 75,
                          width: 75,
                          border: "1px solid #ddd",
                          textAlign: "center",
                          display: "table"
                        }}
                      >
                        <span
                          style={{
                            color: "rgb(113, 113, 113)",
                            display: "table-cell",
                            verticalAlign: "middle"
                          }}
                        >
                          {translate('common.uploadPicture')}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  contact.pictureURL && (
                    <img
                      src={contact.pictureURL}
                      style={{ width: 75, height: 75 }}
                      alt="contact img"
                    />
                  )
                )}
              </div>
            )}
            {!this.state.edit ? (
              <div style={{ textAlign: "center" }}>
                <p className="customer-info-detail">
                  {contact && contact.name} {contact && contact.first_name}
                </p>
                <p className="customer-info-detail">
                  {contact && contact.fixed_phone}
                </p>
                <p className="customer-info-detail">
                  {contact.email_address && contact.email_address.address}
                </p>
                <p className="customer-info-detail">
                  {contact &&
                    contact.main_partner &&
                    contact.main_partner["full_name"]}
                </p>
              </div>
            ) : (
              <div style={{ padding: "10px 10px 10px 15px" }}>
                {/* <RenderManyToOne
                    name="title_select"
                    fieldLabel={this.getFieldLabel('title_select')}
                    placeholder={this.getFieldLabel('title_select')}
                    targetName="value"
                    displayField="value"
                    value={this.getCivility(contact.title_select)}
                    liveSearch={false}
                    searchAPI={() => Promise.resolve(getTitleSelect())}
                    onChange={(e) => this.changeField('title_select', e.target.value.id)}
                    edit={this.state.edit}
                    navigator={this.props.navigator}
                  /> */}
                <CardView.FieldWrapper
                  fieldLabel={this.getFieldLabel("title_select")}
                  edit={this.state.edit}
                >
                  <Select
                    className="status-select-input"
                    value={`${this.getCivility(contact.title_select) &&
                      this.getCivility(contact.title_select).id}`}
                    onChange={e =>
                      this.changeField("title_select", e.target.value)
                    }
                  >
                    {getTitleSelect().data.map((s, i) => (
                      <option key={i} value={s.id}>
                        {s.value}
                      </option>
                    ))}
                  </Select>
                </CardView.FieldWrapper>

                <CardView.InputField
                  edit={this.state.edit}
                  title={this.getFieldLabel("name")}
                  onChange={e => this.changeField("name", e.target.value)}
                  value={contact && contact.name}
                />

                <CardView.InputField
                  edit={this.state.edit}
                  title={this.getFieldLabel("first_name")}
                  onChange={e => this.changeField("first_name", e.target.value)}
                  value={contact && contact.first_name}
                />

                <RenderManyToOne
                  name="main_partner"
                  searchAPI={e => this.props.salecustomer.searchAll(e)}
                  {...manyToOneProps(
                    "full_name",
                    "main_partner",
                    translate("Partner.mainPartner"),
                    translate("common.manyToOneField.selectCompany")
                  )}
                />
              </div>
            )}
          </div>
          {isNew ? (
            ""
          ) : (
            <CardView.ActionView>
              {this.props.app.mode === "online" ? (
                <CardView.ActionItem
                  icon="md-email"
                  onClick={() => this.sendEmail()}
                >
                  <Translate text="common.menu.subMenuMailTitle" />
                </CardView.ActionItem>
              ) : (
                ""
              )}
              <CardView.ActionItem
                className=""
                icon="md-calendar-note"
                onClick={() => this.onCreateEvent()}
              >
                <Translate text="common.menu.subMenuEventTitle" />
              </CardView.ActionItem>
              <CardView.ActionItem
                icon="fa-handshake-o"
                onClick={() => this.onCreateOpportunity()}
              >
                <Translate text="common.menu.subMenuOpportunityTitle" />
              </CardView.ActionItem>
            </CardView.ActionView>
          )}
        </CardView>

        <div style={{ paddingTop: "30px" }}>
          <Tabs
            tabs={[
              { title: <Translate text="Event.contactPartner" />, value: 2 },
              { title: <Translate text="common.filterTab.others" />, value: 3 },
              {
                title: `${translate('common.comments')}(${this.state.total})`,
                value: 1,
                hide: () => this.state.isNew
              }
            ]}
            activeTab={this.state.activeTab1}
            onChange={e => this.setState({ activeTab1: e })}
          />
          {activeTab1 === 1 && this.renderCommentList()}
          <CardView hidden={activeTab1 !== 3}>
            <RenderManyToOne
              name="user"
              searchAPI={e => this.props.user.searchAll(e)}
              {...manyToOneProps(
                "full_name",
                "user",
                translate("common.manyToOneField.assignToLabel"),
                translate("common.manyToOneField.assignedTo")
              )}
            />

            <RenderManyToOne
              name="team"
              searchAPI={e => this.props.team.searchAll(e)}
              {...manyToOneProps(
                "name",
                "team",
                translate("common.manyToOneField.teamLabel"),
                translate("common.manyToOneField.team")
              )}
            />

            <RenderManyToMany
              name="company_set"
              fieldLabel={translate("Partner.companySet")}
              placeholder={translate("common.manyToOneField.selectCompany")}
              targetName="name"
              displayField="name"
              value={contact.company_set}
              searchAPI={e => this.props.company.searchAll(e)}
              onChange={e => this.changeField("company_set", e.target.value)}
              edit={this.state.edit}
              navigator={this.props.navigator}
            />
          </CardView>

          <CardView title={<Translate text="notes" />} hidden={activeTab1 !== 3}>
            <CardView.TextArea
              edit={this.state.edit}
              value={contact.description}
              onChange={e => this.changeField("description", e.target.value)}
            />
          </CardView>

          <CardView hidden={activeTab1 !== 2}>
            <CardView.InputField
              edit={this.state.edit}
              title={this.getFieldLabel("job_title")}
              onChange={e => this.changeField("job_title", e.target.value)}
              value={contact.job_title}
            />

            <CardView.InputField
              edit={this.state.edit}
              title={this.getFieldLabel("fixed_phone")}
              onChange={e => this.changeField("fixed_phone", e.target.value)}
              type="tel"
              counter="8"
              value={contact.fixed_phone}
            />

            <CardView.InputField
              edit={this.state.edit}
              title={this.getFieldLabel("mobile_phone")}
              onChange={e => this.changeField("mobile_phone", e.target.value)}
              type="tel"
              counter="8"
              value={contact.mobile_phone}
              onClick={(e)=>this.onMobileClick(e,contact)}
            />

            <CardView.InputField
              edit={this.state.edit}
              title={this.getFieldLabel("email_address")}
              onChange={e =>
                this.changeField("email_address", {
                  ...contact.email_address,
                  address: e.target.value,
                  version:
                    contact.email_address && contact.email_address.$version
                })
              }
              value={contact.email_address && contact.email_address.address}
            />

            <RenderManyToOne
              name="contact_address"
              searchAPI={e => this.props.address.searchAll(e)}
              {...manyToOneProps(
                "fullName",
                "contact_address",
                translate("Partner.contactAddress"),
                translate("common.manyToOneField.selectAddress")
              )}
            />
          </CardView>

          {!isNew && (
            <div>
              <div style={{ paddingTop: "30px" }}>
                <Tabs
                  tabs={[
                    {
                      title: <Translate text="common.tabBar.upcomingEvents" />,
                      value: 1
                    },
                    {
                      title: (
                        <Translate text="common.tabBar.historicalEvents" />
                      ),
                      value: 2
                    }
                  ]}
                  titleClassName="event-list-tabber-title"
                  activeColor="rgb(226, 170, 70)"
                  activeTab={this.state.activeTab2}
                  onChange={e => this.setState({ activeTab2: e })}
                  className="event-list-tab"
                />
              </div>
              <div>
                {activeTab2 === 1 ? (
                  <ListView
                    data={this.state.upComingEvent}
                    fields={[
                      { name: "subject", varient: 600 },
                      { name: "status_select" },
                      { name: "type_select" }
                    ]}
                    message={translate("common.noUpComingEvent")}
                    onClick={id => this.renderUpComingEvent(id)}
                  />
                ) : (
                  <ListView
                    data={this.state.completedEvent}
                    fields={[
                      { name: "subject", varient: 600 },
                      { name: "status_select", varient: "normal" },
                      { name: "type_select", varient: "normal" }
                    ]}
                    message={translate("common.noCompletedEvent")}
                    onClick={id => this.renderHistoricalEvent(id)}
                  />
                )}
              </div>
            </div>
          )}
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
    const { hookState, isLoading,contact } = this.state;
    let hookContent = null;
    if (hookState === "action") {
      hookContent = this.renderPullHookLoader();
    }
    return (
      <PullHook
        disabled={isLoading}
        onChange={e => this.setState({ hookState: e.state })}
        onLoad={done =>
          {  this.fetchNewData(contact)
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
    const { isLoading, recordList, isNew, contact } = this.state;
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
          this.renderItem(contact)
        ) : (
          // <SwiperView
          //   recordList={recordList}
          //   renderItem={(record) => this.renderItem(record)}
          //   activeIndex={this.state.activeIndex}
          //   onChange={(record, activeIndex) => {
          //     this.setState({ activeIndex });
          //     this.onRecordSwipe(record)
          //   }}
          // />
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

ViewContact.propTypes = {
  navigator: PropTypes.any,
  route: PropTypes.any
};

const mapPropsToState = state => ({ app: state.app, user_data: state.user });
ViewContact = reduxConnect(mapPropsToState)(ViewContact);

const mapConnectToProps = props => {
  const {
    refs: {
      user,
      company,
      metaselect,
      team,
      salecustomer,
      salecontact,
      event,
      address
    },
    ...contact
  } = props;
  return {
    contact,
    user,
    company,
    metaselect,
    team,
    salecustomer,
    salecontact,
    event,
    address
  };
};

const mapConnectConfig = {
  name: "SaleContact",
  refs: [
    {
      model: "User",
      field: "user"
    },
    {
      model: "MetaSelect",
      field: ""
    },
    {
      model: "SaleCustomer",
      field: "main_partner"
    },
    {
      model: "Team",
      field: "team"
    },
    {
      model: "Company",
      field: "company"
    },
    {
      model: "SaleContact",
      field: "contact"
    },
    {
      model: "Event",
      field: ""
    },
    {
      model: "Address",
      field: "contact_address"
    }
  ]
};
export default connect(mapConnectToProps)(ViewContact, mapConnectConfig);
