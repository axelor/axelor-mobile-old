import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { connectKMExpense } from '../../connect';
import { Icon } from 'react-onsenui';
import PageScroller from '../../../page-scroller';
import Translate from '../../../../locale';
import ExpenseLine from './../../add';
import './index.css';
import PageListComponent, { Typo } from '../../../page-list';

class ExpenseList extends PageListComponent {
  constructor(props) {
    super(props, {}, {
      fetchRelatedFields: {},
    });
  }
  componentDidMount() {
    this.fetchData();
  }

  getAPI() {
    return this.props.api;
  }

  getFetchOptions(searchOptions) {
    return super.getFetchOptions(searchOptions, {
      fields: [{
        fieldName:"project.fullName",
        operator:"like",
        value:this.state.keyword
      },{
        fieldName:"toCity",
        operator:"like",
        value:this.state.keyword
      },{
        fieldName:"fromCity",
        operator:"like",
        value:this.state.keyword
      }]
    });
  }

  moveToView(props) {
    this.props.navigator.pushPage({
      component: ExpenseLine,
      path: 'add_kmExpense',
      activeRoute: 'km_expense',
      updateItem: (record) => this.updateItem(record),
      removeItem: (record) => this.removeItem(record),
      updateNewItem: (record) => this.updateNewItem(record),
      getRecordsByIndex: (record, isMount) => this.getRecordsByIndex(record, isMount),
      ...props
    }, { animation: 'none' });
  }

  addKMExpense() {
    const props = {
      path: 'add_expense',
    };
    this.moveToView(props);
  }

  editKMExpense(record) {
    const props = {
      path: 'KMEXPENSE_FORM',
      data: record,
    };
    this.moveToView(props);
  }

  updateNewItem(record) {
    const { data } = this.state;
    data.splice(0, 0, { ...record });
    this.setState({ data });
  }

  removeItem(record) {
    const { data } = this.state;
    const targetIndex = data.findIndex(d => d.row_id === record.row_id);
    data.splice(targetIndex, 1);
    this.setState({ data });
  }

  updateItem(record) {
    const { data } = this.state;
    const index = data.findIndex(d => d.row_id === record.row_id);
    if (index !== -1) {
      data[index] = record;
    } else {
      data.splice(0, 0, record);
    }
    this.setState({ data });
  }

  onListItemClick(item) {
    return this.editKMExpense(item);
  }

  renderRow(item, index) {
    return (
      <div>
        <Typo variant="title"> {item.project && item.project.fullName} </Typo>
        <Typo variant="body"> {moment(item.expenseDate).format('DD MMM YYYY')} </Typo>
        <Typo variant="body"> {item.fromCity}-{item.toCity} </Typo>
      </div>
    )
  }

  renderList() {
    return super.renderList({
      style: { marginTop: 45, marginBottom: 50, backgroundImage: 'none' },
    });
  }

  renderPageTitle() {
    return (
      <React.Fragment>
        <div className='center center-align-title'>
          <Translate text="app.expense.km_expense_title" />
        </div>
        <div className='right icons list_add_button'>
          <div style={{ flex: 1 }} onClick={() => this.addKMExpense()}>
            <div key="add" style={{ color: "rgba(44, 196,211,1)", margin: '0px auto' }} className="round-icon" >
              <Icon icon='md-plus' />
            </div>
          </div>
        </div>
      </React.Fragment>
    )
  }
}

ExpenseList.propTypes = {
  navigator: PropTypes.any,
  route: PropTypes.any,
};

export default connectKMExpense(PageScroller(ExpenseList));
