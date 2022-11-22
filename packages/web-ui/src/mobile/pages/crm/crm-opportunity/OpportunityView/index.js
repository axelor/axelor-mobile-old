import React from "react";
import PropTypes from "prop-types";
import connect from "../../connect/crm-opportunity";
import Page, { PageElement } from "../../../page";
import {
  AlertDialog,
  Toolbar,
  ToolbarButton,
  Icon,
  ProgressCircular,
  Modal,
  Select,
  PullHook
} from "react-onsenui";
import ons from "onsenui";
import { connect as reduxConnect } from "react-redux";
import moment from "moment";
import "./index.css";

import Translate, { translate } from "../../../../locale";
import { saleStageType } from "./../common";
import { CardView, SwiperView } from "./../../../../components";
import { debounceCallback } from "./../../../debounce";
import PageCommentList, {
  RenderManyToOne,
  Tabs
} from "../../../page-comment-list";

class OpportunityView extends PageCommentList {
  constructor(props) {
    super(props);
    const { info } = this.props.user_data.data;
    const company = info.active_company || null;
    this.state = {
      opportunity: {},
      opportunityForm: {
        opportunity_type: null,
        name: null,
        sales_stage_select: 1,
        next_step: null,
        expected_close_date: null,
        description: null,
        partner: null,
        lead: null,
        user: {
          id: props.user_data.data.info["user.id"],
          full_name: props.user_data.data.info["user.name"]
        },
        currency: company ? company.currency : null,
        amount: "0.00",
        probability: "0.00",
        source: null,
        company: company ? { id: company.id, name: company.name } : null
      },
      recordList: [],
      secondTabber: 1,
      overviewPanel: 1,
      submitError: {
        content: null,
        title: null
      },
      hookState: "initial",
      showErrorDialog: false,
      isLoading: false,
      commentMessage: "",
      all: [],
      total: 0,
      limit: 4,
      offset: 0,
      activeIndex: 0
    };
    this.recordId = null;
  }

  componentDidMount() {
    const { route } = this.props;
    const { data, getRecordsByIndex, record } = route;
    if (data && data.id !== undefined) {
      if (getRecordsByIndex) {
        const records = getRecordsByIndex(data, true);
        const targetIndex = records.findIndex(r => r.id === data.id);
        this.swiper.slideTo(targetIndex, 0, true);
        this.setState({ recordList: [...records], activeIndex: targetIndex });
        this.fetchNewData(data);
      }
    } else {
      let { opportunityForm } = this.state;
      if (record) {
        opportunityForm = { ...opportunityForm, ...record };
      }
      this.setState({ isNew: true, edit: true, opportunityForm });
    }
  }

  getApi() {
    return this.props.opportunity;
  }

  getCurrentRecord() {
    return this.state.opportunity;
  }

  fetchNewData(data, fromSwipe = false) {
    const { fetch } = this.props.opportunity;
    const { limit, offset } = this.state;
    this.setState({ isLoading: true }, () => {
      setTimeout(() => {
        fetch(data, {
          lead: ["firstName", "name", "company", "companyName"]
        }).then(res => {
          const { data } = res;
          if (data && data.length > 0) {
            const newData = Object.assign({}, data[0]);
            if (newData.lead) {
              newData.lead["full_name"] = `${newData.lead["first_name"]} ${
                newData.lead["name"]
              }`;
            }
            const { recordList } = this.state;
            const targetIndex = recordList.findIndex(r => r.id === newData.id);
            recordList[targetIndex] = Object.assign({}, newData);
            this.setState(
              { opportunity: newData, recordList, isLoading: false },
              () => {
                this.getAllComment(limit, offset);
              }
            );
          }
        });
      });
    });
  }

