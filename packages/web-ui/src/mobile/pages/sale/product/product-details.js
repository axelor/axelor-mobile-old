import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "@axelor/web-client";
import { PageElement } from "../../page";

import { Toolbar, Page, ToolbarButton, Icon } from "react-onsenui";
import { StaticSelect } from "../../../components";
import Translate, { translate } from "../../../locale";
import ProductsList from "./list-products";
import { getSepratedPrice } from "../../common.func";
import { CardView } from "../../../components";

const RenderUnit = props => {
  const { product, fieldLabel } = props;
  return (
    <CardView.ManyToOne
      {...props}
      style={{ width: "100%" }}
      name="unit"
      className="inline select-control"
      title={fieldLabel}
      placeholder="unit"
      targetName="name"
      value={product && (product || null)}
      searchAPI={e => props.unit.search(e)}
      renderItem={(obj, i) => (
        <div
          style={{ width: "100%", display: "flex", flexDirection: "column" }}
        >
          <div
            style={{ padding: 0 }}
            className="field-input list-item list--inset__item list-item--chevron list-item--tappable"
          >
            <div key={i} className="many-to-one">
              {obj ? obj.name : ""}
            </div>
          </div>
        </div>
      )}
      onChange={e => props.onChange(e)}
    />
  );
};

const RenderTax = props => {
  const { product, fieldLabel } = props;
  return (
    <CardView.ManyToOne
      {...props}
      style={{ width: "100%" }}
      name="tax"
      className="inline select-control"
      title={fieldLabel}
      placeholder={translate("common.tax")}
      targetName="name"
      value={product && (product || null)}
      searchAPI={e => props.taxline.search(e)}
      renderItem={(obj, i) => (
        <div
          style={{ width: "100%", display: "flex", flexDirection: "column" }}
        >
          <div
            style={{ padding: 0 }}
            className="field-input list-item list--inset__item list-item--chevron list-item--tappable"
          >
            <div key={i} className="many-to-one">
              {obj ? obj.name : ""}
            </div>
          </div>
        </div>
      )}
      onChange={e => props.onChange(e)}
    />
  );
};

class ProductDetailsPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      quantity: 1,
      rate: 0.0,
      product_name: "",
      product: {},
      discount_amount: 0.0,
      discount_type_select: "3",
      tax: null,
      oldExtotal: 0,
      oldIxtotal: 0,
      edit: false
    };
  }

  onAction() {
    const { action } = this.props.orderline;

    const { product, tax } = this.state;
    const { order } = this.props.route;
    const data = {
      context: {
        product,
        _parent: {
          clientPartner: {
            id: order.client_partner.id
          },
          company: {
            id: order.company.id
          },
          _model: "com.axelor.apps.sale.db.SaleOrder"
        }
      }
    };

    action("action-group-sale-saleorderline-product-onchange", data).then(
      res => {
        const { values } = res.data[0];

        this.setState({
          tax: values.tax
        });
      }
    );
  }
  componentDidMount() {
    if (this.props.route.data) {
      const { data, order, mode, ViewPage } = this.props.route;
      const { status_select } = order;
      let {
        rate,
        product_name,
        quantity,
        discount_amount,
        tax,
        unit,
        discount_type_select,
        product,
        ex_tax_total,
        in_tax_total
      } = data[0];
      rate = parseFloat(rate || "").toFixed(2);
      this.setState(
        {
          edit:
            typeof ViewPage !== undefined && ViewPage === true
              ? false
              : Number(status_select) === 1
              ? true
              : mode === "offline" &&
                (Number(status_select) === 3 || Number(status_select) === 4)
              ? true
              : false,
          rate,
          product_name,
          quantity,
          discount_amount,
          tax,
          unit,
          discount_type_select,
          oldExtotal: ex_tax_total,
          oldIxtotal: in_tax_total,
          product
        },
        () => {
          // this.onAction();
        }
      );
    } else if (this.props.route.product) {
      const { product, order, mode } = this.props.route;
      const { status_select } = order;
      product.sale_price = parseFloat(product.sale_price || "").toFixed(2);
      this.setState(
        {
          edit:
            Number(status_select) === 1
              ? true
              : mode === "offline" &&
                (Number(status_select) === 3 || Number(status_select) === 4)
              ? true
              : false,
          product_name: product.name,
          rate: product.sale_price,
          quantity: 1,
          unit: product.unit,
          product: { id: product.id }
        },
        () => {
          this.onAction(this.props);
        }
      );
    }
  }

  onManyToOneChange(e) {
    const { name, value } = e.target;
    this.setState({ [name]: value });
  }

  onInputChange(name, value) {
    this.setState({ [name]: value });
  }

  countSubtotal() {
    let { rate, quantity } = this.state;
    let subTotal = parseFloat(rate) * parseFloat(quantity);
    return isNaN(subTotal) ? 0.0 : subTotal;
  }

  countTotalWt() {
    const { discount_amount = 0, discount_type_select = 3 } = this.state;
    let subTotal = this.countSubtotal();
    let totalWT =
      parseInt(discount_type_select, 10) === 1
        ? subTotal - (subTotal * parseFloat(discount_amount)) / 100
        : subTotal <= 0
        ? 0
        : subTotal - parseFloat(discount_amount);
    return isNaN(totalWT) ? 0.0 : totalWT;
  }

  countTotalATI() {
    const { tax } = this.state;
    const taxRate = !!tax
      ? tax.name.substring(
          tax.name && tax.name.indexOf(":") + 1,
          tax.name.lastIndexOf(":")
        )
      : "0";
    let totalWT = this.countTotalWt();
    return totalWT * taxRate + totalWT;
  }

  onSave() {
    const { tax } = this.state;
    let tax_rate = !!tax
      ? tax.name.substring(
          tax.name && tax.name.indexOf(":") + 1,
          tax.name.lastIndexOf(":")
        )
      : "0";
    let amountTax = tax_rate * this.countTotalWt();
    const ex_tax_total = this.countTotalWt();
    const in_tax_total = this.countTotalATI();
    const discount_price = this.countTotalWt();
    this.props.route.addProduct({
      ...this.state,
      in_tax_total,
      ex_tax_total,
      tax_rate,
      discount_price,
      amount_tax: amountTax
    });
    this.props.navigator.popPage();
  }

  renderToolbar() {
    const { product_name } = this.state;
    return (
      <Toolbar noshadow modifier="transparent" style={{ background: "#fff" }}>
        <div className="left left-icon-width">
          <ToolbarButton
            onClick={() => this.props.navigator.popPage()}
            style={{ color: "gray" }}
          >
            <Icon icon="chevron-left" />
          </ToolbarButton>
        </div>
        <div
          className="center  ellipse-toolbar left-align-title"
          style={{ color: "#000" }}
        >
          <span style={{ display: "inline-block" }}>
            {product_name || "Product"}
          </span>
        </div>
        <div className="right icons">
          <PageElement key="save">
            <div
              style={{ padding: "5px 15px 5px 0px" }}
              onClick={() => this.onSave()}
            >
              <div
                style={{ color: "rgba(44, 196,211,1)", marginRight: 10 }}
                className="round-icon"
              >
                <Icon icon="fa-save" />
              </div>
            </div>
          </PageElement>
        </div>
        {/* <div className='right icons' style={{ color: '#717171', paddingRight: 10 }}>
          <PageElement key="save" >
            <div key="save" style={{ color: "rgba(44, 196,211,1)", marginRight: 10 }} onClick={() => this.onSave()} className="round-icon">
              <Icon icon='fa-save' />
            </div>
          </PageElement>
        </div> */}
      </Toolbar>
    );
  }

  onAddNewProduct(product) {
    product.sale_price = parseFloat(product.sale_price || "").toFixed(2);
    this.setState(
      {
        rate: product.sale_price,
        product_name: product.name,
        unit: product.unit,
        product: { id: product.id }
      },
      () => {
        this.onAction();
      }
    );
  }

  render() {
    const {
      quantity,
      rate,
      tax,
      unit,
      discount_amount,
      discount_type_select
    } = this.state;

    const { status_select } =
      this.props.route.order || this.props.route.orderForm;
    const { mode, ViewPage } = this.props.route;
    return (
      <Page renderToolbar={() => this.renderToolbar()} className="app-page">
        <div>
          <CardView>
            <div
              style={{
                width: "100%",
                display: "flex",
                flexDirection: "column"
              }}
            >
              <div style={{ color: "#D3D3D3", marginTop: 10 }}>
                {translate("common.sale.product")}
              </div>
              <div
                style={{
                  padding: 0,
                  pointerEvents: status_select === 1 ? "initial" : "none"
                }}
                className="field-input list-item list--inset__item list-item--chevron list-item--tappable"
              >
                <div
                  className="many-to-one"
                  style={{ marginTop: 5 }}
                  onClick={() =>
                    status_select === 1 &&
                    ViewPage !== true &&
                    this.props.navigator.pushPage(
                      {
                        key: "add_product",
                        component: ProductsList,
                        editProduct: product => this.onAddNewProduct(product)
                      },
                      { animation: "none" }
                    )
                  }
                >
                  {this.state.product_name ||
                    translate("common.sale.selectProduct")}
                </div>
              </div>
            </div>
            <CardView.Number
              title={translate("common.product.Rate")}
              onChange={e => this.onInputChange("rate", e.target.value)}
              value={rate || ""}
              edit={this.state.edit}
            />

            <CardView.QuantityField
              title={translate("common.product.Quantity")}
              value={quantity || 0}
              edit={this.state.edit}
              onChange={e => this.onInputChange("quantity", e.target.value)}
            />

            <RenderUnit
              product={unit}
              fieldLabel={translate("common.unit")}
              displayField="name"
              onChange={e => this.onManyToOneChange(e)}
              edit={this.state.edit}
              navigator={this.props.navigator}
              unit={this.props.unit}
            />
            <RenderTax
              product={tax}
              fieldLabel={translate("common.tax")}
              displayField="name"
              onChange={e => this.onManyToOneChange(e)}
              edit={this.state.edit}
              navigator={this.props.navigator}
              taxline={this.props.taxline}
            />
            <CardView.CardField
              title={translate("common.product.TotalWT")}
              value={
                getSepratedPrice(parseFloat(this.countTotalWt()).toFixed(2)) +
                " €"
              }
            />
            <CardView.CardField
              title={translate("common.product.TotalATI")}
              value={
                getSepratedPrice(parseFloat(this.countTotalATI()).toFixed(2)) +
                " €"
              }
            />
          </CardView>
          <CardView>
            <div className="partner-type-selection">
              <span className="field-title" style={{ marginTop: 10 }}>
                <Translate text="common.discountType" />
              </span>
              <StaticSelect
                optionList={[
                  { text: "%", value: "1" },
                  { text: translate("common.fixed"), value: "2" },
                  { text: translate("common.noDiscount"), value: "3" }
                ]}
                name="discount_type_select"
                disabled={
                  Number(status_select) === 1 && ViewPage !== true
                    ? false
                    : mode === "offline" &&
                      (Number(status_select) === 3 ||
                        Number(status_select) === 4)
                    ? false
                    : true
                }
                value={discount_type_select}
                placeholder={<Translate text="common.discountType" />}
                onValueChange={value => {
                  this.onInputChange("discount_type_select", value);
                }}
                selectStyle={{ fontSize: 12, fontWeight: 600, marginLeft: 0 }}
              />
            </div>
            {(discount_type_select === "1" ||
              discount_type_select === 1 ||
              discount_type_select === "2" ||
              discount_type_select === 2) && (
              <CardView.Number
                edit={this.state.edit}
                title={translate("common.product.DiscountRate")}
                name="discount_amount"
                onChange={e =>
                  this.onInputChange("discount_amount", e.target.value)
                }
                value={discount_amount || "0"}
              />
            )}

            {(discount_type_select === "1" ||
              discount_type_select === 1 ||
              discount_type_select === "2" ||
              discount_type_select === 2) &&
              discount_amount > 0 && (
                <CardView.CardField
                  title={translate("OrderLine.priceDiscounted")}
                  value={getSepratedPrice(this.countTotalATI())}
                />
              )}
          </CardView>
        </div>
      </Page>
    );
  }
}

ProductDetailsPage.propTypes = {
  navigator: PropTypes.any,
  route: PropTypes.any
};

const mapConnectToProps = props => {
  const {
    refs: { unit, taxline, product },
    ...orderline
  } = props;
  return { unit, orderline, taxline, product };
};

const mapConnectConfig = {
  name: "OrderLine",
  refs: [
    {
      model: "Unit",
      field: "unit"
    },
    {
      model: "TaxLine",
      field: "tax"
    },
    {
      model: "Product",
      field: "product"
    }
  ]
};

export default connect(mapConnectToProps)(ProductDetailsPage, mapConnectConfig);
