import React from 'react';
import PropTypes from 'prop-types';
import { connect } from '@axelor/web-client';
import { connect as reduxConnect } from 'react-redux';
import ViewProduct from './view-product';
import ProductDetailsPage from './product-details';
import Translate,{translate} from '../../../locale';
import { Icon } from 'react-onsenui';
import PageListComponent, { Typo } from '../../page-list';
import { getSepratedPrice } from '../../common.func';

class ProductsList extends PageListComponent {
  constructor(props) {
    super(props, {}, {
      fetchRelatedFields: {},
    });
  }
  getAPI() {
    return this.props.product;
  }

  getSearchFields() {
    const fields = [];
    if (this.state.keyword) {
      fields.push({
        operator: 'or',
        fields: [{
          fieldName: "name",
          operator: "like",
          value: this.state.keyword
        }]
      });
    }
    const options = {};
    if (fields.length) {
      options['search'] = { fields: [{ fields, operator: 'and' }], operator: 'and' };
    }
    return options;
  }

  getFetchOptions(searchOptions = {}) {
    const { addProduct } = this.props.route;
    if (addProduct) {
      const { fields = [] } = searchOptions;
      fields.push({
        operator: 'and',
        fields: [
          { fieldName: 'sellable', operator: '=', value: 'true' },
          { fieldName: 'isModel', operator: '=', value: 'false' },
          { fieldName: 'expense', operator: '=', value: 'false' },
        ]
      })
      // fields.push({
      //   operator: 'or',
      //   fields: [{
      //     fieldName: "endDate",
      //     operator: "=",
      //     value: null
      //   }, {
      //     fieldName: "endDate",
      //     operator: ">",
      //     fieldType: 'date',
      //     value: new Date(),
      //   }]
      // })
      // if (this.state.keyword) {
      //   fields.push({
      //     operator: 'or',
      //     fields: [{
      //       fieldName: "name",
      //       operator: "like",
      //       value: this.state.keyword
      //     }]
      //   });
      // }
      let options = { ...searchOptions, search: { fields } }
      return options;
      // searchOptions['search'] = { fields: [...fields], operator: 'and' };
      // return searchOptions;
    }
    else {
      const fields = [];
      fields.push({ fieldName: 'isModel', operator: '=', value: 'false' },
        { fieldName: 'isShippingCostsProduct', operator: '=', value: 'false' },
        { fieldName: 'sellable', operator: '=', value: 'true' },
      )

      // if (this.state.keyword) {
      //   fields.push({
      //     operator: 'or',
      //     fields: [{
      //       fieldName: "name",
      //       operator: "like",
      //       value: this.state.keyword
      //     }]
      //   });
      // }
      const searchFields = this.getSearchFields();
      let options = { search: searchOptions };
      if (searchFields.search) {
        if (searchOptions.fields) {
          searchFields.search.fields.push(searchOptions);
        }
        options = searchFields;
      }
      return options;
      // searchOptions['search'] = { fields: [...fields], operator: 'and' };
      // return searchOptions;
      // let options = { ...searchOptions, search: { fields } }
      // return options;
    }
  }

  renderListSearch() {
    return super.renderListSearch({ placeholder: translate("common.search") });
  }

  addProduct(product) {
    let { data } = this.state;
    data.unshift(product)
    this.setState({ data });
  }

  onAddProduct(product) {
    this.props.navigator.pushPage({
      component: ViewProduct,
      path: `AddProduct_${product ? product.id : 0}`,
      data: { product },
      getRecordsByIndex: (product, isMount) => this.getRecordsByIndex(product, isMount),
      addProduct: (product) => this.addProduct(product),
      updateRecord: (record) => {
        const { data } = this.state;
        const targetIndex = data.findIndex(l => l.id === record.id);
        data[targetIndex] = record;
        this.setState({ data });
      },
      removeRecord: (record) => {
        const { data } = this.state;
        const targetIndex = data.findIndex(l => l.id === record.id);
        data.splice(targetIndex, 1);
        this.setState({ data });
      },
    }, { animation: 'none' });
  }

  onProduct(product) {
    const { addProduct, editProduct, data,mode } = this.props.route;
    if (addProduct) {
      this.props.navigator.replacePage({ product, component: ProductDetailsPage, addProduct, order: data,mode:mode }, { animation: 'none' })
    }
    else if (editProduct) {
      editProduct(product);
      this.props.navigator.popPage();
    }
    else {
      const { data } = this.state;
      const index = data.findIndex(d => d.row_id === product.row_id);
      this.props.navigator.pushPage({
        component: ViewProduct,
        path: `ViewProduct${product ? product.id : 0}`,
        data: { product },
        recordIndex: index,
        getRecordsByIndex: (product, isMount) => this.getRecordsByIndex(product, isMount),
        removeRecord: (record) => {
          const { data } = this.state;
          const targetIndex = data.findIndex(l => l.id === record.id);
          data.splice(targetIndex, 1);
          this.setState({ data });
        },
      }, { animation: 'none' });
    }
  }

  onListItemClick(item) {
    return this.onProduct(item);
  }

  renderRow(row, index) {
    return (
      <div className='list-row'>
        <div>
          <Typo variant="title"> {row.name} </Typo>
          <Typo variant="body"> {getSepratedPrice(parseFloat(row.sale_price).toFixed(2)) + ' €'} </Typo>
        </div>
        {
          this.props.app.mode === 'online' ?
            <div>
              {
                row.pictureURL &&
                <img src={row.pictureURL} style={{ width: 75, height: 75 }} alt="product img" />
              }
            </div>
            : ''
        }
      </div>
    )
  }

  renderPageTitle() {
    return (
      <React.Fragment>
        <div className='center center-align-title'>
          <Translate text="common.productsTitle" />
        </div>
        <div className='right icons list_add_button'>
          <div style={{ flex: 1 }} onClick={() => this.onAddProduct()}>
            <div style={{ color: "rgba(44, 196,211,1)", margin: '0px auto' }} className="round-icon">
              <Icon icon='md-plus' />
            </div>
          </div>
        </div>
      </React.Fragment>
    )
  }
}

ProductsList.propTypes = {
  navigator: PropTypes.any,
  route: PropTypes.any,
};
const mapPropsToState = (state) => ({ app: state.app, user_data: state.user });

const mapConnectToProps = (props) => {
  const { refs: { orderline }, ...product } = props;
  return { product, orderline };
}
ProductsList = reduxConnect(mapPropsToState)(ProductsList);
const mapConnectConfig = {
  name: 'Product',
  refs: [{
    model: 'OrderLine', field: 'sale_order_line_list'
  },],
};

export default connect(mapConnectToProps)(ProductsList, mapConnectConfig);
