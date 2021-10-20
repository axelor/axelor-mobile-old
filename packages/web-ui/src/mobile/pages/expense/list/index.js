import React from "react";
import PropTypes from "prop-types";
import moment from "moment";
import { connectExpense } from "../connect";
import { connect as reduxConnect } from "react-redux";
// import PageScroller from "../../page-scroller";
import { Icon } from "react-onsenui";
import Translate from "../../../locale";
import ExpenseLine from "./../add";
import "./index.css";
import PageListComponent, { Typo } from "../../page-list";
import { getSepratedPrice } from "./../../common.func";

class ExpenseList extends PageListComponent {
  constructor(props) {
    super(
      props,
      {},
      {
        fetchRelatedFields: {}
      }
    );
  }
  getAPI() {
    return this.props.api;
  }

  fetchData(loading) {
    const data = {
      context: {}
    };
    let api = Promise.resolve();
    const { action } = this.props.api;
    api = action("expense.all", data).then(res => {
      const { view } = res.data[0];
      this.domain = view ? view.domain : {};
    });

    return api.then(() => super.fetchData(loading));
  }

  getFetchOptions(searchOptions) {
    const { info } = this.props.user_data;
    return super.getFetchOptions(
      {
        ...searchOptions,
        data: {
          _domain: this.domain,
          _domainContext: {
            user_id: { id: info["user.id"] }
          }
        }
      },
      {
        fields: [
          {
            fieldName: "project.fullName",
            operator: "like",
            value: this.state.keyword
          },
          {
            fieldName: "expenseProduct.fullName",
            operator: "like",
            value: this.state.keyword
          },
          {
            fieldName: "expense.user.fullName",
            operator: "like",
            value: this.state.keyword
          },
        ]
      }
    );
  }

  moveToView(props) {
    this.props.navigator.pushPage(
      {
        component: ExpenseLine,
        path: "add_expense",
        updateItem: record => this.updateItem(record),
        removeItem: record => this.removeItem(record),
        updateNewItem: record => this.updateNewItem(record),
        getRecordsByIndex: (record, isMount) =>
          this.getRecordsByIndex(record, isMount),
        ...props
      },
      { animation: "none" }
    );
  }

  addExpense() {
    const props = {
      path: "add_expense"
    };
    this.moveToView(props);
  }

  editExpense(record) {
    const props = {
      path: "edit_expense",
      data: record
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
    return this.editExpense(item);
  }

  renderRow(item, index) {
    const expenseProduct = item.expenseProduct || {};
    return (
      <div>
        <Typo variant="title">
          {" "}
          {expenseProduct.fullName && expenseProduct.fullName.trim()}{" "}
        </Typo>
        <Typo variant="body"> {item.project && item.project.fullName} </Typo>
        <Typo variant="body">
          {" "}
          {item.totalAmount &&
            getSepratedPrice(Number(item.totalAmount).toFixed(2))}{" "}
          <Icon icon="fa-eur" />{" "}
        </Typo>
        <Typo variant="body">
          {" "}
          {moment(item.expenseDate).format("DD MMM YYYY")}{" "}
        </Typo>
      </div>
    );
  }

  renderList() {
    return super.renderList({
      style: { marginTop: 45, marginBottom: 50, backgroundImage: "none" }
    });
  }

  renderPageTitle() {
    return (
      <React.Fragment>
        <div className="center center-align-title">
          <Translate text="app.expense.title" />
        </div>
        <div className="right icons list_add_button">
          <div style={{ flex: 1 }} onClick={() => this.addExpense()}>
            <div
              key="add"
              style={{ color: "rgba(44, 196,211,1)", margin: "0px auto" }}
              className="round-icon"
            >
              <Icon icon="md-plus" />
            </div>
          </div>
        </div>
      </React.Fragment>
    );
  }
}

ExpenseList.propTypes = {
  navigator: PropTypes.any,
  route: PropTypes.any
};
ExpenseList = reduxConnect(state => ({
  app: state.app,
  user_data: state.user.data
}))(ExpenseList);
export default connectExpense(ExpenseList);
