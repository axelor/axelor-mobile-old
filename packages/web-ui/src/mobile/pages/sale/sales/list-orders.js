import React from 'react';
import PropTypes from 'prop-types';
import { connect as reduxConnect } from 'react-redux';
import connect from '../connect/sale-order';
import Translate, { translate } from '../../../locale';
import ViewOrder from './ViewOrder';
import PageListComponent, { Typo } from '../../page-list';
import { Icon } from 'react-onsenui';
import { getSepratedPrice } from '../../common.func';

const statusSelect = {
  1: <Translate text='common.status.Draft' />,
  2: <Translate text='common.status.Finalize' />,
  3: <Translate text='common.status.orderConfirmed' />
}

class OrdersList extends PageListComponent {
  constructor(props) {
    super(props, {}, {
      fetchRelatedFields: {
        saleOrderLineList: ['fullName', 'price', 'unit', 'productName', 'priceDiscounted', 'qty', 'inTaxTotal', 'exTaxTotal', 'taxLine'],
        saleOrderLineTaxList: ['taxLine', 'exTaxBase', 'taxTotal'],
        company:['id','partner','name'],
        currency:['id','currency','code','symbol']
      },
    });
  }

  getAPI() {
    return this.props.order;
  }

  getFetchOptions(searchOptions) {
    const { keyword } = this.state;
    return super.getFetchOptions(searchOptions, {
      fields: [
        { fieldName: 'clientPartner.fullName', operator: 'like', value: this.state.keyword },
        { fieldName: 'ex_tax_total', operator: '=', value: keyword },
        { fieldName: 'in_tax_total', operator: '=', value: keyword },
      ],
    });
  }

  renderListSearch() {
    return super.renderListSearch({ placeholder: translate('common.searchByOrder') });
  }

  updateOrder(order) {
    let { data } = this.state;
    if (Number(order.status_select) !== 3) {
      let index = data.findIndex(c => c.id.toString() === order.id.toString());
      data.splice(index, 1);
    } else {
      let index = data.findIndex(c => c.id.toString() === order.id.toString());
      data[index] = { ...order };
      this.setState({ data: [...data] });
    }
  }

  addOrder(order) {
    let { data } = this.state;
    data.unshift(order)
    this.setState({ data });
  }

  removeSaleOrder(order) {
    let { data } = this.state;
    if (Number(order.status_select) !== 3) {
      const index = data.findIndex(p => p.id === order.id);
      data.splice(index, 1);
      this.setState({ data });
    } else {
      const index = data.findIndex(p => p.id.toString() === order.id.toString());
      data.splice(index, 1);
      this.setState({ data });
    }
  }

  onViewOrder(order) {
    this.props.navigator.pushPage({
      component: ViewOrder,
      path: `ViewOrder_${order ? order.id : 0}`,
      data: { order },
      updateOrder: (order) => this.updateOrder(order),
      removeOrder: (order) => this.removeSaleOrder(order),
      getRecordsByIndex: (order, isMount) => this.getRecordsByIndex(order, isMount),
    }, { animation: 'none' });
  }

  onAddOrder(order) {
    this.props.navigator.pushPage({
      component: ViewOrder,
      path: `AddOrder_${order ? order.id : 0}`,
      data: { order },
      getRecordsByIndex: (order, isMount) => this.getRecordsByIndex(order, isMount),
      addOrder: (order) => this.addOrder(order),
    }, { animation: 'none' });
  }

  onListItemClick(item) {
    return this.onViewOrder(item);
  }

  renderRow(row, index) {
    return (
      <div>
        <Typo variant="title"> {row.client_partner ? row.client_partner.full_name || row.client_partner.name : ''} </Typo>
        <Typo variant="body"> <span style={{ marginRight: 5 }}>{translate('common.wt')} :</span>{getSepratedPrice(parseFloat(row.ex_tax_total || '0.00').toFixed(2)) + `${row.currency.symbol ? row.currency.symbol : '€'}`} </Typo>
        <Typo variant="body"> <span style={{ marginRight: 5 }}>{translate('common.ati')} :</span>{getSepratedPrice(parseFloat(row.in_tax_total || '0.00').toFixed(2)) + `${row.currency.symbol ? row.currency.symbol : '€'}`} </Typo>
        <Typo variant="body"> {statusSelect[row.status_select]} </Typo>
      </div>
    )
  }

  renderPageTitle() {
    return (
      <React.Fragment>
        <div className='center center-align-title'>
          <Translate text="common.orderTitle" />
        </div>
        <div className='right icons list_add_button'>
          <div style={{ flex: 1 }} onClick={() => this.onAddOrder()}>
            <div style={{ color: "rgba(44, 196,211,1)", margin: '0px auto' }} className="round-icon">
              <Icon icon='md-plus' />
            </div>
          </div>
        </div>
      </React.Fragment>
    )
  }
}

OrdersList.propTypes = {
  navigator: PropTypes.any,
  route: PropTypes.any,
};

const mapPropsToState = (state) => ({ app: state.app, user_data: state.user });
OrdersList = reduxConnect(mapPropsToState)(OrdersList);

export const OrdersListComponent = OrdersList;

export default connect(OrdersList);
