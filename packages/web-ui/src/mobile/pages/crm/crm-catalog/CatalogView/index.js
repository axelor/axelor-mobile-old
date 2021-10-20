import React from "react";
import PropTypes from "prop-types";
import moment from "moment";
import connect from "../../connect/crm-catalog";
import {
  ListItem,
  Toolbar,
  ToolbarButton,
  Icon,
  ProgressCircular,
  PullHook,
  Toast,
} from "react-onsenui";
import ons from "onsenui";
import { connect as reduxConnect } from "react-redux";

import Page, { PageElement } from "../../../page";
import Translate, { translate } from "../../../../locale";
import "./index.css";
import OpportunityView from "./../../crm-opportunity/OpportunityView";
import EventView from "./../../crm-events/EventView";
import EventObjects from "./../../crm-events/common";
import MailPage from "./../../../email/mail";
import { CardView, SwiperView } from "./../../../../components";
import { openCamera, URLToBlob } from "./../../../../cordova";
import { downloadFile, openFile } from "../../../sale/sales/download";

import { AlertDialog, Modal } from "react-onsenui";
import PageCommentList, {
  RenderManyToOne,
} from "../../../page-comment-list";

class CatalogView extends PageCommentList {
  constructor(props) {
    super(props);
    this.state = {
      catalog: {},
      catalogForm: {
        pdfFile: null,
        catalogType: null,
        name: null,
        image: null,
        description: null,
      },
      recordList: [],
      upcomingEventList: [],
      completedEventList: [],
      dashletType: 1,
      overviewPanel: 1,
      activityLoading: false,
      downloadToast: false,
      submitError: {
        content: null,
        title: null,
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
      activeIndex: 0,
    };
  }

  componentDidMount() {
    const { route } = this.props;
    const { data, getRecordsByIndex } = route;
    if (data && data.id !== undefined) {
      if (getRecordsByIndex) {
        const records = getRecordsByIndex(data, true);
        const targetIndex = records.findIndex((r) => r.id === data.id);
        this.swiper.slideTo(targetIndex, 0, true);
        this.setState({ recordList: records, activeIndex: targetIndex });
        this.fetchNewData(data);
      }
    } else {
      this.setState({ isNew: true, edit: true });
    }
  }

  getApi() {
    return this.props.catalog;
  }

  getCurrentRecord() {
    return this.state.catalog;
  }

  fetchNewData(data) {
    const { fetch } = this.props.catalog;
    const { limit, offset } = this.state;
    this.setState({ isLoading: true }, () => {
      setTimeout(() => {
        fetch(data).then((res) => {
          const { data } = res;
          if (data && data.length > 0) {
            const catalog = Object.assign({}, data[0]);
            const { recordList } = this.state;
            const targetIndex = recordList.findIndex(
              (r) => r.id === catalog.id
            );
            recordList[targetIndex] = Object.assign({}, catalog);
            this.setState({ catalog, recordList, isLoading: false }, () => {
              // this.getDashletData();
              // this.getAllComment(limit, offset);
            });
          }
        });
      }, 300);
    });
  }

  sendEmail() {
    const contextData = {
      model: "com.axelor.apps.crm.db.Catalog",
      tag: "Catalog",
      templateContextModel: "com.axelor.apps.crm.db.Catalog",
      prop: this.props.catalog,
    };
    this.props.navigator.pushPage(
      {
        component: MailPage,
        path: "MailPage",
        viewProps: this.props.route,
        data: { user: { ...this.state.catalog }, contextData },
      },
      { animation: "none" }
    );
  }

  getDashletData() {
    const { catalog } = this.state;
    const { search } = this.props.catalog.refs.event;
    const ids = catalog.event_list
      ? catalog.event_list.map((event) => event.id)
      : [];
    if (ids.length === 0) {
      this.setState({ eventList: [] });
      return;
    }
    this.setState({ activityLoading: true, eventList: [] });
    setTimeout(() => {
      search({ id: ids || [] }).then(({ data = [] }) => {
        if (data) {
          const today = moment(new Date());
          const upcomingEventList = data.filter((d) =>
            today.isBefore(d.start_date_time)
          );
          this.setState({ upcomingEventList, activityLoading: false });
          const completedEventList = data.filter((d) =>
            today.isAfter(d.end_date_time)
          );
          this.setState({ completedEventList, activityLoading: false });
        }
        this.setState({ activityLoading: false });
      });
    }, 500);
  }

  changeField(field, value) {
    const { catalog, recordList, catalogForm, isNew } = this.state;
    if (isNew) {
      catalogForm[field] = value;
      this.setState({ catalogForm });
    } else {
      const targetIndex = recordList.findIndex((r) => r.id === catalog.id);
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
      const { recordList, catalog } = this.state;
      const targetIndex = recordList.findIndex(
        (record) => record.id === catalog.id
      );
      if (
        JSON.stringify(recordList[targetIndex]) !== JSON.stringify(catalog) &&
        close
      ) {
        ons.notification
          .confirm(translate("Alert.confirmClose"), {
            title: translate("Alert.confirm"),
            id: "crm-catalog",
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

  closeEdit(close) {
    const { recordList, catalog } = this.state;
    return new Promise((resolve, reject) => {
      const targetIndex = recordList.findIndex(
        (record) => record.id === catalog.id
      );
      this.isRecordChanged(close).then((ok) => {
        if (ok) {
          recordList[targetIndex] = catalog;
          this.setState({ edit: false, catalog, recordList });
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
    this.isRecordChanged(true).then((ok) => {
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

  validateData(catalogForm) {
    let isValid = true;
    if (!catalogForm.name || !(catalogForm.name.length > 0)) {
      isValid = false;
      this.setState({
        submitError: {
          title: translate("Alert.saveErrorTitle"),
          content: translate("Alert.nameRequired"),
        },
      });
    }
    // validate an email
    if (
      !catalogForm.pdfFile
    ) {
      isValid = false;
      this.setState({
        submitError: {
          title: translate("Alert.saveErrorTitle"),
          content: translate("Alert.pdfRequired"),
        },
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

  async saveRecord() {
    const { catalog, recordList, catalogForm, isNew } = this.state;
    const { onUpdate, onNewUpdate } = this.props.route;
    const { add, update } = this.props.catalog;
    var reader = new FileReader();
    if (isNew) {
      let image = null;
      if (catalogForm.file) {
        const uploadedFile = await this.uploadChunk(catalogForm.file, 0);
        catalogForm.pdfFile = { ...uploadedFile };
      }
      if(catalogForm.image) {
        const {blob} = await this.getBlobAndHeader(catalogForm.image);
        image = blob;
      }
      if (!this.validateData(catalogForm)) {
        this.setState({ showErrorDialog: true });
        return;
      }
      this.startLoading();
      const addRecord = (record) => {
        add(record).then((res) => {
          if (res.status === -1) {
            ons.notification.alert(res.error.message, {
              id: "catalog-error",
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
      }
      if(image) {
        reader.readAsDataURL(image);
        reader.onloadend = () => {
          const base64data = reader.result;
          addRecord({...catalogForm, image: base64data});
        }
      } else {
        addRecord({...catalogForm});
      }
    } else {
      const record = recordList.find((r) => r.row_id === catalog.row_id);
      if (!this.validateData(record)) {
        this.setState({ showErrorDialog: true });
        return;
      }
      if (record.id !== undefined) {
        this.startLoading();
        if (record.file) {
          const uploadedFile = await this.uploadChunk(record.file, 0);
          record.pdfFile = { ...uploadedFile };
        }
        let image = null;
        if(record.image) {
          const {blob} = await this.getBlobAndHeader(record.image);
          image = blob;
        }
        const updateRecord = (record) => {
          update(record).then((res) => {
            if (res.status === -1) {
              ons.notification.alert(res.error.message, {
                id: "catalog-error",
              });
              this.setState({ isLoading: false });
            } else {
              const { data } = res;
              if (data && data.length > 0) {
                const newRecord = data[0];
                if (onUpdate) {
                  onUpdate(newRecord);
                }
                this.closeEdit().then((res) => {
                  this.fetchNewData(newRecord);
                });
              } else {
                this.closeLoading();
              }
            }
          });
        }
        if(image) {
          reader.readAsDataURL(image);
          reader.onloadend = () => {
            const base64data = reader.result;
            updateRecord({...record, image: base64data});
          };
        } else {
          updateRecord(record);
        }
      }
    }
  }

  uploadChunk(file, offset = 0) {
    let attachment = this.getAttchmentBlob(file);
    let { uploadFile } = this.props.catalog.refs.metafile;
    const chunkSize = 100000;
    const end =
      offset + chunkSize < attachment.size
        ? offset + chunkSize
        : attachment.size;
    const blob = attachment.slice(offset, end);
    const headers = this.getHeaders(attachment, offset, file.id);
    return uploadFile(blob, headers).then((res) => {
      const { result } = res;
      if (result && result.id) {
        return result;
      } else {
        if (offset < attachment.size) {
          if (result.fileId) {
            file.id = result.fileId;
          }
          return this.uploadChunk(file, chunkSize + offset);
        }
      }
    });
  }

  getAttchmentBlob(file) {
    const { app_state: app } = this.props;
    if (app.platform !== "Android") {
      if (window.cordova) {
        return file.blob;
      } else {
        return file;
      }
    }
    return file.file;
  }

  getHeaders(attachment, offset, fileId) {
    // const attachment = file.file;
    const headers = {
      "X-File-Name": attachment.name,
      "X-File-Offset": offset,
      "X-File-Size": attachment.size,
      "X-File-Type": attachment.type,
    };
    if (attachment.id || fileId) {
      headers["X-File-Id"] = attachment.id || fileId;
    }
    return headers;
  }

  selectFile = (files) => {
    // (files) => this.changeField('file', files[0])
    let file = null;
    if (this.props.app_state.platform !== "Android") {
      file = files[0];
    } else {
      file = this.filesToItems(files)[0];
    }

    this.changeField("file", file);
  };

  filesToItems(files) {
    const chunkSize = 512 * 1024;
    const fileItems = Array.prototype.slice.call(files).slice(0, 1);
    const items = fileItems.map((f, i) => {
      const chunkProgress = [];
      for (let j = 0; j <= f.size / chunkSize; j += 1) {
        chunkProgress.push(0);
      }
      return {
        file: f,
        index: i,
        progress: 0,
        cancelled: false,
        completed: false,
        chunkProgress,
        error: false,
        totalUploaded: 0,
      };
    });
    return items;
  }

  // async uploadChunk(chunk, headers) {
  //   const { uploadFile } = this.props.task.refs.metafile;
  //   return uploadFile(chunk, headers);
  // }

  // async uploadInChunk(file) {
  //   const chunkSize = 512 * 1024;
  //   const fileSize = file.size;
  //   let offset = 0;
  //   let end = 0;
  //   let id = null;
  //   let doUpload = true;
  //   const fileName = `sign_${Date.now()}`;
  //   // let response = null;
  //   while (doUpload) {
  //     end = offset + chunkSize < fileSize ? offset + chunkSize : fileSize;
  //     const blob = file.slice(offset, end);
  //     const headers = {
  //       "X-File-Name": fileName,
  //       "X-File-Offset": Math.min(offset, fileSize),
  //       "X-File-Size": file.size,
  //       "X-File-Type": file.type
  //     };
  //     if (id) {
  //       headers["X-File-Id"] = id;
  //     }
  //     const res = await this.uploadChunk(blob, headers);
  //     const { result } = res;
  //     if (result.id) {
  //       doUpload = false;
  //       return result;
  //     } else {
  //       if (result.fileId) {
  //         id = result.fileId;
  //       }
  //       offset = chunkSize + offset;
  //     }
  //   }
  // }

  removeRecord(record) {
    const { remove } = this.props.catalog;
    ons.notification
      .confirm(translate("Alert.confirmDelete"), {
        title: translate("Alert.confirm"),
        id: "remove-catalog",
      })
      .then((res) => {
        if (res === 1) {
          remove(record).then((res) => {
            if (this.props.route.removeRecord) {
              this.props.route.removeRecord(record);
            }
            this.props.navigator.popPage();
          });
        }
      });
  }

  createEvent() {
    const { catalog } = this.state;
    this.props.navigator.pushPage(
      {
        component: EventView,
        path: "EventView",
        record: {
          catalog: { id: catalog.id, company: catalog.company, ...catalog },
        },
      },
      { animation: "none" }
    );
  }

  createOpportunity() {
    const { catalog } = this.state;
    this.props.navigator.pushPage(
      {
        component: OpportunityView,
        path: "OpportunityView",
        record: {
          catalog: { id: catalog.id, company: catalog.company, ...catalog },
        },
      },
      { animation: "none" }
    );
  }

  hasField(fieldName) {
    const { fields } = this.props.catalog;
    const targetIndex = fields.findIndex((field) => field.name === fieldName);
    return targetIndex !== -1 ? true : false;
  }

  isFollowUpPanelEmpty() {
    const { catalog } = this.state;
    if (catalog.user || catalog.team) {
      return false;
    }
    return true;
  }

  isContactPanelEmpty() {
    const { catalog } = this.state;
    if (catalog.mobile_phone || catalog.fixed_phone || catalog.email_address) {
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
      id: "phone-error",
    });
  }

  onMobileClick(e, catalogForm) {
    e.preventDefault();
    window.plugins.CallNumber &&
      window.plugins.CallNumber.callNumber(
        this.onSuccess,
        this.onError,
        catalogForm.mobile_phone,
        true
      );
  }

  isPrimaryAddressEmpty() {
    const { catalog } = this.state;
    if (
      catalog.primary_address ||
      catalog.primary_city ||
      catalog.primary_country ||
      catalog.primary_state ||
      catalog.primary_postal_code
    ) {
      return false;
    }
    return true;
  }

  getFieldLabel(fieldName) {
    const { fields } = this.props.catalog;
    const targetIndex = fields.findIndex((field) => field.name === fieldName);
    return targetIndex !== -1
      ? translate(fields[targetIndex].label)
      : undefined;
  }

  mapObjectToList(object) {
    return Object.keys(object).map((key) => {
      return { id: key, name: object[key] };
    });
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

  openFileGallary() {
    openCamera().then(res => {
      if (res.status === 1) {
        const pictureURL = res.image;
        const { isNew, catalog, catalogForm } = this.state;
        if (isNew) {
          catalogForm.pictureURL = pictureURL;
          catalogForm.image = pictureURL;
          this.setState({ catalogForm });
        } else {
          const { recordList } = this.state;
          const targetIndex = recordList.findIndex(r => r.id === catalog.id);
          recordList[targetIndex] = { ...recordList[targetIndex], pictureURL, image: pictureURL };
          this.setState({ recordList });
        }
      }
    });
  }

  onRemoveImage(e) {
    e.stopPropagation();
    const { catalog, recordList } = this.state;
    const record = recordList.find(r => r.id === catalog.id);
    record.image = null;
    record.pictureURL = null;
    this.changeField("image", null);
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
        removeRecord: (record) => {
          const targetIndex = eventList.findIndex((e) => e.id === record.id);
          let newList = eventList.splice(targetIndex, 1);
          this.setState({ eventList: newList });
        },
        onUpdate: (record) => {
          const targetIndex = eventList.findIndex((e) => e.id === record.id);
          eventList[targetIndex] = { ...record };
          this.setState({ eventList });
        },
      },
      { animation: "none" }
    );
  }

  renderCatalogImage = (catalog) => {
    return (
      <React.Fragment>
        {this.state.edit ? (
          <div
            className="picture-container"
            onClick={() => this.openFileGallary()}
          >
            {catalog.pictureURL ? (
              <div>
                <img
                  src={catalog.pictureURL}
                  style={{ height: 75, width: 75 }}
                  alt="No images"
                />
                <div
                  onClick={(e) => this.onRemoveImage(e)}
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
                  display: "table",
                }}
              >
                <span
                  style={{
                    color: "rgb(113, 113, 113)",
                    display: "table-cell",
                    verticalAlign: "middle",
                  }}
                >
                  Upload picture
                </span>
              </div>
            )}
          </div>
        ) : (
          catalog.pictureURL && (
            <img
              src={catalog.pictureURL}
              style={{ width: 75, height: 75 }}
              alt="customer img"
            />
          )
        )}
      </React.Fragment>
    );
  };

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
    const original = this.state.catalog;
    let catalog = {};
    if (isNew) {
      catalog = this.state.catalogForm;
    } else {
      catalog = recordList.find((r) => r.row_id === original.row_id) || {};
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
            {catalog.first_name} {catalog.name}
          </span>
        </div>
        <div
          key="1"
          className="right right-icons"
          style={{ color: "#717171", justifyContent: "flex-end" }}
        >
          <PageElement key="delete" offline={!catalog.id}>
            {this.state.edit ? (
              <div
                key="cancel"
                style={{
                  color: "rgba(44, 196,211,1)",
                  marginRight: 5,
                  display: isNew ? "none" : "inherit",
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
                onClick={() => this.removeRecord(catalog)}
              >
                <Icon icon="fa-trash" />
              </div>
            )}
          </PageElement>
          <PageElement key="edit" offline={!catalog.id}>
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
    placeholder: placeholder,
  });

  renderCatalogBasicFields(catalogForm) {
    const { catalog } = this.state;
    return (
      <div>
        {this.hasField("name") && (
          <CardView.InputField
            edit={this.state.edit}
            title={this.getFieldLabel("name")}
            onChange={(e) => this.changeField("name", e.target.value)}
            value={catalogForm.name}
          />
        )}
        {this.hasField("catalogType") && (
          <RenderManyToOne
            name="catalogType"
            searchAPI={(e) => this.props.catalog.refs.catalogtype.searchAll(e)}
            onChange={(e) => this.changeField("catalogType", e.target.value)}
            {...this.manyToOneProps(
              "name",
              catalogForm.catalogType,
              this.getFieldLabel("catalogType"),
              translate("catalogType")
            )}
          />
        )}
      </div>
    );
  }

  renderCatalogBasic(catalogForm) {
    return (
      <CardView className="catalog-principal-tab">
        <div className="catalog-image-container">{this.renderCatalogImage(catalogForm)}</div>
        {this.renderCatalogBasicFields(catalogForm)}
      </CardView>
    );
  }

  downloadPdf(catalog) {
    const pdfFile = catalog.pdfFile;
    if(pdfFile) {
      const url = `ws/rest/com.axelor.meta.db.MetaFile/${pdfFile.id}/content/download?v=${pdfFile.$version}`;
      this.setState({ downloadToast: true });
      this.props.api.refs.metafile.wsFilesURL(url).then(res => {
        downloadFile(res, pdfFile.fileName).then(({ nativeURL }) => {
          setTimeout(() => {
            this.setState({ downloadToast: false });
            openFile(nativeURL, "application/pdf");
          }, 1500);
        });
      });
    }
  }

  /* render catalog view */
  renderItem(catalogForm) {
    const { activityLoading, isNew, edit } = this.state;

    return (
      <div style={{ marginBottom: 25 }}>
        {isNew && edit ? (
          this.renderCatalogBasic(catalogForm)
        ) : (
          <CardView principalView>
            <div className="catalog-image-container">{this.renderCatalogImage(catalogForm)}</div>
            {edit ? (
              <div style={{ padding: "10px 10px 10px 15px" }}>
                {this.renderCatalogBasicFields(catalogForm)}
              </div>
            ) : (
              <div
                style={{
                  paddingBottom: 10,
                  paddingTop: 20,
                  textAlign: "center",
                }}
              >
                <CardView.InputField
                  value={catalogForm.name}
                  textClassName="catalog-person-name"
                  className="principal-details-field"
                  style={{ marginTop: 25, marginBottom: 2 }}
                />
                <CardView.InputField
                  value={catalogForm.user && catalogForm.user.full_name}
                  textClassName="catalog-assigned-user"
                  className="principal-details-field"
                />
              </div>
            )}
          </CardView>
        )}
        <CardView hidden={this.state.overviewPanel !== 1}>
          {this.hasField("description") && (
            <CardView.TextArea
              edit={this.state.edit}
              title={this.getFieldLabel("description")}
              value={catalogForm.description}
              onChange={(e) => this.changeField("description", e.target.value)}
            />
          )}
          {this.hasField("pdfFile") && (
            <CardView.InputField
              value={this.getFileName(catalogForm)}
              title={this.getFieldLabel("pdfFile")}
              edit={this.state.edit}
              onSelectFile={this.selectFile}
              platform={this.props.app_state.platform}
              icon="paperclip"
              readOnly={true}
              onClick={() => this.downloadPdf(catalogForm)}
            />
          )}
        </CardView>
      </div>
    );
  }

  getFileName(catalogForm) {
    const { file, pdfFile } = catalogForm;
    if (file) {
      if (file.file) {
        return file.file.name;
      }
      return file.name;
    }
    if (pdfFile) {
      return pdfFile.fileName;
    }
    return null;
  }

  renderPullHookLoader(props = {}) {
    return (
      <div style={{ marginTop: 60 }} className="custom-hook-loader" {...props}>
        <ProgressCircular indeterminate />
      </div>
    );
  }

  renderPullHook() {
    const { hookState, isLoading, catalog } = this.state;
    let hookContent = null;
    if (hookState === "action") {
      hookContent = this.renderPullHookLoader();
    }
    return (
      <PullHook
        disabled={isLoading}
        onChange={(e) => this.setState({ hookState: e.state })}
        onLoad={(done) => {
          this.fetchNewData(catalog);
          done();
        }}
        fixedContent={true}
      >
        {hookContent}
      </PullHook>
    );
  }
  render() {
    const { isLoading, recordList, catalogForm, isNew } = this.state;
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
          this.renderItem(catalogForm)
        ) : (
          <React.Fragment>
            {this.renderPullHook()}
            <SwiperView
              recordList={recordList}
              renderItem={(record) => this.renderItem(record)}
              onActive={(record) => this.onRecordSwipe(record)}
              onInitSwiper={(swiper) => (this.swiper = swiper)}
            />
          </React.Fragment>
        )}
        <Toast isOpen={this.state.downloadToast}>
          <div className="message">Opening a file, please wait...</div>
        </Toast>
      </Page>
    );
  }
}

CatalogView.propTypes = {
  navigator: PropTypes.any,
  route: PropTypes.any,
};

const mapPropsToState = (state) => {
  return { user_data: state.user, app_state: state.app };
};

export default connect(reduxConnect(mapPropsToState)(CatalogView));
