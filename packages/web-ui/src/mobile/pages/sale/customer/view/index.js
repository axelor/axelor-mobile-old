import React from "react";
import PropTypes from "prop-types";
import { connect as reduxConnect } from "react-redux";
import { connect } from "@axelor/web-client";
import Page, { PageElement } from "../../../page";
import { CardView, SwiperView } from "../../../../components";
import { openCamera, URLToBlob } from "./../../../../cordova";
import {
  Toolbar,
  ToolbarButton,
  Icon,
  ProgressCircular,
  Modal,
  AlertDialog,
  Select,
  PullHook
} from "react-onsenui";
import classNames from "classnames";
import Translate, { translate } from "../../../../locale";
import SaleContacts from "../list";
import CRMContacts from "../../../crm/contacts";
import CreateAddress from "../../address/create";
import ons from "onsenui";
import MailPage from "../../../email/mail";
import EventView from "../../../crm/crm-events/EventView";
import OpportunityView from "../../../crm/crm-opportunity/OpportunityView";
import { statusSelect, typeSelect } from "../../../crm/crm-events/common";
import moment from "moment";
import { CheckBoxInput } from "../../../../components";
import ContactView from "../../contact/view";
import PageCommentList, {
  RenderManyToOne,
  RenderManyToMany,
  Tabs
} from "../../../page-comment-list";
import "./index.css";

const getTitleSelect = () => ({
  data: [
    { id: 1, value: translate("common.titleSelectStatus.Mr") },
    { id: 2, value: translate("common.titleSelectStatus.Ms") },
    { id: 3, value: translate("common.titleSelectStatus.Dr") },
    { id: 4, value: translate("common.titleSelectStatus.Prof") }
  ],
  total: 4
});

