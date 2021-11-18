import React from "react";
import PropTypes from "prop-types";
import { connect } from "@axelor/web-client";
import { connect as reduxConnect } from "react-redux";
import Page, { PageElement } from "../../page";
import ProductsList from "../product/list-products";
import {
  AlertDialog,
  Toolbar,
  ToolbarButton,
  Icon,
  ProgressCircular,
  Toast,
  Select,
  Modal,
  PullHook
} from "react-onsenui";
import PageCommentList, { RenderManyToOne } from "../../page-comment-list";
import { CardView, TabberView, SwiperView } from "../../../components";
import Translate, { translate } from "../../../locale";
import ProductDetailsPage from "../product/product-details";
import { downloadFile, openFile } from "./download";
import MailPage from "../../email/mail";
import { getSepratedPrice } from "../../common.func";
import ons from "onsenui";
import moment from "moment";

const getStatusSelect = () => ({
  data: [
    { id: 1, value: translate("common.status.Draft") },
    { id: 2, value: translate("common.status.Finalize") },
    { id: 3, value: translate("common.status.orderConfirmed") },
    { id: 4, value: translate("common.status.Finished") },
    { id: 5, value: translate("common.status.Canceled") }
  ],
  total: 5
});

class ViewQuotation extends PageCommentList {
  constructor(props) {
    super(props);
    const { info } = this.props.user_data.data;
    this.state = {
      orderForm: {
        creation_date: moment().format("YYYY-MM-DD"),
        client_partner: null,
        contact_partner: null,
        currency: info.active_company && info.active_company.currency,
        company: info.active_company && info.active_company,
        duration: {
          id: 4,
          name: "15 days"
        },
        end_of_validity_date: moment()
          .add(15, "days")
          .format("YYYY-MM-DD"),
        cancel_reason: null,
        sale_order_line_list: [],
        sale_order_line_tax_list: [],
        status_select: 1,
        ex_tax_total: 0.0,
        in_tax_total: 0.0,
        tax_total: 0.0
      },
      recordList: [],
      hookState: "initial",
      fields: props.order.fields,
      edit: false,
      showErrorDialog: false,
      submitError: {
        title: null,
        content: null
      },
      alertDialogShown: false,
      downloadToast: false,
      activeTab: 1,
      isNew: false,
      commentMessage: "",
      all: [],
      total: 0,
      limit: 4,
      offset: 0,
      activeIndex: 0
    };
  }