  changeField(field, value) {
    const { opportunity, recordList, isNew, opportunityForm } = this.state;
    if (isNew) {
      opportunityForm[field] = value;
      this.setState({ opportunityForm });
    } else {
      const targetIndex = recordList.findIndex(r => r.id === opportunity.id);
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
      const { recordList, opportunity } = this.state;
      const targetIndex = recordList.findIndex(
        record => record.id === opportunity.id
      );
      if (
        JSON.stringify(recordList[targetIndex]) !==
          JSON.stringify(opportunity) &&
        close
      ) {
        ons.notification
          .confirm(translate("Alert.confirmClose"), {
            title: translate("Alert.confirm"),
            id: "crm-opportunity",
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
    const { recordList, opportunity } = this.state;
    return new Promise((resolve, reject) => {
      const targetIndex = recordList.findIndex(
        record => record.id === opportunity.id
      );
      this.isRecordChanged(close).then(ok => {
        if (ok) {
          recordList[targetIndex] = opportunity;
          this.setState({ edit: false, opportunity, recordList });
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
      this.setState({ recordList: list, offset: 0, total: 0, all: [] }, () => {
        const { recordList } = this.state;
        const targetIndex = recordList.findIndex(r => r.id === record.id);
        this.swiper.slideTo(targetIndex, 0, true);
      });
    } else {
      this.setState({ recordList: [record], opportunity: record });
    }
    debounceCallback(() => {
      this.closeEdit().then(res => {
        this.fetchNewData(record, true);
      });
    });
  }

  validateData(record) {
    let isValid = true;
    if (!record.name || !(record.name.length > 0)) {
      isValid = false;
      this.setState({
        submitError: {
          title: translate("Alert.saveErrorTitle"),
          content: translate("Alert.nameRequired")
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
    const { opportunity, recordList, isNew, opportunityForm } = this.state;
    const { add, update } = this.props.opportunity;
    if (isNew) {
      if (!this.validateData(opportunityForm)) {
        this.setState({ showErrorDialog: true });
        return;
      }
      this.startLoading();
      add(opportunityForm).then(res => {
        if (res.status === -1) {
          ons.notification.alert(res.error.message, {
            id: "opportunity-error"
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
      const record = recordList.find(r => r.id === opportunity.id);
      if (!this.validateData(record)) {
        this.setState({ showErrorDialog: true });
        return;
      }
      if (record.id !== undefined) {
        this.startLoading();
        update(record).then(res => {
          if (res.status === -1) {
            ons.notification.alert(res.error.message, {
              id: "opportunity-error"
            });
            this.setState({ isLoading: false });
          } else {
            const { data } = res;
            if (data && data.length > 0) {
              const newRecord = data[0];
              if (onUpdate) {
                onUpdate(data[0]);
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
    const { remove } = this.props.opportunity;
    ons.notification
      .confirm(translate("Alert.confirmDelete"), {
        title: translate("Alert.confirm"),
        id: "remove-opportunity"
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

  hasField(fieldName) {
    const { fields } = this.props.opportunity;
    const targetIndex = fields.findIndex(field => field.name === fieldName);
    return targetIndex !== -1 ? true : false;
  }

  getFieldLabel(fieldName) {
    const { fields } = this.props.opportunity;
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

  isAssignedToPanelEmpty() {
    const { opportunity } = this.state;
    if (opportunity.user || opportunity.company) {
      return false;
    }
    return true;
  }

  isLinkedToPanelEmpty() {
    const { opportunity } = this.state;
    if (opportunity.partner || opportunity.lead) {
      return false;
    }
    return true;
  }

  isFinancialPanelEmpty() {
    const { opportunity } = this.state;
    if (opportunity.currency || opportunity.amount) {
      return false;
    }
    return true;
  }

  isFollowUpPanelEmpty() {
    const { opportunity } = this.state;
    if (
      opportunity.sales_stage_select ||
      opportunity.next_step ||
      opportunity.expected_close_date ||
      opportunity.probability
    ) {
      return false;
    }
    return true;
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

  searchSalesStage(e, saleStageType) {
    const data = this.mapObjectToList(saleStageType);
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
      newData[i]["name"] = translate(`Opportunity.${d.name}`);
    });
    return Promise.resolve({ data: newData, total: newData.length });
  }

  renderToolbar() {
    const { recordList, isNew } = this.state;
    const original = this.state.opportunity;
    let opportunity = {};
    if (isNew) {
      opportunity = this.state.opportunityForm;
    } else {
      opportunity = recordList.find(r => r.id === original.id) || {};
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
            {<Translate text="opportunity_title" /> || "Opportunity"}
          </span>
        </div>
        <div
          key="1"
          className="right icons"
          style={{ color: "#717171", justifyContent: "flex-end" }}
        >
          {[
            <PageElement key="delete" offline={!opportunity.id}>
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
                  onClick={() => this.removeRecord(opportunity)}
                >
                  <Icon icon="fa-trash" />
                </div>
              )}
            </PageElement>,
            <PageElement key="edit" offline={!opportunity.id}>
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
          ]}
        </div>
      </Toolbar>
    );
  }

  renderItem(opportunityForm) {
    const { opportunity } = this.state;
    return (
      <div style={{ marginBottom: 25 }}>
        <CardView principalView>
          {this.state.edit ? (
            <div style={{ padding: "10px 10px 10px 15px" }}>
              {this.hasField("sales_stage_select") && (
                <CardView.FieldWrapper
                  text={translate(
                    `Opportunity.${
                      saleStageType[opportunityForm.sales_stage_select]
                    }`
                  )}
                  fieldLabel={this.getFieldLabel("sales_stage_select")}
                  edit={this.state.edit}
                >
                  <Select
                    className="status-select-input"
                    value={`${opportunityForm.sales_stage_select}`}
                    onChange={e =>
                      this.changeField("sales_stage_select", e.target.value)
                    }
                    style={{ width: "100%" }}
                  >
                    <option disabled value></option>
                    {Object.keys(saleStageType).map(
                      (s, i) =>
                        ([null, undefined].includes(
                          opportunity.sales_stage_select
                        ) ||
                          s >= opportunity.sales_stage_select) && (
                          <option key={i} value={s}>
                            {translate(`Opportunity.${saleStageType[s]}`)}
                          </option>
                        )
                    )}
                  </Select>
                </CardView.FieldWrapper>
              )}
              {this.hasField("opportunity_type") && (
                <RenderManyToOne
                  name="opportunity_type"
                  searchAPI={e =>
                    this.props.opportunity.refs.opportunitytype.searchAll(e)
                  }
                  onChange={e =>
                    this.changeField("opportunity_type", e.target.value)
                  }
                  {...this.manyToOneProps(
                    "name",
                    opportunityForm.opportunity_type,
                    this.getFieldLabel("opportunity_type"),
                    translate("select_opportunity_type")
                  )}
                />
              )}
              {this.hasField("source") && (
                <RenderManyToOne
                  name="source"
                  searchAPI={e =>
                    this.props.opportunity.refs.source.searchAll(e)
                  }
                  onChange={e => this.changeField("source", e.target.value)}
                  {...this.manyToOneProps(
                    "name",
                    opportunityForm.source,
                    this.getFieldLabel("source"),
                    translate("select_source")
                  )}
                />
              )}
              {this.hasField("name") && (
                <CardView.InputField
                  edit={this.state.edit}
                  title={this.getFieldLabel("name")}
                  onChange={e => this.changeField("name", e.target.value)}
                  value={opportunityForm.name}
                />
              )}
              {this.hasField("expected_close_date") && (
                <CardView.DateField
                  edit={this.state.edit}
                  title={this.getFieldLabel("expected_close_date")}
                  onChange={e =>
                    this.changeField("expected_close_date", e.target.value)
                  }
                  value={opportunityForm.expected_close_date}
                />
              )}
            </div>
          ) : (
            <div
              style={{ paddingBottom: 10, paddingTop: 20, textAlign: "center" }}
            >
              <CardView.TagButton>
                {translate(
                  `Opportunity.${
                    saleStageType[opportunityForm.sales_stage_select]
                  }`
                )}
              </CardView.TagButton>
              <CardView.InputField
                value={opportunityForm.name}
                textClassName="lead-person-name"
                className="principal-details-field"
                style={{ marginTop: 25, marginBottom: 2 }}
              />
              <CardView.InputField
                value={
                  opportunityForm.opportunity_type &&
                  opportunityForm.opportunity_type.name
                }
                textClassName="lead-assigned-user"
                className="principal-details-field"
              />
              <CardView.InputField
                value={opportunityForm.source && opportunityForm.source.name}
                textClassName="lead-assigned-user"
                className="principal-details-field"
              />
              <CardView.InputField
                value={
                  opportunityForm.expected_close_date &&
                  moment(opportunityForm.expected_close_date).format(
                    "DD MMM YYYY"
                  )
                }
                textClassName="lead-assigned-user"
                className="principal-details-field"
              />
              {(opportunityForm.partner || opportunityForm.lead) && (
                <div className="linkto-view">
                  <div>{translate("linkedto_panel")} : </div>
                  <div className="linkto-field-list">
                    <span>
                      {opportunityForm.partner &&
                        `${opportunityForm.partner.full_name} (${translate(
                          "Opportunity.partner"
                        )})`}
                    </span>
                    <span>
                      {opportunityForm.lead &&
                        `${opportunityForm.lead.full_name} (${translate(
                          "Opportunity.lead"
                        )})`}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardView>
        <Tabs
          tabs={[
            { title: <Translate text="followup_panel" />, value: 1 },
            {
              title: <Translate text="opportunity_financial_terms" />,
              value: 2
            },
            {
              title: `${translate("common.comments")}(${this.state.total})`,
              value: 3,
              hide: () => this.state.isNew
            }
          ]}
          className="medium-size-tab"
          activeTab={this.state.overviewPanel}
          onChange={e => this.setState({ overviewPanel: e })}
        />
        <div className="opportunity-tab-container">
          {this.state.overviewPanel === 3 && this.renderCommentList()}

          <CardView
            className="opportunity-details-tab"
            hidden={this.state.overviewPanel !== 1}
          >
            {this.hasField("next_step") && (
              <CardView.InputField
                edit={this.state.edit}
                title={this.getFieldLabel("next_step")}
                onChange={e => this.changeField("next_step", e.target.value)}
                value={opportunityForm.next_step}
              />
            )}
            {/* {
              this.hasField('expected_close_date') &&
              <CardView.DateField
                edit={this.state.edit}
                title={this.getFieldLabel('expected_close_date')}
                onChange={(e) => this.changeField('expected_close_date', e.target.value)}
                value={opportunityForm.expected_close_date}
              />
            } */}
            {this.hasField("probability") && (
              <CardView.Number
                title={this.getFieldLabel("probability")}
                onChange={e => this.changeField("probability", e.target.value)}
                value={opportunityForm.probability}
                edit={this.state.edit}
                defaultValue="0.00"
              />
            )}
          </CardView>
          <CardView
            className="financila-tab"
            hidden={this.state.overviewPanel !== 2}
          >
            {this.hasField("amount") && (
              <CardView.InputField
                edit={this.state.edit}
                type="tel"
                title={this.getFieldLabel("amount")}
                onChange={e => this.changeField("amount", e.target.value)}
                isPrice={true}
                value={opportunityForm.amount}
              />
            )}
            {this.hasField("currency") && (
              <RenderManyToOne
                name="currency"
                searchAPI={e =>
                  this.props.opportunity.refs.currency.searchAll(e)
                }
                onChange={e => this.changeField("currency", e.target.value)}
                {...this.manyToOneProps(
                  "name",
                  opportunityForm.currency,
                  this.getFieldLabel("currency"),
                  translate("select_currency")
                )}
              />
            )}
          </CardView>
        </div>
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
                searchAPI={e => this.props.opportunity.refs.user.searchAll(e)}
                onChange={e => this.changeField("user", e.target.value)}
                {...this.manyToOneProps(
                  "full_name",
                  opportunityForm.user,
                  this.getFieldLabel("user"),
                  translate("select_user")
                )}
              />
            )}
            {this.hasField("company") && (
              <RenderManyToOne
                name="company"
                searchAPI={e =>
                  this.props.opportunity.refs.company.searchAll(e)
                }
                onChange={e => this.changeField("company", e.target.value)}
                {...this.manyToOneProps(
                  "name",
                  opportunityForm.company,
                  this.getFieldLabel("company"),
                  translate("select_company")
                )}
              />
            )}
          </CardView>
          <CardView
            className="linked-to-tab"
            hidden={this.state.secondTabber !== 2}
          >
            {this.hasField("partner") && (
              <RenderManyToOne
                name="partner"
                searchAPI={e =>
                  this.props.opportunity.refs.customer.searchAll(e)
                }
                onChange={e => this.changeField("partner", e.target.value)}
                {...this.manyToOneProps(
                  "full_name",
                  opportunityForm.partner,
                  this.getFieldLabel("partner"),
                  translate("select_customer")
                )}
              />
            )}
            {this.hasField("lead") && (
              <RenderManyToOne
                name="lead"
                searchAPI={e => this.props.opportunity.refs.lead.searchAll(e)}
                onChange={e => this.changeField("lead", e.target.value)}
                {...this.manyToOneProps(
                  "full_name",
                  opportunityForm.lead,
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
    const { hookState, isLoading,opportunity } = this.state;
    let hookContent = null;
    if (hookState === "action") {
      hookContent = this.renderPullHookLoader();
    }
    return (
      <PullHook
        disabled={isLoading}
        onChange={e => this.setState({ hookState: e.state })}
        onLoad={done =>
          {  this.fetchNewData(opportunity)
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
    const { recordList, isLoading, opportunityForm, isNew } = this.state;
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
        {this.renderAlertBox()}
        {isNew ? (
          this.renderItem(opportunityForm)
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

OpportunityView.propTypes = {
  navigator: PropTypes.any,
  route: PropTypes.any
};

const mapPropsToState = state => {
  return { user_data: state.user, app_state: state.app };
};

export default connect(reduxConnect(mapPropsToState)(OpportunityView));
