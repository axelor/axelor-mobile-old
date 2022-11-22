import React from "react";
import PropTypes from "prop-types";
import { connect } from "@axelor/web-client";
import { connect as reduxConnect } from "react-redux";
import Page, { PageElement } from "../../page";
import { openCamera, URLToBlob } from "./../../../cordova";
import {
  AlertDialog,
  Toolbar,
  ToolbarButton,
  Icon,
  ProgressCircular,
  Select,
  Modal,
  PullHook
} from "react-onsenui";
import Translate, { translate } from "../../../locale";
import {
  CardView,
  SwiperView,
  TabberView,
  CheckBoxInput
} from "../../../components";
import { getSepratedPrice } from "../../common.func";
import PageCommentList, { RenderManyToOne } from "../../page-comment-list";
import ons from "onsenui";
import "./view.css";

const getProductType = () => ({
  data: [
    { id: "service", value: "Service" },
    { id: "storable", value: "Product" }
  ],
  total: 2
});

class ViewProduct extends PageCommentList {
  constructor(props) {
    super(props);
    this.state = {
      product: {
        product_type_select: "service",
        sellable: true
      },
      fields: [],
      recordList: [],
      hookState: "initial",
      edit: false,
      isNew: false,
      activeTab: 1,
      activeTab2: 3,
      commentMessage: "",
      all: [],
      total: 0,
      limit: 4,
      offset: 0,
      activeIndex: 0,
      submitError: {
        title: null,
        content: null
      },
      showErrorDialog: false
    };
  }

  componentDidMount() {
    const { route } = this.props;
    const { data, getRecordsByIndex } = route;
    const { product } = data;
    if (product && product.id !== undefined) {
      if (getRecordsByIndex) {
        const records = getRecordsByIndex(product, true);
        const targetIndex = records.findIndex(r => r.id === product.id);
        this.swiper.slideTo(targetIndex, 0, true);
        this.setState({ recordList: [...records], activeIndex: targetIndex });
        this.fetchNewData(product);
      }
    } else {
      this.setState({
        isNew: true,
        edit: true
      });
    }
  }

  fetchNewData(data) {
    const { fetch, fields } = this.props.product;
    const { limit, offset } = this.state;
    this.setState({ isLoading: true }, () => {
      setTimeout(() => {
        fetch(data).then(res => {
          const { data } = res;
          if (data && data.length > 0) {
            const product = Object.assign({}, data[0]);
            product.sale_price = parseFloat(product.sale_price).toFixed(2);
            const { recordList } = this.state;
            const targetIndex = recordList.findIndex(r => r.id === product.id);
            recordList[targetIndex] = Object.assign({}, product);

            this.setState(
              { product, fields, recordList, isLoading: false },
              () => {
                this.getAllComment(limit, offset);
              }
            );
          }
        });
      }, 300);
    });
  }

  closeEdit(close) {
    const { recordList, product } = this.state;
    return new Promise((resolve, reject) => {
      const targetIndex = recordList.findIndex(
        record => record.id === product.id
      );
      this.isRecordChanged(close).then(ok => {
        if (ok) {
          recordList[targetIndex] = product;
          this.setState({ edit: false, product, recordList });
          resolve(true);
        }
      });
    });
  }

  getApi() {
    return this.props.product;
  }

  getCurrentRecord() {
    return this.state.product;
  }

  productTypeSelect(value) {
    const { data } = getProductType();
    return data.find(item => item.id === value);
  }

  changeField(name, value) {
    const { product, recordList, isNew } = this.state;
    if (isNew) {
      this.setState({
        product: {
          ...product,
          [name]: value
        }
      });
    } else {
      const targetIndex = recordList.findIndex(r => r.id === product.id);
      const record = { ...recordList[targetIndex] };
      record[name] = value;
      recordList[targetIndex] = { ...record };
      this.setState({ recordList });
    }
  }

  addPro(product) {
    let { add, fetch } = this.props.product;
    const { addProduct, updateRecord } = this.props.route;
    this.setState({ isLoading: true });
    add(product).then(result => {
      if (result.status === -1) {
        ons.notification.alert(result.error.message, {
          id: "product-error"
        });
        this.setState({ isLoading: false });
      } else {
        let { data } = result;
        if (addProduct) {
          addProduct(data[0]);
        }
        if (updateRecord) {
          updateRecord(data[0]);
        }

        fetch(data[0]).then(res => {
          this.setState(
            {
              product: res.data[0],
              isNew: false,
              edit: false,
              isLoading: false
            },
            () => {
              this.onRecordSwipe(res.data[0]);
            }
          );
        });
      }
    });
  }

