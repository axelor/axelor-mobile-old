import React from 'react';
import PropTypes from 'prop-types';
import { connect as reduxConnect } from 'react-redux';
import connect from '../connect/sale-quotation';
import Translate, { translate } from '../../../locale';
import { Icon } from 'react-onsenui';
import ViewQuotation from './ViewQuotation';
import PageListTabsComponent, { Typo } from '../../page-tabs-list';
import { getSepratedPrice } from '../../common.func';

const statusSelect = {
  1: <Translate text='common.status.Draft' />,
  2: <Translate text='common.status.Finalize' />,
  3: <Translate text='common.status.orderConfirmed' />,
  4: <Translate text='common.status.Finished' />,
  5: <Translate text='common.status.Canceled' />,
}

class QuotationsList extends PageListTabsComponent {
  constructor(props) {
    super(props, {}, {
      fetchRelatedFields: {
        saleOrderLineList: ['fullName', 'price', 'unit', 'priceDiscounted', 'productName', 'discountTypeSelect', 'qty', 'exTaxTotal', 'inTaxTotal', 'taxLine'],
        saleOrderLineTaxList: ['taxLine', 'exTaxBase', 'taxTotal'],
        company:['id','partner','name'],
        currency:['id','currency','code','symbol']
      },
    });
  }

  getAPI() {
    return this.props.order;
  }

  getFetchFilterOptions(filter) {
    const flags = {
      1: [1],//draft
      2: [2],//finalize
      3: [1, 2],//others
    }
    return {
      fields: [
        { fieldName: 'status_select', value: flags[filter], operator: filter === 3 ? 'notIn' : 'IN' }
      ],
      operator: 'and',
    };
  }

  getFetchSearchOptions(keyword) {
    const searchCriteria = {
      fields: [
        { fieldName: 'clientPartner.fullName', operator: 'like', value: this.state.keyword },
        { fieldName: 'ex_tax_total', operator: '=', value: keyword },
        { fieldName: 'in_tax_total', operator: '=', value: keyword },
      ],
      operator: 'or'
    };
    return searchCriteria;
  }

  getListTabsData() {
    return [
      { text: <Translate text={'common.filterTab.all'} />, value: 0 },
      { text: <Translate text={'common.status.Draft'} />, value: 1 },
      { text: <Translate text={'common.status.Finalize'} />, value: 2 },
      { text: <Translate text={'common.status.Others'} />, value: 3 },
    ];
  }

  removeQuotation(q) {
    let { data } = this.state;
    const index = data.findIndex(p => p.id === q.id);
    data.splice(index, 1);
    this.setState({ data });
  }

  onViewQuotation(order) {
    this.props.navigator.pushPage({
      component: ViewQuotation,
      path: `ViewQuotation_${order ? order.id : 0}`,
      data: { order },
      updateQuotation: (order) => this.updateQuotation(order),
      removeQuotation: (order) => this.removeQuotation(order),
      getRecordsByIndex: (order, isMount) => this.getRecordsByIndex(order, isMount),
    }, { animation: 'none' });
  }

  onAddQuotation(order) {
    this.props.navigator.pushPage({
      component: ViewQuotation,
      path: `AddQuotation_${order ? order.id : 0}`,
      data: { order },
      getRecordsByIndex: (order, isMount) => this.getRecordsByIndex(order, isMount),
      addQuotation: (order) => {
        let { data } = this.state;
        data.unshift(order)
        this.setState({ data });
      },
    }, { animation: 'none' });
  }

  updateQuotation(order) {
    const { data } = this.state;
    let index = data.findIndex(c => c.id.toString() === order.id.toString());
    data[index] = { ...order };
    this.setState({ data: [...data] })
  }

  onListItemClick(item) {
    return this.onViewQuotation(item);
  }

  renderRow(row, index) {
    return (
      <div>
        <Typo variant="title"> {row.client_partner ? row.client_partner.full_name || row.client_partner.name : ''} </Typo>
        <Typo variant="body"><span style={{ marginRight: 5 }}>{translate('common.wt')} :</span>{getSepratedPrice(parseFloat(row.ex_tax_total || '0.00').toFixed(2)) + `${row.currency.symbol ? row.currency.symbol : '€'}`}</Typo>
        <Typo variant="body"><span style={{ marginRight: 5 }}>{translate('common.ati')} :</span>{getSepratedPrice(parseFloat(row.in_tax_total || '0.00').toFixed(2)) + `${row.currency.symbol ? row.currency.symbol : '€'}`}</Typo>
        <Typo variant="body">{statusSelect[row.status_select]}</Typo>
      </div>
    )
  }

  renderPageTitle() {
    return (
      <React.Fragment>
        <div className='center center-align-title'>
          <Translate text="common.quotationTitle" />
        </div>
        <div className='right icons list_add_button' >
          <div style={{ flex: 1 }} onClick={() => this.onAddQuotation()}>
            <div style={{ color: "rgba(44, 196,211,1)", margin: '0px auto' }} className="round-icon">
              <Icon icon='md-plus' />
            </div>
          </div>
        </div>
      </React.Fragment>
    )
  }

}

QuotationsList.propTypes = {
  navigator: PropTypes.any,
  route: PropTypes.any,
};

const mapPropsToState = (state) => ({ app: state.app, user_data: state.user });
QuotationsList = reduxConnect(mapPropsToState)(QuotationsList);

export const QuotationsListComponent = QuotationsList;

export default connect(QuotationsList);