  renderToolbar() {
    const { orderForm, recordList, loading, isNew } = this.state;
    const order = recordList.find(r => r.row_id === orderForm.row_id) || {};
    return (
      <Toolbar noshadow modifier="transparent" style={{ background: "#fff" }}>
        <div className="left left-icon-width">
          <ToolbarButton
            onClick={() => this.onBack(true)}
            style={{ color: "gray" }}
          >
            <Icon icon="chevron-left" />
          </ToolbarButton>
        </div>
        <div
          className="center  ellipse-toolbar left-align-title"
          style={{ color: "#000" }}
        >
          <span
            onClick={() => this.onBack(true)}
            style={{ display: "inline-block" }}
          >
            {!loading
              ? `${translate(
                  "common.quotationHeader"
                )} ${order.sale_Order_Seq || order.saleOrderSeq || ""}`
              : ""}
          </span>
        </div>

        <div
          key="1"
          className="right right-icons"
          style={{ color: "#717171", justifyContent: "flex-end" }}
        >
          <PageElement key="delete" offline={!order.id}>
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
                onClick={() => this.onDeleteQuotationRecord(order)}
              >
                <Icon icon="fa-trash" />
              </div>
            )}
          </PageElement>
          <PageElement key="edit" offline={!order.id}>
            {this.state.edit ? (
              <div
                onClick={() => this.onSave()}
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
                onClick={() =>
                  this.setState({ edit: !this.state.edit, activeTab: 1 })
                }
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

  componentDidMount() {
    const { route } = this.props;
    const { data, getRecordsByIndex } = route;
    const { order } = data;
    if (order && order.id !== undefined) {
      if (getRecordsByIndex) {
        const records = getRecordsByIndex(order, true);
        const targetIndex = records.findIndex(r => r.id === order.id);
        this.swiper.slideTo(targetIndex, 0, true);
        this.setState({ recordList: [...records], activeIndex: targetIndex });
        this.fetchNewData(order);
      }
    } else {
      this.setState({
        isNew: true,
        edit: true,
        activeTab: 1
      });
    }
  }

  getApi() {
    return this.props.order;
  }

  getCurrentRecord() {
    return this.state.orderForm;
  }

  fetchNewData(data) {
    const { fetch, fields } = this.props.order;
    const { limit, offset } = this.state;
    const related = {
      saleOrderLineList: [
        "fullName",
        "price",
        "unit",
        "priceDiscounted",
        "productName",
        "discountTypeSelect",
        "qty",
        "exTaxTotal",
        "inTaxTotal",
        "taxLine"
      ],
      saleOrderLineTaxList: ["taxLine", "exTaxBase", "taxTotal"],
      company: ["id", "partner", "name"],
      currency: ["id", "name", "code", "symbol"]
    };
    this.setState({ isLoading: true }, () => {
      setTimeout(() => {
        fetch(data, related).then(res => {
          const { data } = res;
          if (data && data.length > 0) {
            const orderForm = Object.assign({}, data[0]);
            const { recordList } = this.state;
            const targetIndex = recordList.findIndex(
              r => r.id === orderForm.id
            );
            recordList[targetIndex] = Object.assign({}, orderForm);
            this.setState(
              { orderForm, fields, recordList, isLoading: false },
              () => {
                this.getAllComment(limit, offset);
              }
            );
          }
        });
      }, 300);
    });
  }

  onViewPDF(order) {
    const { action, wsFilesURL } = this.props.order;
    const data = {
      context: {
        ...order
      }
    };

    this.setState({ downloadToast: true });
    action("action-sale-order-method-show-sale-order", data).then(d => {
      wsFilesURL(d.data[0].view.views[0].name).then(res => {
        var url_string = res;
        var url = new URL(url_string);
        var name = url.searchParams.get("name");
        downloadFile(res, name).then(({ nativeURL }) => {
          setTimeout(() => {
            this.setState({ downloadToast: false });
            openFile(nativeURL, "application/pdf");
          }, 1500);
        });
      });
    });
  }

  isRecordChanged(close) {
    return new Promise((resolve, reject) => {
      const { recordList, orderForm } = this.state;
      const targetIndex = recordList.findIndex(
        record => record.id === orderForm.id
      );
      if (
        JSON.stringify(recordList[targetIndex]) !== JSON.stringify(orderForm) &&
        close
      ) {
        ons.notification
          .confirm(translate("Alert.confirmClose"), {
            title: translate("Alert.confirm"),
            id: "sales-quoatation",
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

  onBack() {
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
    const { recordList, orderForm } = this.state;
    return new Promise((resolve, reject) => {
      const targetIndex = recordList.findIndex(
        record => record.id === orderForm.id
      );
      this.isRecordChanged(close).then(ok => {
        if (ok) {
          recordList[targetIndex] = orderForm;
          this.setState({ edit: false, orderForm, recordList });
          resolve(true);
        }
      });
    });
  }

  onInputChange(e, name, done) {
    const { value } = e.target;
    const { orderForm, recordList, isNew } = this.state;
    if (isNew) {
      this.setState(
        {
          orderForm: {
            ...orderForm,
            [name]: value
          }
        },
        done
      );
    } else {
      const targetIndex = recordList.findIndex(r => r.id === orderForm.id);
      const record = { ...recordList[targetIndex] };
      record[name] = value;
      recordList[targetIndex] = { ...record };
      this.setState({ recordList }, done);
    }
  }

  validateData() {
    let isValid = true;
    const { orderForm } = this.state;
    if (!orderForm.client_partner) {
      isValid = false;
      this.setState({
        submitError: {
          title: "Save Error",
          content: "Client field required!!!"
        }
      });
      return isValid;
    }
    if (!orderForm.currency) {
      isValid = false;
      this.setState({
        submitError: {
          title: "Save Error",
          content: "Currency field required!!!"
        }
      });
      return isValid;
    }
    return isValid;
  }

  onSave(e) {
    if (!this.validateData()) {
      this.setState({ showErrorDialog: true });
      return;
    }
    this.setState({ isLoading: true });
    const { orderForm, recordList } = this.state;
    const { update, add } = this.props.order;
    const { updateQuotation, addQuotation } = this.props.route;
    const { info } = this.props.user_data.data;
    if (!orderForm.status_select) {
      orderForm.statusSelect = 3;
    }
    const record = recordList.find(r => r.row_id === orderForm.row_id);
    if (record && record.id !== undefined) {
      if (record.status_select === 5 && orderForm.status_select !== 5) {
        this.setState(
          {
            submitError: {
              title: "Information",
              content: "The sale order was canceled"
            },
            showErrorDialog: true,
            isLoading: false
          },
          () => this.renderAlertBox()
        );
      }

      if (Number(record.status_select) === 3) {
        if (!record.confirmed_by_user) {
          record.confirmed_by_user = {
            id: info["user.id"]
          };
        }
        if (!record.confirmation_date_time) {
          record.confirmation_date_time = moment().format("YYYY-MM-DDTHH:mm");
        }
      }
      update(record)
        .then(result => {
          if (result.status === -1) {
            ons.notification.alert(result.error.message, {
              id: "currency-error"
            });
            this.setState({ isLoading: false });
          } else {
            const { data } = result;
            const newRecord = data[0];
            if (updateQuotation) {
              updateQuotation(newRecord);
            }
            this.fetchNewData(newRecord);
            this.setState({ edit: false, isLoading: false });
          }
        })
        .catch(err => {
          console.log(err);
        });
    } else {
      if (Number(orderForm.status_select) === 3) {
        orderForm.confirmation_date_time = moment().format(
          "YYYY-MM-DDTHH:mm"
        );
        orderForm.confirmed_by_user = {
          id: info["user.id"]
        };
      }
      add(orderForm)
        .then(res => {
          if (res.status === -1) {
            ons.notification.alert(res.error.message, {
              id: "currency-error"
            });
            this.setState({ isLoading: false });
          } else {
            if (addQuotation) {
              addQuotation(res.data[0]);
            }
            this.setState(
              {
                orderForm: res.data[0],
                isNew: false,
                edit: false,
                isLoading: false
              },
              () => {
                this.onRecordSwipe(res.data[0]);
              }
            );
          }
        })
        .catch(err => {
          console.log(err);
        });
    }
  }

  calculateEndOfValidaty() {
    const { orderForm, recordList, isNew } = this.state;
    if (isNew) {
      if (orderForm.duration.name === "15 days") {
        let calDate = moment(orderForm.creation_date).add(15, "days");
        orderForm["end_of_validity_date"] = moment(calDate).format(
          "YYYY-MM-DD"
        );
      } else if (orderForm.duration.name === "1 month") {
        let calDate = moment(orderForm.creation_date).add(1, "month");
        orderForm["end_of_validity_date"] = moment(calDate).format(
          "YYYY-MM-DD"
        );
      } else if (orderForm.duration.name === "2 month") {
        let calDate = moment(orderForm.creation_date).add(2, "month");
        orderForm["end_of_validity_date"] = moment(calDate).format(
          "YYYY-MM-DD"
        );
      } else if (orderForm.duration.name === "6 month") {
        let calDate = moment(orderForm.creation_date).add(6, "month");
        orderForm["end_of_validity_date"] = moment(calDate).format(
          "YYYY-MM-DD"
        );
      }
      this.setState({
        orderForm
      });
    } else {
      const targetIndex = recordList.findIndex(r => r.id === orderForm.id);
      const record = { ...recordList[targetIndex] };
      let { creation_date, duration } = record;
      if (duration.name === "15 days") {
        let calDate = moment(creation_date).add(15, "days");
        record["end_of_validity_date"] = moment(calDate).format("YYYY-MM-DD");
      } else if (duration.name === "1 month") {
        let calDate = moment(creation_date).add(1, "month");
        record["end_of_validity_date"] = moment(calDate).format("YYYY-MM-DD");
      } else if (duration.name === "2 month") {
        let calDate = moment(creation_date).add(2, "month");
        record["end_of_validity_date"] = moment(calDate).format("YYYY-MM-DD");
      } else if (duration.name === "6 month") {
        let calDate = moment(creation_date).add(6, "month");
        record["end_of_validity_date"] = moment(calDate).format("YYYY-MM-DD");
      }
      recordList[targetIndex] = { ...record };
      this.setState({ recordList });
    }
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

  onAddProduct(product, targetIndex = null) {
    const { recordList, isNew } = this.state;
    const original = this.state.orderForm;
    let orderForm = original;
    if (!isNew) {
      const target = this.state.recordList.findIndex(
        r => r.row_id === original.row_id
      );
      orderForm = recordList[target];
    }
    let {
      sale_order_line_list = [],
      sale_order_line_tax_list = [],
      ex_tax_total = 0.0,
      in_tax_total = 0.0
    } = orderForm;
    if (targetIndex !== null) {
      sale_order_line_list[targetIndex] = product;
      sale_order_line_tax_list[targetIndex] = {
        exTaxBase: product.ex_tax_total,
        taxTotal: product.amount_tax,
        taxLine: product.tax
      };
    } else {
      sale_order_line_list.push(product);
      sale_order_line_tax_list.push({
        exTaxBase: product.ex_tax_total,
        taxTotal: product.amount_tax,
        taxLine: product.tax
      });
    }
    ex_tax_total =
      Number(ex_tax_total) +
      Number(product.ex_tax_total - product.oldExtotal || 0);
    in_tax_total =
      Number(in_tax_total) +
      Number(product.in_tax_total - product.oldIxtotal || 0);

    orderForm.sale_order_line_list = [...sale_order_line_list];
    orderForm.sale_order_line_tax_list = [...sale_order_line_tax_list];

    if (isNew) {
      this.setState({
        orderForm: {
          ...orderForm,
          ex_tax_total,
          in_tax_total,
          tax_total: in_tax_total - ex_tax_total
        }
      });
    } else {
      const target = this.state.recordList.findIndex(
        r => r.row_id === original.row_id
      );
      recordList[target] = {
        ...orderForm,
        ex_tax_total,
        in_tax_total,
        tax_total: in_tax_total - ex_tax_total
      };
      this.setState({ recordList });
    }
  }

  onDeleteQuotation(selectOrder, index) {
    const { isNew } = this.state;
    if (isNew) {
      const { orderForm } = this.state;
      let {
        sale_order_line_list = [],
        sale_order_line_tax_list = [],
        ex_tax_total = 0,
        in_tax_total = 0
      } = orderForm;
      orderForm.sale_order_line_list.splice(index, 1);
      orderForm.sale_order_line_tax_list.splice(index, 1);
      orderForm.sale_order_line_list = [...sale_order_line_list];
      orderForm.sale_order_line_tax_list = [...sale_order_line_tax_list];
      ex_tax_total = orderForm.ex_tax_total - selectOrder.ex_tax_total;
      in_tax_total = orderForm.in_tax_total - selectOrder.in_tax_total;
      this.setState({
        orderForm: {
          ...orderForm,
          ex_tax_total,
          in_tax_total,
          tax_total: in_tax_total - ex_tax_total
        }
      });
    } else {
      const { recordList } = this.state;
      const original = this.state.orderForm;
      const target = this.state.recordList.findIndex(
        r => r.row_id === original.row_id
      );
      const orderForm = recordList[target];
      let {
        sale_order_line_list = [],
        sale_order_line_tax_list = [],
        ex_tax_total = 0,
        in_tax_total = 0
      } = orderForm;

      orderForm.sale_order_line_list.splice(index, 1);
      orderForm.sale_order_line_tax_list.splice(index, 1);

      orderForm.sale_order_line_list = [...sale_order_line_list];
      orderForm.sale_order_line_tax_list = [...sale_order_line_tax_list];
      ex_tax_total = orderForm.ex_tax_total - selectOrder.ex_tax_total;
      in_tax_total = orderForm.in_tax_total - selectOrder.in_tax_total;
      recordList[target] = {
        ...orderForm,
        ex_tax_total,
        in_tax_total,
        tax_total: in_tax_total - ex_tax_total
      };
      this.setState({ recordList });
    }
  }

  onDeleteQuotationRecord(order) {
    const { remove } = this.props.order;
    ons.notification
      .confirm(translate("Alert.confirmDelete"), {
        title: translate("Alert.confirm"),
        id: "remove-sales-quoatation"
      })
      .then(res => {
        if (res === 1) {
          remove(order).then(res => {
            if (this.props.route.removeQuotation) {
              this.props.route.removeQuotation(order);
            }
            this.props.navigator.popPage();
          });
        }
      });
  }

  sendEmail(orderForm) {
    const contextData = {
      model: "com.axelor.apps.sale.db.SaleOrder",
      tag: "SaleOrder",
      templateContextModel: "com.axelor.apps.sale.db.SaleOrder",
      prop: this.props.order
    };
    this.props.navigator.pushPage(
      {
        component: MailPage,
        path: "MailPage",
        viewProps: this.props.route,
        data: { user: { ...orderForm }, contextData },
        order: this.props.order
      },
      { animation: "none" }
    );
  }

  getStatus(value) {
    const { data } = getStatusSelect();
    return data.find(item => item.id === Number(value));
  }

  renderItem(orderForm) {
    const { fields, isNew } = this.state;
    const order = this.state.orderForm;
    const {
      sale_order_line_list = [],
      sale_order_line_tax_list = []
    } = orderForm;
    if (!fields.length) return null;
    const getField = key => {
      const field = fields.find(f => f.name === key);
      return field.label ? translate(field.label) : "";
    };
    const { mode } = this.props.app;
    return (
      <div style={{ marginBottom: 25 }} className="common-font-size">
        <CardView principalView>
          {this.renderAlertBox()}
          <div className="sale-item-container" style={{ paddingBottom: "5px" }}>
            {!this.state.edit && (
              <CardView.TagButton>
                {this.getStatus(orderForm.status_select).value}
              </CardView.TagButton>
            )}
            {this.getStatus(orderForm.status_select).value === "Canceled" && (
              <RenderManyToOne
                name="cancel_reason"
                fieldLabel={getField("cancel_reason")}
                placeholder={getField("cancel_reason")}
                targetName="cancel_reason"
                displayField="cancel_reason"
                value={orderForm && orderForm.cancel_reason}
                searchAPI={e => this.props.cancelreason.searchAll(e)}
                onChange={e => this.onInputChange(e, "cancel_reason")}
                edit={
                  this.getStatus(orderForm.status_select).value === "Canceled"
                    ? true
                    : this.state.edit
                }
                navigator={this.props.navigator}
              />
            )}
            {this.state.edit && (
              <CardView.FieldWrapper
                fieldLabel={getField("status_select")}
                edit={
                  orderForm.status_select &&
                  (this.getStatus(orderForm.status_select).value === "Canceled"
                    ? true
                    : this.state.edit)
                }
              >
                <Select
                  className="status-select-input"
                  value={`${this.getStatus(orderForm.status_select).id}`}
                  onChange={e =>
                    this.onInputChange(
                      { target: { value: e.target.value } },
                      "status_select"
                    )
                  }
                >
                  <option disabled value />
                  {getStatusSelect().data.map(
                    (s, i) =>
                      ([null, undefined].includes(order.status_select) ||
                        (!this.state.isNew
                          ? s.id >= order.status_select
                          : true)) && (
                        <option key={i} value={s.id}>
                          {s.value}
                        </option>
                      )
                  )}
                </Select>
              </CardView.FieldWrapper>
            )}
            {/* {this.state.edit &&
              <RenderManyToOne
                name="status_select"
                fieldLabel={getField('status_select')}
                placeholder={getField('status_select')}
                targetName="value"
                displayField="value"
                value={this.getStatus(orderForm.status_select)}
                liveSearch={false}
                searchAPI={(e) => Promise.resolve(getStatusSelect())}
                onChange={(e) => this.onInputChange({ target: { value: e.target.value.id } }, 'status_select')}
                edit={this.getStatus(orderForm.status_select).value === 'Canceled' ? false : this.state.edit}
                navigator={this.props.navigator}
              />
            } */}
            <RenderManyToOne
              name="client_partner"
              fieldLabel={getField("client_partner")}
              placeholder={getField("client_partner")}
              targetName="full_name"
              displayField="full_name"
              value={orderForm && (orderForm.client_partner || null)}
              searchAPI={e => {
                const { searchAll } = this.props.salecustomer;
                const { partner } = orderForm.company;

                if (e.search) {
                  return searchAll(e);
                } else {
                  const options = {};
                  options["search"] = {
                    fields: [
                      { fieldName: "id", value: partner.id, operator: "!=" },
                      { fieldName: "is_contact", value: false, operator: "=" },
                      {
                        fields: [
                          {
                            fieldName: "is_customer",
                            value: true,
                            operator: "="
                          },
                          {
                            fieldName: "is_prospect",
                            value: true,
                            operator: "="
                          }
                        ],
                        operator: "or"
                      }
                    ],
                    operator: "and"
                  };
                  return searchAll({ ...options });
                }
              }}
              onChange={e => this.onInputChange(e, "client_partner")}
              edit={
                this.getStatus(orderForm.status_select).value === "Draft"
                  ? this.state.edit
                  : this.state.isNew
                  ? this.state.edit
                  : false
              }
              navigator={this.props.navigator}
            />
            <RenderManyToOne
              name="contact_partner"
              fieldLabel={getField("contact_partner")}
              placeholder={getField("contact_partner")}
              targetName="full_name"
              displayField="full_name"
              value={orderForm && (orderForm.contact_partner || null)}
              searchAPI={e => {
                const { fetch } = this.props.salecustomer;
                const { client_partner } = orderForm;
                if (client_partner) {
                  return fetch(client_partner).then(res => {
                    const client_partner = res.data[0];
                    this.setState({
                      orderForm: {
                        ...this.state.orderForm,
                        client_partner
                      }
                    });
                    const ids = client_partner.contact_partner_set.map(
                      i => i.id
                    );
                    const { searchAll } = this.props.salecontact;
                    if (
                      orderForm.client_partner &&
                      orderForm.client_partner.id
                    ) {
                      if (e.search) {
                        return searchAll(e);
                      } else {
                        const options = {};
                        options["search"] = {
                          fields: [
                            { fieldName: "id", value: ids, operator: "IN" }
                          ]
                        };
                        return searchAll({ ...options });
                      }
                    } else {
                      return searchAll(e);
                    }
                  });
                } else {
                  if (e.search) {
                    const { searchAll } = this.props.salecontact;
                    return searchAll(e);
                  } else {
                    const { searchAll } = this.props.salecontact;
                    const options = {};
                    options["search"] = {
                      fields: [
                        { fieldName: "is_contact", value: true, operator: "=" }
                      ]
                    };
                    return searchAll({ ...options });
                  }
                }
              }}
              onChange={e => this.onInputChange(e, "contact_partner")}
              edit={this.state.edit}
              navigator={this.props.navigator}
            />
            <RenderManyToOne
              name="company"
              fieldLabel={getField("company")}
              placeholder={getField("company")}
              targetName="name"
              displayField="name"
              value={orderForm && (orderForm.company || null)}
              searchAPI={e => this.props.company.searchAll(e)}
              onChange={e => this.onInputChange(e, "company")}
              edit={
                this.getStatus(orderForm.status_select).value === "Draft"
                  ? this.state.edit
                  : false
              }
              navigator={this.props.navigator}
            />
            <RenderManyToOne
              name="currency"
              fieldLabel={getField("currency")}
              placeholder={getField("currency")}
              targetName="name"
              displayField="name"
              value={orderForm && (orderForm.currency || null)}
              searchAPI={e => this.props.currency.searchAll(e)}
              onChange={e => this.onInputChange(e, "currency")}
              edit={
                this.getStatus(orderForm.status_select).value === "Draft"
                  ? this.state.edit
                  : false
              }
              navigator={this.props.navigator}
            />
            {orderForm.main_invoicing_address_str &&
            orderForm.main_invoicing_address_str !== null ? (
              <CardView.CardField
                title={getField("main_invoicing_address_str")}
                value={orderForm.main_invoicing_address_str || ""}
              />
            ) : (
              ""
            )}
            {orderForm.delivery_address_str &&
            orderForm.delivery_address_str !== null ? (
              <CardView.CardField
                title={getField("delivery_address_str")}
                value={orderForm.delivery_address_str || ""}
              />
            ) : (
              ""
            )}
          </div>

          {this.props.app.mode === "online" && !this.state.isNew && (
            <CardView.ActionView>
              <CardView.ActionItem
                className="action-item-button"
                titleClassName="quotation-action-title"
                iconClassName="quotation-action-icon"
                icon="fa-eye"
                onClick={() => this.onViewPDF(orderForm)}
              >
                <Translate text="common.seeInPdf" />
              </CardView.ActionItem>
              <CardView.ActionItem
                className="action-item-button"
                titleClassName="quotation-action-title"
                iconClassName="quotation-action-icon"
                icon="fa-envelope"
                onClick={() => this.sendEmail(orderForm)}
              >
                <Translate text="common.sendByEmail" />
              </CardView.ActionItem>
            </CardView.ActionView>
          )}
        </CardView>
        <TabberView>
          <TabberView.Tab
            className="sale-item-tab order-line-tab"
            title={translate("common.sale.orderLine")}
            titleClassName="sale-tabbar-title"
            active={this.state.activeTab === 1}
            onClick={() => this.setState({ activeTab: 1 })}
          />
          <TabberView.Tab
            className="sale-item-tab order-line-tab"
            title={translate("common.sale.taxLines")}
            titleClassName="sale-tabbar-title"
            active={this.state.activeTab === 2}
            onClick={() => this.setState({ activeTab: 2 })}
          />
          <TabberView.Tab
            className="sale-item-tab order-line-tab"
            title={translate("common.sale.others")}
            titleClassName="sale-tabbar-title"
            active={this.state.activeTab === 3}
            onClick={() => this.setState({ activeTab: 3 })}
          />
          {isNew === false && (
            <TabberView.Tab
              className="sale-item-tab order-line-tab"
              title={`${translate("common.comments")}(${this.state.total})`}
              titleClassName="sale-tabbar-title"
              active={this.state.activeTab === 4}
              onClick={() => this.setState({ activeTab: 4 })}
            />
          )}
        </TabberView>
        {this.state.activeTab === 1 && (
          <div>
            {sale_order_line_list && sale_order_line_list.length > 0 && (
              <div className="product-header">
                <div style={{ width: "40%" }}>
                  {translate("common.sale.product")}
                </div>
                <div style={{ flex: 1 }} />
                <div
                  style={{
                    flex: 1,
                    textAlign: orderForm.status_select === 1 ? "left" : "right"
                  }}
                >
                  {this.state.edit === true && !this.state.isNew
                    ? translate("common.sale.total")
                    : ""}
                </div>
                <div style={{ flex: 1, textAlign: "right" }}>
                  {this.state.edit === false || this.state.isNew
                    ? translate("common.sale.total")
                    : ""}
                </div>
              </div>
            )}
            {this.state.edit === true ? (
              <div>
                <div>
                  {sale_order_line_list &&
                    sale_order_line_list.map((c, i) => (
                      <div
                        key={i}
                        className="sale-product-list"
                        style={{ paddingLeft: 21, marginTop: 10 }}
                        onClick={() =>
                          this.props.navigator.pushPage(
                            {
                              key: "sale_product",
                              component: ProductDetailsPage,
                              addProduct: product =>
                                this.onAddProduct(product, i),
                              data: [c],
                              order: orderForm,
                              mode: mode,
                              ViewPage: false
                            },
                            { animation: "none" }
                          )
                        }
                      >
                        <div className="product-view common-font-size">
                          <div className="order-data1">
                            {c.product_name || c.name || ""}
                          </div>
                          <div style={{ flex: 1 }} />
                          <div style={{ flex: 1 }}>
                            {getSepratedPrice(
                              parseFloat(c.ex_tax_total || "0.00").toFixed(2)
                            )}
                          </div>
                          {orderForm.status_select === 1 && (
                            <div
                              style={{ flex: 1, textAlign: "right" }}
                              onClick={e => {
                                e.stopPropagation();
                                this.onDeleteQuotation(c, i);
                              }}
                            >
                              <Icon
                                style={{ color: "red", paddingRight: 15 }}
                                icon="md-close"
                              />
                            </div>
                          )}
                        </div>
                        <div
                          style={{
                            marginRight: 8,
                            fontWeight: 100,
                            fontSize: "9pt"
                          }}
                        >
                          <span style={{ marginRight: 5 }}>
                            {parseInt(c.quantity, 10) || "0"}
                          </span>{" "}
                          X
                          <span style={{ marginLeft: 5 }}>
                            {getSepratedPrice(
                              parseFloat(c.price || c.rate || "0.00").toFixed(2)
                            )}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
                {this.state.isNew &&
                orderForm.client_partner !== null &&
                this.props.app.mode === "online" ? (
                  <div
                    style={{ marginTop: 10 }}
                    onClick={() =>
                      this.props.navigator.pushPage(
                        {
                          key: "new_sale_product",
                          component: ProductsList,
                          data: orderForm,
                          order: this.props.order,
                          mode: mode,
                          addProduct: product => this.onAddProduct(product)
                        },
                        { animation: "none" }
                      )
                    }
                    className="add-new-product-title"
                  >
                    <Translate text="common.addNewProduct" />
                    <Icon
                      style={{ color: "rgba(44, 196,211,1)" }}
                      icon="md-plus"
                    />
                  </div>
                ) : (
                  orderForm.status_select === 1 &&
                  orderForm.client_partner !== null &&
                  this.props.app.mode === "online" && (
                    <div
                      style={{ marginTop: 10 }}
                      onClick={() =>
                        this.props.navigator.pushPage(
                          {
                            key: "new_sale_product",
                            component: ProductsList,
                            data: orderForm,
                            order: this.props.order,
                            mode: mode,
                            addProduct: product => this.onAddProduct(product)
                          },
                          { animation: "none" }
                        )
                      }
                      className="add-new-product-title"
                    >
                      <Translate text="common.addNewProduct" />
                      <Icon
                        style={{ color: "rgba(44, 196,211,1)" }}
                        icon="md-plus"
                      />
                    </div>
                  )
                )}
              </div>
            ) : (
              <div>
                {sale_order_line_list && sale_order_line_list.length > 0 ? (
                  sale_order_line_list.map((c, i) => (
                    <div
                      key={i}
                      className="sale-product-list"
                      style={{ paddingLeft: 21, marginTop: 10 }}
                      onClick={() =>
                        mode === "online" &&
                        this.props.navigator.pushPage(
                          {
                            key: "sale_product",
                            component: ProductDetailsPage,
                            addProduct: product =>
                              this.onAddProduct(product, i),
                            data: [c],
                            mode: mode,
                            order: orderForm,
                            ViewPage: true
                          },
                          { animation: "none" }
                        )
                      }
                    >
                      <div className="product-view common-font-size">
                        <div className="order-data1">
                          {c.product_name || ""}
                        </div>
                        <div style={{ flex: 1 }} />
                        <div style={{ flex: 1 }} />
                        <div style={{ marginRight: 5 }}>
                          {getSepratedPrice(
                            parseFloat(c.ex_tax_total || "0.00").toFixed(2)
                          )}
                          <span>
                            {orderForm.currency !== null
                              ? orderForm.currency.symbol
                              : "€"}
                          </span>
                        </div>
                      </div>
                      <div
                        style={{
                          marginRight: 8,
                          fontWeight: 100,
                          fontSize: "9pt"
                        }}
                      >
                        <span style={{ marginRight: 5 }}>
                          {parseInt(c.quantity, 10) || "0"}
                        </span>{" "}
                        X
                        <span style={{ marginLeft: 5 }}>
                          {getSepratedPrice(
                            parseFloat(c.price || c.rate || "0.00").toFixed(2)
                          )}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <span className="notFoundItem">
                    {translate("common.sale.NoOrderLineFound")}
                  </span>
                )}
              </div>
            )}
            <div className="product-total">
              <div className="product-total-title common-font-weight">
                {translate("common.sale.totalWt")}
              </div>
              <div className="product-total-text common-font-size">
                {getSepratedPrice(
                  parseFloat(orderForm.ex_tax_total || 0.0).toFixed(2)
                )}
                <span>
                  {orderForm.currency !== null
                    ? orderForm.currency.symbol
                    : "€"}
                </span>
              </div>
            </div>
            <div className="product-total">
              <div className="product-total-title common-font-weight">
                {translate("common.sale.tax")}
              </div>
              <div className="product-total-text common-font-size">
                {getSepratedPrice(
                  parseFloat(orderForm.tax_total || 0.0).toFixed(2)
                )}
                <span>
                  {orderForm.currency !== null
                    ? orderForm.currency.symbol
                    : "€"}
                </span>
              </div>
            </div>
            <div className="product-total">
              <div className="product-total-title common-font-weight">
                {translate("common.sale.totalATI")}
              </div>
              <div className="product-total-text common-font-size">
                {getSepratedPrice(
                  parseFloat(orderForm.in_tax_total || 0.0).toFixed(2)
                )}
                <span>
                  {orderForm.currency !== null
                    ? orderForm.currency.symbol
                    : "€"}
                </span>
              </div>
            </div>
          </div>
        )}
        {this.state.activeTab === 2 ? (
          sale_order_line_list && sale_order_line_tax_list.length > 0 ? (
            <div>
              <div style={{ display: "flex", marginTop: 15, marginLeft: 15 }}>
                <div style={{ width: "40%", marginLeft: 4, color: "#D3D3D3" }}>
                  <Translate text="common.saleOrderLineField.tax" />
                </div>
                <div style={{ flex: 1, color: "#D3D3D3", marginLeft: 6 }}>
                  <Translate text="common.saleOrderLineField.baseWT" />
                </div>
                <div
                  style={{
                    flex: "1 1 2%",
                    color: "#D3D3D3",
                    marginLeft: "-3px"
                  }}
                >
                  <Translate text="common.saleOrderLineField.amountTax" />
                </div>
              </div>
              <div>
                {sale_order_line_tax_list &&
                  sale_order_line_tax_list.map((c, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        marginTop: 10,
                        paddingLeft: 21
                      }}
                      className="sale-product-list"
                    >
                      <div
                        className="order-data1 common-font-size"
                        style={{ marginRight: 11 }}
                      >
                        {c.taxLine ? c.taxLine.name : ""}
                      </div>
                      <div
                        style={{ flex: 1, textAlign: "left", fontSize: "9pt" }}
                      >
                        {getSepratedPrice(
                          parseFloat(c.exTaxBase || c.baseWT || "0.00").toFixed(
                            2
                          )
                        )}{" "}
                      </div>
                      <div
                        style={{ flex: 1, textAlign: "left", fontSize: "9pt" }}
                      >
                        {getSepratedPrice(
                          parseFloat(c.taxTotal || "0.00").toFixed(2)
                        )}{" "}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ) : isNew ? (
            ""
          ) : (
            <span className="notFoundItem">
              {translate("common.sale.NoTaxLineFound")}
            </span>
          )
        ) : (
          ""
        )}
        {this.state.activeTab === 3 && (
          <div>
            <CardView>
              <CardView.DateField
                edit={
                  this.getStatus(orderForm.status_select).value === "Draft"
                    ? this.state.edit
                    : false
                }
                title={getField("creation_date")}
                name="creation_date"
                onChange={e =>
                  this.onInputChange(e, "creation_date", () =>
                    this.calculateEndOfValidaty()
                  )
                }
                value={
                  orderForm.creation_date ||
                  moment(new Date()).format("YYYY-MM-DD")
                }
              />
              <CardView.DateField
                edit={
                  this.getStatus(orderForm.status_select).value === "Draft"
                    ? this.state.edit
                    : false
                }
                title={getField("delivery_date")}
                name="delivery_date"
                onChange={e => this.onInputChange(e, "delivery_date")}
                value={orderForm.delivery_date || ""}
              />
              <CardView.DateField
                edit={false}
                title={getField("end_of_validity_date")}
                name="end_of_validity_date"
                onChange={e => this.onInputChange(e, "end_of_validity_date")}
                value={orderForm.end_of_validity_date || ""}
              />
              <RenderManyToOne
                name="duration"
                fieldLabel={getField("duration")}
                placeholder={getField("duration")}
                targetName="name"
                displayField="name"
                value={orderForm && (orderForm.duration || null)}
                searchAPI={e => this.props.duration.searchAll(e)}
                onChange={e =>
                  this.onInputChange(e, "duration", () =>
                    this.calculateEndOfValidaty()
                  )
                }
                edit={
                  this.getStatus(orderForm.status_select).value === "Draft"
                    ? this.state.edit
                    : false
                }
                navigator={this.props.navigator}
              />
              <RenderManyToOne
                name="saleman_user"
                fieldLabel={getField("saleman_user")}
                placeholder={getField("saleman_user")}
                targetName="full_name"
                displayField="full_name"
                value={orderForm && (orderForm.saleman_user || null)}
                searchAPI={e => this.props.user.searchAll(e)}
                onChange={e => this.onInputChange(e, "saleman_user")}
                edit={
                  this.getStatus(orderForm.status_select).value === "Draft"
                    ? this.state.edit
                    : false
                }
                navigator={this.props.navigator}
              />
              <RenderManyToOne
                name="payment_condition"
                fieldLabel={getField("payment_condition")}
                placeholder={getField("payment_condition")}
                targetName="name"
                displayField="name"
                value={orderForm && (orderForm.payment_condition || null)}
                searchAPI={e => this.props.paymentcondition.searchAll(e)}
                onChange={e => this.onInputChange(e, "payment_condition")}
                edit={
                  this.getStatus(orderForm.status_select).value === "Draft"
                    ? this.state.edit
                    : false
                }
                navigator={this.props.navigator}
              />
              <RenderManyToOne
                name="payment_mode"
                fieldLabel={getField("payment_mode")}
                placeholder={getField("payment_mode")}
                targetName="name"
                displayField="name"
                value={orderForm && (orderForm.payment_mode || null)}
                searchAPI={e => this.props.paymentmode.searchAll(e)}
                onChange={e => this.onInputChange(e, "payment_mode")}
                edit={
                  this.getStatus(orderForm.status_select).value === "Draft"
                    ? this.state.edit
                    : false
                }
                navigator={this.props.navigator}
              />
            </CardView>
            <CardView>
              <CardView.TextArea
                edit={this.state.edit}
                title={getField("specific_notes")}
                name="specific_notes"
                onChange={e => this.onInputChange(e, "specific_notes")}
                value={orderForm.specific_notes || ""}
              />
              <CardView.TextArea
                edit={this.state.edit}
                title={getField("description")}
                name="description"
                onChange={e => this.onInputChange(e, "description")}
                value={orderForm.description || ""}
              />
              <CardView.TextArea
                edit={this.state.edit}
                title={getField("internal_note")}
                name="internal_note"
                onChange={e => this.onInputChange(e, "internal_note")}
                value={orderForm.internal_note || ""}
              />
            </CardView>
            <CardView title={translate("common.sale.margins")}>
              {orderForm.total_cost_price !== null ? (
                <CardView.CardField
                  title={getField("total_cost_price")}
                  value={
                    getSepratedPrice(
                      parseFloat(orderForm.total_cost_price || "0.00").toFixed(
                        2
                      )
                    ) +
                    `${orderForm.currency ? orderForm.currency.symbol : "€"}`
                  }
                />
              ) : (
                ""
              )}
              {orderForm.total_gross_margin !== null ? (
                <CardView.CardField
                  title={getField("total_gross_margin")}
                  value={
                    getSepratedPrice(
                      parseFloat(
                        orderForm.total_gross_margin || "0.00"
                      ).toFixed(2)
                    ) +
                    `${orderForm.currency ? orderForm.currency.symbol : "€"}`
                  }
                />
              ) : (
                ""
              )}
              {orderForm.margin_rate !== null ? (
                <CardView.CardField
                  title={getField("margin_rate")}
                  value={
                    parseFloat(orderForm.margin_rate || "0.00").toFixed(2) +
                    " €"
                  }
                />
              ) : (
                ""
              )}
            </CardView>
          </div>
        )}
        {this.state.activeTab === 4 && this.renderCommentList()}
        <Toast isOpen={this.state.downloadToast}>
          <div className="message">Opening a file, please wait...</div>
        </Toast>
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
    const { hookState, isLoading, orderForm } = this.state;
    let hookContent = null;
    if (hookState === "action") {
      hookContent = this.renderPullHookLoader();
    }
    return (
      <PullHook
        disabled={isLoading}
        onChange={e => this.setState({ hookState: e.state })}
        onLoad={done => {
          this.fetchNewData(orderForm);
          done();
        }}
        fixedContent={true}
      >
        {hookContent}
      </PullHook>
    );
  }
  render() {
    const { isLoading, recordList, isNew, orderForm } = this.state;
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
        {" "}
        {isNew ? (
          this.renderItem(orderForm)
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

ViewQuotation.propTypes = {
  navigator: PropTypes.any,
  route: PropTypes.any
};

const mapPropsToState = state => ({ app: state.app, user_data: state.user });

const mapConnectToProps = props => {
  const {
    refs: {
      user,
      currency,
      orderline,
      orderlinetax,
      company,
      salecustomer,
      salecontact,
      duration,
      paymentcondition,
      paymentmode,
      cancelreason
    },
    ...order
  } = props;

  return {
    order,
    user,
    currency,
    orderline,
    orderlinetax,
    company,
    salecustomer,
    salecontact,
    duration,
    paymentcondition,
    paymentmode,
    cancelreason,
    isOffline: order.app_state.mode === "offline"
  };
};

ViewQuotation = reduxConnect(mapPropsToState)(ViewQuotation);

const mapConnectConfig = {
  name: "SaleQuotation",
  refs: [
    {
      model: "User",
      field: "user"
    },
    {
      model: "Currency",
      field: "currency"
    },
    {
      model: "OrderLine",
      field: "sale_order_line_list"
    },
    {
      model: "SaleCustomer",
      field: "client_partner"
    },
    {
      model: "SaleContact",
      field: "contact_partner"
    },
    {
      model: "Duration",
      field: "duration"
    },
    {
      model: "PaymentCondition",
      field: "payment_condition"
    },
    {
      model: "PaymentMode",
      field: "payment_mode"
    },
    {
      model: "Company",
      field: "company"
    },
    {
      model: "OrderLineTax",
      field: "sale_order_line_tax_list"
    },
    {
      model: "CancelReason",
      field: "cancel_reason"
    }
  ]
};

export default connect(mapConnectToProps)(ViewQuotation, mapConnectConfig);