  onUpdate(record) {
    const { update } = this.props.product;
    this.setState({ isLoading: true });
    update(record).then(res => {
      if (res.status === -1) {
        ons.notification.alert(res.error.message, {
          id: "product-error"
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
          this.setState({ edit: false, isLoading: false });
          this.fetchNewData(newRecord);
        }
      }
    });
  }

  validateData() {
    let isValid = true;
    const { product } = this.state;
    if (!product.product_type_select) {
      isValid = false;
      this.setState({
        submitError: {
          title: "Save Error",
          content: "Product Type field required!!!"
        }
      });
      return isValid;
    }
    if (!product.name) {
      isValid = false;
      this.setState({
        submitError: { title: "Save Error", content: "Name field required!!!" }
      });
      return isValid;
    }
    if (!product.code) {
      isValid = false;
      this.setState({
        submitError: { title: "Save Error", content: "Code field required!!!" }
      });
      return isValid;
    }
    return isValid;
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

  onRemoveImage(e) {
    e.stopPropagation();
    const { product, recordList } = this.state;
    const record = recordList.find(r => r.id === product.id);
    record.picture = null;
    record.pictureURL = null;
    this.changeField("picture", null);
    this.changeField("pictureURL", null);
  }

  onSave() {
    if (!this.validateData()) {
      this.setState({ showErrorDialog: true });
      return;
    }
    const { product, recordList } = this.state;
    const record = recordList.find(r => r.row_id === product.row_id);

    if (record && record.id !== undefined) {
      let { uploadFile } = this.props.product;

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
      let { uploadFile } = this.props.product;
      this.getBlobAndHeader(product.pictureURL).then(({ blob, headers }) => {
        if (blob && headers) {
          uploadFile(blob, headers).then(res => {
            let { product } = this.state;
            product.picture = { ...res.result };
            product.pictureURL = res.url;
            this.setState({ product: { ...product } });
            this.addPro(product);
          });
        } else {
          this.addPro(product);
        }
      });
    }
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
        let product = this.state.product;
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const base64data = reader.result;
          product.pictureURL = base64data;
          this.setState({ blob, headers, product });
        };
      } else {
        const original = this.state.product;
        const targetIndex = recordList.findIndex(r => r.id === original.id);
        let product = { ...recordList[targetIndex] };
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const base64data = reader.result;
          product.pictureURL = base64data;
          recordList[targetIndex] = { ...product };
          this.setState({ blob, headers, recordList });
        };
      }
    }
  }

  removeProduct(record) {
    const { remove } = this.props.product;
    ons.notification
      .confirm(translate("Alert.confirmDelete"), {
        title: translate("Alert.confirm"),
        id: "remove-product",
        buttonLabels: [
          translate("Alert.cancelButton"),
          translate("Alert.yesButton")
        ]
      })
      .then(res => {
        if (res === 1) {
          remove(record).then(res => {
            if (res.status !== 0) {
              ons.notification.alert(res.error.title, {
                id: "sales-product-error"
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

  isRecordChanged(close) {
    return new Promise((resolve, reject) => {
      const { recordList, product } = this.state;
      const targetIndex = recordList.findIndex(
        record => record.id === product.id
      );
      if (
        JSON.stringify(recordList[targetIndex]) !== JSON.stringify(product) &&
        close
      ) {
        ons.notification
          .confirm(translate("Alert.confirmClose"), {
            title: translate("Alert.confirm"),
            id: "sales-product",
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
    const { product: productForm, recordList, loading, isNew } = this.state;
    const product = recordList.find(r => r.row_id === productForm.row_id) || {};

    return (
      <Toolbar noshadow modifier="transparent" style={{ background: "#fff" }}>
        <div className="left left-icon-width">
          <ToolbarButton
            onClick={() => this.onBack()}
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
            onClick={() => this.onBack()}
            style={{ display: "inline-block" }}
          >
            {!loading
              ? product.id !== undefined
                ? product.name
                : translate("Product.addProduct")
              : ""}
          </span>
        </div>
        <div
          key="1"
          className="right right-icons"
          style={{ color: "#717171", justifyContent: "flex-end" }}
        >
          <PageElement key="delete" offline={!product.id}>
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
                onClick={() => this.removeProduct(product)}
              >
                <Icon icon="fa-trash" />
              </div>
            )}
          </PageElement>
          <PageElement key="edit" offline={!product.id}>
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

  openFileGallary() {
    openCamera().then(res => {
      if (res.status === 1) {
        const pictureURL = res.image;
        const { isNew, product } = this.state;
        if (isNew) {
          product.pictureURL = pictureURL;
        } else {
          const { recordList } = this.state;
          const targetIndex = recordList.findIndex(r => r.id === product.id);
          recordList[targetIndex] = { ...recordList[targetIndex], pictureURL };
          this.setState({ recordList });
        }
        this.setState({ product });
      }
    });
  }

  renderItem(product) {
    const { fields } = this.props.product;
    if (!fields.length) return null;
    const getField = key => {
      const field = fields.find(f => f.name === key);
      return field.label ? translate(field.label) : "";
    };

    return (
      <div>
        <CardView principalView>
          {this.renderAlertBox()}
          <div
            style={{
              padding:
                this.props.app.mode === "online"
                  ? "30px 0px 10px 0"
                  : "10px 0px 10px 0"
            }}
          >
            {this.props.app.mode === "online" ? (
              <div className="customer-info">
                {this.state.edit ? (
                  <div className="picture-container">
                    <div
                      style={{ textAlign: "center" }}
                      onClick={() => this.openFileGallary()}
                    >
                      {product.pictureURL ? (
                        <div>
                          <img
                            src={product.pictureURL}
                            style={{ height: "80%", width: "80%" }}
                            alt="No images"
                          />
                          <div
                            onClick={e => this.onRemoveImage(e)}
                            className="remove-picture-icon-container"
                          >
                            <Icon
                              icon="close"
                              className="remove-picture-icon"
                            />
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
                            {translate("common.uploadPicture")}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  product.pictureURL && (
                    <img
                      src={product.pictureURL}
                      style={{ width: "80%", height: "80%" }}
                      alt="product img"
                    />
                  )
                )}
              </div>
            ) : (
              ""
            )}
            {!this.state.edit ? (
              <div style={{ textAlign: "center" }}>
                <p className="product-info-detail-title">
                  {product ? product.name : ""}
                </p>
                <p className="product-info-detail">
                  {product ? product.code : ""}
                </p>
                <p className="product-info-detail">
                  {getSepratedPrice(
                    parseFloat(product.sale_price || "").toFixed(2)
                  )}{" "}
                  €
                </p>
              </div>
            ) : (
              <div style={{ padding: "10px 10px 0px 15px" }}>
                <CardView.InputField
                  edit={this.state.edit}
                  title={getField("code")}
                  onChange={e => this.changeField("code", e.target.value)}
                  value={product && product.code}
                />
                <CardView.InputField
                  edit={this.state.edit}
                  title={getField("name")}
                  onChange={e => this.changeField("name", e.target.value)}
                  value={product && product.name}
                />
                <CardView.Number
                  title={<Translate text="Product.salePrice" />}
                  onChange={e => this.changeField("sale_price", e.target.value)}
                  value={product.sale_price || ""}
                  edit={this.state.edit}
                />
                <div>
                  <CheckBoxInput
                    name="sellable"
                    value={product.sellable}
                    onValueChange={value => this.changeField("sellable", value)}
                    title={getField("sellable")}
                  />
                </div>
              </div>
            )}
          </div>
        </CardView>
        <TabberView>
          <TabberView.Tab
            title={<Translate text="event_details" />}
            active={this.state.activeTab2 === 3}
            activeColor="#2187d4"
            onClick={() => this.setState({ activeTab2: 3 })}
          ></TabberView.Tab>
        </TabberView>
        <CardView className="product-info">
          {this.state.edit ? (
            <CardView.FieldWrapper
              fieldLabel={getField("product_type_select")}
              edit={this.state.edit}
            >
              <Select
                className="status-select-input"
                value={`${
                  this.productTypeSelect(product.product_type_select).id
                }`}
                onChange={e =>
                  this.changeField("product_type_select", e.target.value)
                }
              >
                {getProductType().data.map((s, i) => (
                  <option key={i} value={s.id}>
                    {s.value}
                  </option>
                ))}
              </Select>
            </CardView.FieldWrapper>
          ) : (
            <CardView.CardField
              title={getField("product_type_select")}
              value={`${
                this.productTypeSelect(product.product_type_select).value
              }`}
            />
          )}

          {/* <RenderManyToOne
            name="product_type_select"
            fieldLabel={getField('product_type_select')}
            placeholder={getField('product_type_select')}
            targetName="value"
            displayField="value"
            value={this.getProduct(product.product_type_select)}
            liveSearch={false}
            searchAPI={(e) => Promise.resolve(getProductType())}
            onChange={(e) => this.changeField('product_type_select', e.target.value.id)}
            edit={this.state.edit}
            navigator={this.props.navigator}
          /> */}
          <RenderManyToOne
            name="unit"
            fieldLabel={getField("unit")}
            placeholder={getField("unit")}
            targetName="name"
            displayField="name"
            value={product && product.unit}
            liveSearch={false}
            searchAPI={e => this.props.unit.search(e)}
            onChange={e => this.changeField("unit", e.target.value)}
            edit={this.state.edit}
            navigator={this.props.navigator}
          />
          <RenderManyToOne
            name="product_family"
            fieldLabel={getField("product_family")}
            placeholder={getField("product_family")}
            targetName="name"
            displayField="name"
            value={product && (product.product_family || null)}
            liveSearch={false}
            searchAPI={e => this.props.productfamily.search(e)}
            onChange={e => this.changeField("product_family", e.target.value)}
            edit={this.state.edit}
            navigator={this.props.navigator}
          />
          <RenderManyToOne
            name="product_category"
            fieldLabel={getField("product_category")}
            placeholder={getField("product_category")}
            targetName="name"
            displayField="name"
            value={product && (product.product_category || null)}
            liveSearch={false}
            searchAPI={e => this.props.productcategory.search(e)}
            onChange={e => this.changeField("product_category", e.target.value)}
            edit={this.state.edit}
            navigator={this.props.navigator}
          />
        </CardView>

        <TabberView>
          <TabberView.Tab
            title={getField("description")}
            active={this.state.activeTab === 1}
            activeColor="#E2AA46"
            onClick={() => this.setState({ activeTab: 1 })}
          ></TabberView.Tab>
          <TabberView.Tab
            title={getField("internal_description")}
            active={this.state.activeTab === 2}
            activeColor="#E2AA46"
            onClick={() => this.setState({ activeTab: 2 })}
          ></TabberView.Tab>
          {this.state.isNew === false && (
            <TabberView.Tab
              title={`${translate("common.comments")}(${this.state.total})`}
              active={this.state.activeTab === 3}
              activeColor="#E2AA46"
              onClick={() => this.setState({ activeTab: 3 })}
            ></TabberView.Tab>
          )}
        </TabberView>
        {this.state.activeTab === 1 ? (
          <CardView className="product-info product-description">
            <CardView.TextArea
              edit={this.state.edit}
              title={getField("description")}
              onChange={e => this.changeField("description", e.target.value)}
              value={product && product.description}
            />
          </CardView>
        ) : (
          ""
        )}
        {this.state.activeTab === 2 ? (
          <CardView className="product-info product-description">
            <CardView.TextArea
              edit={this.state.edit}
              title={getField("internal_description")}
              onChange={e =>
                this.changeField("internal_description", e.target.value)
              }
              value={product && product.internal_description}
            />
          </CardView>
        ) : (
          ""
        )}
        {this.state.activeTab === 3 ? this.renderCommentList() : ""}
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
    const { hookState, isLoading, product } = this.state;
    let hookContent = null;
    if (hookState === "action") {
      hookContent = this.renderPullHookLoader();
    }
    return (
      <PullHook
        disabled={isLoading}
        onChange={e => this.setState({ hookState: e.state })}
        onLoad={done => {
          this.fetchNewData(product);
          done();
        }}
        fixedContent={true}
      >
        {hookContent}
      </PullHook>
    );
  }
  render() {
    const { isLoading, recordList, isNew, product } = this.state;
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
          this.renderItem(product)
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

ViewProduct.propTypes = {
  navigator: PropTypes.any,
  route: PropTypes.any
};
const mapPropsToState = state => ({ app: state.app, user_data: state.user });

const mapConnectToProps = props => {
  const {
    refs: { productfamily, productcategory, unit },
    ...product
  } = props;
  return { product, productfamily, productcategory, unit };
};
ViewProduct = reduxConnect(mapPropsToState)(ViewProduct);
const mapConnectConfig = {
  name: "Product",
  refs: [
    {
      model: "ProductFamily",
      field: "product_family"
    },
    {
      model: "ProductCategory",
      field: "product_category"
    },
    {
      model: "Unit",
      field: "unit"
    }
  ]
};

export default connect(mapConnectToProps)(ViewProduct, mapConnectConfig);