const getPartnerTypeStatus = () => ({
  data: [
    { id: 1, value: translate("Partner.partnerTypeSelect.company") },
    { id: 2, value: translate("Partner.partnerTypeSelect.individual") }
  ],
  total: 2
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

class ViewCustomer extends PageCommentList {
  constructor(props) {
    super(props);
    const { info } = this.props.user_data.data;
    this.state = {
      activeTab1: 2,
      activeTab2: 1,
      activeTab3: 1,
      customer: {
        partner_type_select: 1,
        title_select: 1,
        is_customer: true,
        is_prospect: false,
        currency: info.active_company && info.active_company.currency,
        company_set: [info.active_company],
        team: info.active_team,
        language_select: {
          id: 1,
          name: "English"
        },
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
    const { fetch } = this.props.customer;
    const { limit, offset } = this.state;
    this.setState({ isLoading: true }, () => {
      setTimeout(() => {
        fetch(data, {
          contactPartnerSet: ["fullName", "fixedPhone"],
          partnerAddressList: ["fullName", "address.addressL4", "address"],
          emailAddress: ["fullName"]
        }).then(res => {
          const { data } = res;
          if (data && data.length > 0) {
            const customer = Object.assign({}, data[0]);
            const { recordList } = this.state;
            const targetIndex = recordList.findIndex(r => r.id === customer.id);
            recordList[targetIndex] = Object.assign({}, customer);

            this.setState(
              { customer, recordList, activeTab2: 1, isLoading: false },
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
      }
    } else {
      this.setState({
        isNew: true,
        edit: true
      });
    }
  }

  getApi() {
    return this.props.customer;
  }

  getCurrentRecord() {
    return this.state.customer;
  }

  showUpcomingEventDashlet() {
    const { event } = this.props;
    const { customer } = this.state;
    let searchOptions = {};

    searchOptions = {
      fields: [
        {
          fields: [
            { fieldName: "partner.id", value: customer.id, operator: "=" },
            {
              fieldName: "contactPartner.id",
              value: customer.id,
              operator: "="
            }
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
    const { customer } = this.state;
    let searchOptions = {};

    searchOptions = {
      fields: [
        {
          fields: [
            { fieldName: "partner.id", value: customer.id, operator: "=" },
            {
              fieldName: "contactPartner.id",
              value: customer.id,
              operator: "="
            }
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
        let customer = this.state.customer;
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const base64data = reader.result;
          customer.pictureURL = base64data;
          this.setState({ blob, headers, customer });
        };
      } else {
        const original = this.state.customer;
        const targetIndex = recordList.findIndex(r => r.id === original.id);
        let customer = { ...recordList[targetIndex] };
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const base64data = reader.result;
          customer.pictureURL = base64data;
          recordList[targetIndex] = { ...customer };
          this.setState({ blob, headers, recordList });
        };
      }
    }
  }

  onDeleteContact(contact, index) {
    const { recordList, isNew } = this.state;
    if (isNew) {
      let customer = this.state.customer;
      const contact_partner_set = [...customer.contact_partner_set];
      contact_partner_set.splice(index, 1);
      customer.contact_partner_set = [...contact_partner_set];
      this.setState({ customer });
    } else {
      const original = this.state.customer;
      const targetIndex = recordList.findIndex(r => r.id === original.id);
      let customer = { ...recordList[targetIndex] };
      const contact_partner_set = [...customer.contact_partner_set];
      contact_partner_set.splice(index, 1);
      customer.contact_partner_set = [...contact_partner_set];
      recordList[targetIndex] = { ...customer };
      this.setState({ recordList });
    }
  }

  onAddContact(contact) {
    const { recordList, isNew } = this.state;
    if (isNew) {
      let customer = this.state.customer;
      let { contact_partner_set = [] } = customer;
      if (!contact_partner_set.find(c => c.id === contact.id)) {
        contact_partner_set.push(contact);
      }
      customer = { ...customer, contact_partner_set: [...contact_partner_set] };
      this.setState({ customer });
    } else {
      const original = this.state.customer;
      const targetIndex = recordList.findIndex(r => r.id === original.id);
      let customer = { ...recordList[targetIndex] };

      let contact_partner_set = [...customer.contact_partner_set];
      if (!contact_partner_set.find(c => c.id === contact.id)) {
        contact_partner_set.push(contact);
      }
      customer = { ...customer, contact_partner_set: [...contact_partner_set] };
      recordList[targetIndex] = { ...customer };
      this.setState({ recordList });
    }
  }

  onDeleteAddress(address, index) {
    const { recordList, isNew } = this.state;
    if (isNew) {
      let customer = this.state.customer;
      let { partner_address_list = [] } = customer;
      partner_address_list.splice(
        partner_address_list.findIndex(a => `${a.id}` === `${address.id}`),
        1
      );
      customer = {
        ...customer,
        partner_address_list: [...partner_address_list]
      };
      this.setState({ customer });
    } else {
      const original = this.state.customer;
      const targetIndex = recordList.findIndex(r => r.id === original.id);
      let customer = { ...recordList[targetIndex] };
      let { partner_address_list = [] } = customer;
      partner_address_list.splice(
        partner_address_list.findIndex(a => `${a.id}` === `${address.id}`),
        1
      );
      customer = {
        ...customer,
        partner_address_list: [...partner_address_list]
      };
      recordList[targetIndex] = { ...customer };
      this.setState({
        recordList
      });
    }
  }

  onCreateAddress(address) {
    const { addressList = [], isNew } = this.state;
    if (isNew) {
      const find = addressList.find(a => a.address.id === address.id);
      if (find) return;
      let customer = this.state.customer;
      const { partner_address_list = [] } = customer;
      customer = {
        ...customer,
        partner_address_list: [
          ...partner_address_list,
          { address: { ...address } }
        ]
      };
      this.setState({
        customer,
        addressList: [...addressList, { address: { ...address } }]
      });
    } else {
      const { recordList } = this.state;
      const find = addressList.find(a => a.address.id === address.id);
      if (find) return;
      const original = this.state.customer;
      const targetIndex = recordList.findIndex(r => r.id === original.id);
      let customer = { ...recordList[targetIndex] };
      const { partner_address_list = [] } = customer;
      customer = {
        ...customer,
        partner_address_list: [
          ...partner_address_list,
          { address: { ...address } }
        ]
      };
      recordList[targetIndex] = { ...customer };
      this.setState({
        recordList,
        addressList: [...addressList, { address: { ...address } }]
      });
    }
  }

  changeField(name, value) {
    let { customer, recordList, isNew } = this.state;
    if (name === "is_customer" && value === true) {
      customer = { ...customer, is_prospect: false };
    } else if (name === "is_prospect" && value === true) {
      customer = { ...customer, is_customer: false };
    }

    if (isNew) {
      this.setState({
        customer: {
          ...customer,
          [name]: value
        }
      });
    } else {
      const targetIndex = recordList.findIndex(r => r.id === customer.id);
      const record = { ...recordList[targetIndex] };
      record[name] = value;
      recordList[targetIndex] = { ...record };
      this.setState({ recordList });
    }
  }

  isRecordChanged(close) {
    return new Promise((resolve, reject) => {
      const { recordList, customer } = this.state;
      const targetIndex = recordList.findIndex(
        record => record.id === customer.id
      );
      if (
        JSON.stringify(recordList[targetIndex]) !== JSON.stringify(customer) &&
        close
      ) {
        ons.notification
          .confirm(translate("Alert.confirmClose"), {
            title: translate("Alert.confirm"),
            id: "customer-view",
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
    const { recordList, customer } = this.state;
    return new Promise((resolve, reject) => {
      const targetIndex = recordList.findIndex(
        record => record.id === customer.id
      );
      this.isRecordChanged(close).then(ok => {
        if (ok) {
          recordList[targetIndex] = customer;
          this.setState({ edit: false, customer, recordList });
          resolve(true);
        }
      });
    });
  }

  validateData() {
    let isValid = true;
    const { customer } = this.state;
    if (!customer.name || !(customer.name.length > 0)) {
      isValid = false;
      this.setState({
        submitError: {
          title: translate("Alert.saveErrorTitle"),
          content: translate("Alert.nameRequired")
        }
      });
      return isValid;
    }
    if (customer.fixed_phone && !(customer.fixed_phone.length >= 8)) {
      isValid = false;
      this.setState({
        submitError: {
          title: translate("Alert.saveErrorTitle"),
          content: translate("Alert.phoneMinimumLenth")
        }
      });
      return isValid;
    }

    return isValid;
  }

  onUpdate(record) {
    const { update } = this.props.customer;
    update(record).then(res => {
      if (res.status === -1) {
        ons.notification.alert(res.error.message, {
          id: "customer-error"
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

  addCust(customer) {
    let { add, fetch } = this.props.customer;
    const { addRecord, updateRecord } = this.props.route;
    add(customer).then(result => {
      if (result.status === -1) {
        ons.notification.alert(result.error.message, {
          id: "customer-error"
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

        fetch(data[0], {
          contactPartnerSet: ["fullName", "fixedPhone"],
          partnerAddressList: ["fullName", "address.addressL4", "address"],
          emailAddress: ["fullName"]
        }).then(res => {
          this.setState(
            {
              customer: res.data[0],
              isNew: false,
              edit: false
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
    const { customer, recordList } = this.state;
    const record = recordList.find(r => r.row_id === customer.row_id);

    if (record && record.id !== undefined) {
      this.startLoading();
      let { uploadFile } = this.props.customer;

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
      let { uploadFile } = this.props.customer;

      if (!this.validateData()) {
        this.setState({ showErrorDialog: true });
        return;
      }
      this.startLoading();
      if (customer.first_name) {
        customer.full_name = `${customer.name} ${customer.first_name}`;
      } else {
        customer.full_name = customer.name;
      }
      this.getBlobAndHeader(customer.pictureURL).then(({ blob, headers }) => {
        console.log("xxx", blob, headers);
        if (blob && headers) {
          uploadFile(blob, headers).then(res => {
            let { customer } = this.state;
            customer.picture = { ...res.result };
            customer.pictureURL = res.url;
            this.setState({ customer: { ...customer } });
            this.addCust(customer);
          });
        } else {
          this.addCust(customer);
        }
      });
    }
  }

  sendEmail() {
    const contextData = {
      model: "com.axelor.apps.base.db.Partner",
      tag: "Partner",
      templateContextModel: "com.axelor.apps.base.db.Partner",
      prop: this.props.customer
    };
    this.props.navigator.pushPage(
      {
        component: MailPage,
        path: "MailPage",
        viewProps: this.props.route,
        data: { user: { ...this.state.customer }, contextData },
        contact: this.props.customer
      },
      { animation: "none" }
    );
  }

  onCreateEvent() {
    let { customer } = this.state;
    this.props.navigator.pushPage(
      {
        component: EventView,
        path: "EventView",
        record: {
          client_partner: {
            id: customer.id,
            full_name:
              customer.full_name || `${customer.name} ${customer.first_name}`
          }
        }
      },
      { animation: "none" }
    );
  }

  onCreateOpportunity() {
    const { customer } = this.state;
    this.props.navigator.pushPage(
      {
        component: OpportunityView,
        path: "OpportunityView",
        record: {
          partner: {
            id: customer.id,
            full_name:
              customer.full_name || `${customer.name} ${customer.first_name}`
          }
        }
      },
      { animation: "none" }
    );
  }

  getPartnerSelect(value) {
    const { data } = getPartnerTypeStatus();
    return data.find(item => item.id === Number(value));
  }

  getCivility(value) {
    const { data } = getTitleSelect();
    return data.find(item => item.id === Number(value));
  }

  getFieldLabel(fieldName) {
    const { fields } = this.props.customer;
    const targetIndex = fields.findIndex(field => field.name === fieldName);
    return targetIndex !== -1
      ? translate(fields[targetIndex].label)
      : undefined;
  }

  removeCustomer(record) {
    const { remove } = this.props.customer;
    ons.notification
      .confirm(translate("Alert.confirmDelete"), {
        title: translate("Alert.confirm"),
        id: "remove-customer",
        buttonLabels: [
          translate("Alert.cancelButton"),
          translate("Alert.yesButton")
        ]
      })
      .then(res => {
        if (res === 1) {
          remove(record).then(res => {
            if (res.status !== 0) {
              ons.notification.alert(res.error.title, { id: "customer-error" });
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
    const { customer, recordList } = this.state;
    const record = recordList.find(r => r.id === customer.id);
    record.picture = null;
    record.pictureURL = null;
    this.changeField("picture", null);
    this.changeField("pictureURL", null);
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

  renderToolbar() {
    const { recordList, edit, isNew } = this.state;
    const original = this.state.customer;
    let customer = original;
    if (!isNew) {
      customer = recordList.find(r => r.row_id === original.row_id) || {};
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
            {customer && customer.name ? customer.name : ""}{" "}
            {customer && customer.first_name ? ` ${customer.first_name}` : ""}
          </span>
        </div>
        {isNew ? (
          <div className="right icons" style={{ paddingRight: "10px" }}>
            <PageElement key="save" offline={!customer.id}>
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
          <div className="right icons" style={{ paddingRight: "5px" }}>
            <PageElement key="close" offline={!customer.id}>
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
              <PageElement key="save" offline={!customer.id}>
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
          <div className="right icons" style={{ paddingRight: "5px" }}>
            <PageElement key="delete" offline={!customer.id}>
              <div
                style={{ color: "#F44336", marginRight: 5 }}
                className="round-icon"
              >
                <Icon
                  icon="fa-trash"
                  onClick={() => this.removeCustomer(customer)}
                />
              </div>
            </PageElement>
            <div
              style={{ padding: "5px 15px 5px 0px" }}
              onClick={() => this.setState({ edit: true })}
            >
              <PageElement key="edit" offline={!customer.id}>
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

  renderContactView(id) {
    const { recordList } = this.state;
    const original = this.state.customer;
    const targetIndex = recordList.findIndex(r => r.id === original.id);
    let customer = { ...recordList[targetIndex] };
    let contact_partner_set = [...customer.contact_partner_set];
    let index = contact_partner_set.findIndex(record => record.id === id);
    this.props.navigator.pushPage({
      component: ContactView,
      key: "view_contact_" + Date.now(),
      data: contact_partner_set[index],
      removeRecord: record => {
        const targetIndex = recordList.findIndex(r => r.id === original.id);
        let customer = { ...recordList[targetIndex] };
        let contact_partner_set = [...customer.contact_partner_set];
        contact_partner_set.splice(
          contact_partner_set.findIndex(a => `${a.id}` === `${id}`),
          1
        );
        customer = {
          ...customer,
          contact_partner_set: [...contact_partner_set]
        };
        recordList[targetIndex] = { ...customer };
        this.setState({
          recordList
        });
      },
      updateRecord: record => {
        const targetIndex = recordList.findIndex(r => r.id === original.id);
        let customer = { ...recordList[targetIndex] };
        let contact_partner_set = [...customer.contact_partner_set];
        contact_partner_set[
          contact_partner_set.findIndex(a => `${a.id}` === `${id}`)
        ] = record;
        customer = {
          ...customer,
          contact_partner_set: [...contact_partner_set]
        };
        recordList[targetIndex] = { ...customer };
        this.setState({
          recordList
        });
      },
      navigator
    });
  }

  openFileGallary() {
    openCamera().then(res => {
      if (res.status === 1) {
        const pictureURL = res.image;
        const { isNew, customer } = this.state;
        if (isNew) {
          customer.pictureURL = pictureURL;
        } else {
          const { recordList } = this.state;
          const targetIndex = recordList.findIndex(r => r.id === customer.id);
          recordList[targetIndex] = { ...recordList[targetIndex], pictureURL };
          this.setState({ recordList });
        }
        this.setState({ customer });
      }
    });
  }

  renderView(customer) {
    const { activeTab1, activeTab2, activeTab3, isNew } = this.state;
    const { contact_partner_set, partner_address_list } = customer;

    const manyToOneProps = (name, stateKey, label, placeholder) => ({
      edit: this.state.edit,
      navigator: this.props.navigator,
      targetName: name,
      displayField: name,
      value: customer[stateKey],
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
                    {customer.pictureURL ? (
                      <div>
                        <img
                          src={customer.pictureURL}
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
                          <Translate text="common.uploadPicture" />
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  customer.pictureURL && (
                    <img
                      src={customer.pictureURL}
                      style={{ width: 75, height: 75 }}
                      alt="customer img"
                    />
                  )
                )}
              </div>
            )}
            {!this.state.edit ? (
              <div style={{ textAlign: "center" }}>
                {customer.is_customer && (
                  <CardView.TagButton>
                    {translate("Partner.customer")}
                  </CardView.TagButton>
                )}
                <p className="customer-info-detail">
                  {customer.name} {customer.first_name}
                </p>
                <p className="customer-info-detail">{customer.fixed_phone}</p>
                <p className="customer-info-detail">
                  {customer.email_address && customer.email_address.address}
                </p>
              </div>
            ) : (
              <div style={{ padding: "10px 10px 0px 15px" }}>
                <CardView.FieldWrapper
                  fieldLabel={translate("Partner.partnerType")}
                  edit={this.state.edit}
                >
                  <Select
                    className="status-select-input"
                    value={`${
                      this.getPartnerSelect(customer.partner_type_select).id
                    }`}
                    onChange={e =>
                      this.changeField("partner_type_select", e.target.value)
                    }
                  >
                    {getPartnerTypeStatus().data.map((s, i) => (
                      <option key={i} value={s.id}>
                        {s.value}
                      </option>
                    ))}
                  </Select>
                </CardView.FieldWrapper>
                {customer.partner_type_select === 2 && (
                  <CardView.FieldWrapper
                    fieldLabel={this.getFieldLabel("title_select")}
                    edit={this.state.edit}
                  >
                    <Select
                      className="status-select-input"
                      value={`${this.getCivility(customer.title_select) &&
                        this.getCivility(customer.title_select).id}`}
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
                )}

                <CardView.InputField
                  edit={this.state.edit}
                  title={this.getFieldLabel("name")}
                  onChange={e => this.changeField("name", e.target.value)}
                  value={customer && customer.name}
                />

                {customer.partner_type_select === 2 && (
                  <CardView.InputField
                    edit={this.state.edit}
                    title={this.getFieldLabel("first_name")}
                    onChange={e =>
                      this.changeField("first_name", e.target.value)
                    }
                    value={customer && customer.first_name}
                  />
                )}

                <CardView.InputField
                  edit={this.state.edit}
                  title={this.getFieldLabel("fixed_phone")}
                  type="tel"
                  onChange={e =>
                    this.changeField("fixed_phone", e.target.value)
                  }
                  value={customer && customer.fixed_phone}
                  counter="8"
                />

                <CardView.InputField
                  edit={this.state.edit}
                  title={this.getFieldLabel("email_address")}
                  onChange={e =>
                    this.changeField("email_address", {
                      ...customer.email_address,
                      address: e.target.value,
                      version:
                        customer.email_address &&
                        customer.email_address.$version
                    })
                  }
                  value={
                    customer.email_address && customer.email_address.address
                  }
                />

                <CardView.InputField
                  edit={this.state.edit}
                  title={this.getFieldLabel("web_site")}
                  onChange={e => this.changeField("web_site", e.target.value)}
                  value={customer && customer.web_site}
                />

                {
                  <div className="new-customer-type">
                    <div className="is-customer-container checkbox">
                      <CheckBoxInput
                        name="is_customer"
                        value={customer.is_customer}
                        onValueChange={value =>
                          this.changeField("is_customer", value)
                        }
                        title={this.getFieldLabel("is_customer")}
                      />
                    </div>
                    <div
                      className="is-customer-container checkbox"
                      style={{ marginLeft: "65px" }}
                    >
                      <CheckBoxInput
                        name="is_prospect"
                        value={customer.is_prospect}
                        onValueChange={value =>
                          this.changeField("is_prospect", value)
                        }
                        title={this.getFieldLabel("is_prospect")}
                      />
                    </div>
                  </div>
                }
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
              {
                title: <Translate text="Partner.contactsAssociated" />,
                value: 2,
                hide: () => this.state.customer.partner_type_select === 2
              },
              {
                title: <Translate text="Partner.partnerAddressList" />,
                value: 3
              }
            ]}
            activeColor="#2979FF"
            activeTab={this.state.activeTab1}
            onChange={e => this.setState({ activeTab1: e })}
            titleClassName="contact-tab"
          />
          <div>
            {activeTab1 === 2 ? (
              <div>
                {contact_partner_set && contact_partner_set.length > 0
                  ? contact_partner_set.map((item, index) => (
                      <div
                        className={classNames(
                          this.state.edit
                            ? "list-container-edit"
                            : "list-container"
                        )}
                        key={item.id}
                      >
                        <div
                          style={{ display: "flex", flex: 1 }}
                          onClick={() => this.renderContactView(item.id)}
                        >
                          <div style={{ lineHeight: "5px" }}>
                            <p style={{ fontWeight: "bold" }}>
                              {item.full_name}
                            </p>
                            <p>{item.fixed_phone}</p>
                          </div>
                        </div>
                        {this.state.edit && (
                          <Icon
                            icon="md-close"
                            className="item-nav-icon"
                            style={{ color: "red" }}
                            onClick={() => this.onDeleteContact(item, index)}
                          />
                        )}
                      </div>
                    ))
                  : !this.state.edit && (
                      <div
                        className="list-container"
                        style={{ padding: "15px", justifyContent: "center" }}
                      >
                        {translate("common.noContactAssociatedFound")}
                      </div>
                    )}
                {this.state.edit && (
                  <div
                    className="list-container-edit"
                    onClick={() =>
                      this.props.navigator.pushPage({
                        key: "add_partner_contact" + Date.now(),
                        component:
                          this.props.route.module === "Sale"
                            ? SaleContacts
                            : CRMContacts,
                        addContact: contact => this.onAddContact(contact)
                      })
                    }
                  >
                    <p> {translate("common.manyToOneField.selectContact")}</p>
                    <Icon icon="md-plus" className="item-nav-icon" />
                  </div>
                )}
              </div>
            ) : (
              activeTab1 === 3 && (
                <div>
                  {partner_address_list && partner_address_list.length > 0
                    ? partner_address_list.map((item, index) => (
                        <div
                          className={classNames(
                            this.state.edit
                              ? "list-container-edit"
                              : "list-container"
                          )}
                          key={index}
                        >
                          <p className="list-item-content">
                            {item.address && item.address.fullName}
                          </p>
                          {this.state.edit && (
                            <Icon
                              icon="md-close"
                              className="item-nav-icon"
                              style={{ color: "red" }}
                              onClick={() => this.onDeleteAddress(item, index)}
                            />
                          )}
                        </div>
                      ))
                    : !this.state.edit && (
                        <div
                          className="list-container"
                          style={{ padding: "15px", justifyContent: "center" }}
                        >
                          {translate("common.noAddressFound")}
                        </div>
                      )}
                  {this.state.edit && (
                    <div
                      className="list-container-edit"
                      onClick={() =>
                        this.props.navigator.pushPage({
                          key: "create_address",
                          component: CreateAddress,
                          createAddress: address =>
                            this.onCreateAddress(address),
                          data: customer,
                          partner_address_list
                        })
                      }
                    >
                      <p> {translate("common.selectAddress")}</p>
                      <Icon icon="md-plus" className="item-nav-icon" />
                    </div>
                  )}
                </div>
              )
            )}
          </div>
        </div>

        <div style={{ paddingTop: "30px" }}>
          <Tabs
            tabs={[
              {
                title: <Translate text="common.header.partnerDetails" />,
                value: 1
              },
              { title: <Translate text="common.filterTab.others" />, value: 2 },
              {
                title: `${translate("common.comments")}(${this.state.total})`,
                value: 3,
                hide: () => this.state.isNew
              }
            ]}
            activeTab={this.state.activeTab2}
            onChange={e => this.setState({ activeTab2: e })}
          />
        </div>
        {activeTab2 === 3 && this.renderCommentList()}
        <CardView hidden={activeTab2 !== 2}>
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
            value={customer.company_set}
            searchAPI={e => this.props.company.searchAll(e)}
            onChange={e => this.changeField("company_set", e.target.value)}
            edit={this.state.edit}
            navigator={this.props.navigator}
          />
        </CardView>

        <CardView title="Notes" hidden={activeTab2 !== 2}>
          <CardView.TextArea
            edit={this.state.edit}
            value={customer.description}
            onChange={e => this.changeField("description", e.target.value)}
          />
        </CardView>

        <CardView hidden={activeTab2 !== 1}>
          <RenderManyToOne
            name="partner_category"
            searchAPI={e => this.props.category.searchAll(e)}
            {...manyToOneProps(
              "name",
              "partner_category",
              translate("Partner.partnerCategory"),
              translate("common.manyToOneField.selectCategory")
            )}
          />

          {customer.partner_type_select === 1 && (
            <RenderManyToOne
              name="industry_sector"
              searchAPI={e => this.props.industry.searchAll(e)}
              {...manyToOneProps(
                "name",
                "industry_sector",
                translate("Partner.industrySector"),
                translate("common.manyToOneField.selectIndustry")
              )}
            />
          )}

          <RenderManyToOne
            name="source"
            searchAPI={e => this.props.source.searchAll(e)}
            {...manyToOneProps(
              "name",
              "source",
              translate("Partner.source"),
              translate("common.manyToOneField.selectSource")
            )}
          />
          {customer.partner_type_select === 1 && (
            <RenderManyToOne
              name="parent_partner"
              searchAPI={e => this.props.parentpartner.searchAll(e)}
              {...manyToOneProps(
                "full_name",
                "parent_partner",
                translate("Partner.parentPartner"),
                translate("common.manyToOneField.selectParentPartner")
              )}
            />
          )}

          <RenderManyToOne
            name="language_select"
            searchAPI={e => this.props.language.searchAll(e)}
            {...manyToOneProps(
              "name",
              "language_select",
              translate("Partner.languageSelect"),
              translate("common.manyToOneField.selectLanguage")
            )}
          />
        </CardView>

        <CardView hidden={activeTab2 !== 1}>
          {customer.partner_type_select === 1 && (
            <React.Fragment>
              <CardView.InputField
                edit={this.state.edit}
                title={this.getFieldLabel("nbr_employees")}
                onChange={e =>
                  this.changeField("nbr_employees", e.target.value)
                }
                type="number"
                value={customer.nbr_employees}
              />
              <CardView.InputField
                edit={this.state.edit}
                title={this.getFieldLabel("sale_turnover")}
                onChange={e =>
                  this.changeField("sale_turnover", e.target.value)
                }
                type="number"
                value={customer.sale_turnover}
              />
              <CardView.InputField
                edit={this.state.edit}
                title={this.getFieldLabel("registration_code")}
                onChange={e =>
                  this.changeField("registration_code", e.target.value)
                }
                value={customer.registration_code}
              />

              <CardView.InputField
                edit={this.state.edit}
                title={this.getFieldLabel("tax_nbr")}
                onChange={e => this.changeField("tax_nbr", e.target.value)}
                value={customer.tax_nbr}
              />
            </React.Fragment>
          )}

          <RenderManyToOne
            name="currency"
            searchAPI={e => this.props.currency.searchAll(e)}
            {...manyToOneProps(
              "name",
              "currency",
              translate("Partner.currency"),
              translate("common.manyToOneField.selectCurrency")
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
                    title: <Translate text="common.tabBar.historicalEvents" />,
                    value: 2
                  }
                ]}
                titleClassName="event-list-tabber-title"
                activeColor="rgb(226, 170, 70)"
                activeTab={this.state.activeTab3}
                onChange={e => this.setState({ activeTab3: e })}
                className="event-list-tab"
              />
            </div>

            <div>
              {activeTab3 === 1 ? (
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
    const { hookState, isLoading, customer } = this.state;
    let hookContent = null;
    if (hookState === "action") {
      hookContent = this.renderPullHookLoader();
    }
    return (
      <PullHook
        disabled={isLoading}
        onChange={e => this.setState({ hookState: e.state })}
        onLoad={done => {
          this.fetchNewData(customer);
          done();
        }}
        fixedContent={true}
      >
        {hookContent}
      </PullHook>
    );
  }
  render() {
    const { isLoading, recordList, isNew, customer } = this.state;
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
          this.renderView(customer)
        ) : (
          // <SwiperView
          //   recordList={recordList}
          //   renderItem={(record) => this.renderView(record)}
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

ViewCustomer.propTypes = {
  navigator: PropTypes.any,
  route: PropTypes.any
};

const mapPropsToState = state => ({ app: state.app, user_data: state.user });
ViewCustomer = reduxConnect(mapPropsToState)(ViewCustomer);

export const SaleCustomersComponent = ViewCustomer;

const mapConnectToProps = props => {
  const {
    refs: {
      source,
      user,
      company,
      currency,
      metaselect,
      industry,
      category,
      salecontact,
      partneraddress,
      address,
      partner,
      parentpartner,
      event,
      team,
      language
    },
    ...customer
  } = props;
  return {
    customer,
    source,
    user,
    company,
    currency,
    metaselect,
    industry,
    category,
    salecontact,
    partneraddress,
    address,
    partner,
    parentpartner,
    event,
    team,
    language
  };
};

const mapConnectConfig = {
  name: "SaleCustomer",
  refs: [
    {
      model: "Source",
      field: "source"
    },
    {
      model: "User",
      field: "user"
    },
    {
      model: "Company",
      field: "company"
    },
    {
      model: "Currency",
      field: "currency"
    },
    {
      model: "MetaSelect",
      field: ""
    },
    {
      model: "Industry",
      field: "industry_sector"
    },
    {
      model: "Category",
      field: "partner_category"
    },
    {
      model: "SaleContact",
      field: "contact_partner_set"
    },
    {
      model: "MetaSelect"
    },
    {
      model: "PartnerAddress",
      field: "partner_address_list"
    },
    {
      model: "Address",
      field: ""
    },
    {
      model: "ParentPartner",
      field: "parent_partner"
    },
    {
      model: "Event",
      field: ""
    },
    {
      model: "Team",
      field: "team"
    },
    {
      model: "Language",
      field: "language_select"
    }
  ]
};

export default connect(mapConnectToProps)(ViewCustomer, mapConnectConfig);
