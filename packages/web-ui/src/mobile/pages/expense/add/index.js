import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ExpenseForm from './expenseEditor';
import KMExpenseForm from './../kmExpense/add';

class ExpenseEditor extends Component {
  constructor(props) {
    super(props);
    this.state = {
      search: '',
      selected: 0,
      loading: false,
      alert: null,
      pager: {
        offset: 0,
        limit: 20,
        total: 0,
      },
      test: null,
      checked: true,
      text: '',
      showErrorDialog: false,
      submitError: {
        title: null,
        content: null,
      }
    }
  }

  render() {
    const { route } = this.props;
    const { activeRoute } = route;

    return (
        activeRoute === 'km_expense' ?
        <KMExpenseForm {...this.props}/>
        :
        <ExpenseForm {...this.props}/>
    );
  }
}

ExpenseEditor.propTypes = {
  navigator: PropTypes.any,
  route: PropTypes.any,
};

export default ExpenseEditor;
