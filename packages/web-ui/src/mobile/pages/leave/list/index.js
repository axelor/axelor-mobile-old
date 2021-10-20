import React from "react";
import moment from "moment";
import PropTypes from "prop-types";
import { connect as reduxConnect } from "react-redux";
import connect from "./../connect";
import Translate from "../../../locale";
import PageListTabsComponent, { Typo } from "../../page-tabs-list";
import classNames from "classnames";
import { Icon } from "react-onsenui";
import ViewLeave from "../view";

const statusSelect = {
  1: "Draft",
  2: "Waiting",
  3: "Validated",
  4: "Refused"
};

const statusMap = {
  draft: 1,
  waiting: 2,
  validated: 3,
  refused: 4
};

class LeaveList extends PageListTabsComponent {
  constructor(props) {
    super(props);
    this.userId =
      this.props.user_data.info && this.props.user_data.info["user.id"];
  }

  getAPI() {
    return this.props.api;
  }

  componentDidMount() {
    super.componentDidMount();
    this.checkLeaveTabDisplay();
  }

  fetchData(loading) {
    const tabs = this.getListTabsData();
    const tab = tabs.find(x => x.value === this.state.filter);

    const data = {
      context: {}
    };
    let api = Promise.resolve();
    if (tab && tab.action) {
      const { action } = this.props.api;
      api = action(tab.action, data).then(res => {
        const { view } = res.data[0];
        this.domain = view ? view.domain : {};
      });
    }

    return api.then(() => super.fetchData(loading));
  }
  getFetchFilterOptions(filter) {
    if (filter === 3) {
      return {
        fields: [{ fieldName: "statusSelect", value: 3, operator: "=" }],
        operator: "or"
      };
    }
    if (filter === 4) {
      return {
        fields: [{ fieldName: "statusSelect", value: 4, operator: "=" }],
        operator: "or"
      };
    }
    if (filter === 2) {
      return {
        fields: [{ fieldName: "statusSelect", value: 2, operator: "=" }],
        operator: "or"
      };
    }
    if (filter === 6) {
      return {
        fields: [{ fieldName: "statusSelect", value: 3, operator: "=" },{ fieldName: "statusSelect", value: 4, operator: "=" }],
        operator: "or"
      };
    }
    return {
      fields: [],
      operator: "and"
    };
  }
  getFetchSearchOptions(keyword) {
    const searchCriteria = {
      fields: [
        { fieldName: "statusSelect", value: statusMap[keyword], operator: "=" },
        { fieldName: "leaveLine.name", value: keyword, operator: "like" },
        { fieldName: "user.fullName", value: keyword, operator: "like" }
      ],
      operator: "or"
    };
    if (moment(keyword).isValid()) {
      searchCriteria.fields = [
        {
          fieldName: "fromDateT",
          fieldType: "date",
          value: keyword,
          operator: "="
        },
        {
          fieldName: "toDateT",
          fieldType: "date",
          value: keyword,
          operator: "="
        }
      ];
      searchCriteria.operator = "or";
    }
    return searchCriteria;
  }

  checkLeaveTabDisplay = () => {
    const { searchAll } = this.props.leaveline.refs.responsible;
    const options = {
      data: {
        _domain: `self.hrManager = true OR self.managerUser = ${this.userId}`
      }
    };
    searchAll({ ...options }).then(({ data = [] }) => {
      this.setState({
        isLeaveTab: data.length > 0 ? true : false
      });
    });
  };

  getFetchOptions(searchOptions) {
    const { filter } = this.state;

    let domainContext =
      filter === 0 || filter === 3 || filter === 4
        ? {
            user_id: { id: this.userId },
            to_justify_leave_reason: false
          }
        : filter === 2
        ? {
            _statusSelect: 2,
            _user:{
              id:this.userId
            }
          }
        : {
          _user:{
            id:this.userId
          }
        };
    this.state.hookState === "action" && this.checkLeaveTabDisplay();
    return super.getFetchOptions({
      ...searchOptions,
      sortBy: ["fromDate", "startOnSelect"],
      data: {
        _domain: this.domain,
        _domainContext: domainContext
      }
    });
  }

  getListTabsData() {
    const { isLeaveTab = false } = this.state;
    const tabs = [
      {
        text: <Translate text={"app.leave.filter.all"} />,
        value: 0,
        action: "leave.all"
      },
      {
        text: <Translate text={"app.leave.filter.validated"} />,
        value: 3,
        action: "leave.all"
      },
      {
        text: <Translate text={"app.leave.filter.refused"} />,
        value: 4,
        action: "leave.all"
      }
    ];
    if (isLeaveTab) {
      tabs.splice(3, 0, {
        text: <Translate text={"app.leave.filter.leaveRequestToValidate"} />,
        value: 2,
        action: "leave.validate"
      });
      tabs.splice(4, 0, {
        text: <Translate text={"app.leave.filter.historicTeamLeaveRequest"} />,
        value: 6,
        action: "leave.historic"
      });
    }
    return tabs;
  }

  addLeave(leave, index) {
    this.props.navigator.pushPage({
      component: ViewLeave,
      mainProps: this.props,
      module: "hrm",
      path: `AddLeave_${leave ? leave.id : 0}`,
      data: { leave: { ...leave } },
      navigator: this.props.navigator,
      addRecord: record => {
        const { data } = this.state;
        data.splice(0, 0, record);
      },
      updateRecord: record => {
        const { data } = this.state;
        const targetIndex = data.findIndex(l => l.id === record.id);
        data[targetIndex] = record;
        this.setState({ data });
      },
      removeRecord: record => {
        const { data } = this.state;
        const targetIndex = data.findIndex(l => l.id === record.id);
        data.splice(targetIndex, 1);
        this.setState({ data });
      },
      getRecordsByIndex: (record, isMount) =>
        this.getRecordsByIndex(record, isMount)
    });
  }

  viewLeave(leave, index) {
    this.props.navigator.pushPage(
      {
        component: ViewLeave,
        mainProps: this.props,
        module: "hrm",
        path: `AddLeave_${leave ? leave.id : 0}`,
        data: { ...leave },
        navigator: this.props.navigator,
        removeRecord: record => {
          const { data } = this.state;
          const targetIndex = data.findIndex(l => l.id === record.id);
          data.splice(targetIndex, 1);
          this.setState({ data });
        },
        updateRecord: record => {
          const { data } = this.state;
          const targetIndex = data.findIndex(l => l.id === record.id);
          data[targetIndex] = record;
          this.setState({ data });
        },
        getRecordsByIndex: (record, isMount) =>
          this.getRecordsByIndex(record, isMount)
      },
      { animation: "none" }
    );
  }

  onListItemClick(row, index) {
    return this.viewLeave(row, index);
  }

  renderRow(row, index) {
    return (
      <div className="leave-record">
        <Typo variant="title"> {row.leaveLine && row.leaveLine.name} </Typo>
        <Typo variant="body">
          {" "}
          {moment(row.fromDate).format("DD MMM YYYY")} to{" "}
          {moment(row.toDate).format("DD MMM YYYY")}{" "}
        </Typo>
        <Typo variant="body">{row.user && row.user.fullName}</Typo>
        <Typo
          variant={classNames(
            "leave-line-status",
            statusSelect[row.statusSelect]
          )}
        >
          <Translate
            text={`app.leave.status.${statusSelect[row.statusSelect] &&
              statusSelect[row.statusSelect].toLowerCase()}`}
          />{" "}
        </Typo>
      </div>
    );
  }

  renderPageTitle() {
    return (
      <React.Fragment>
        <div className="center center-align-title">
          <Translate text="app.leave.title" />
        </div>
        <div className="right icons list_add_button">
          <div style={{ flex: 1 }} onClick={() => this.addLeave()}>
            <div
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

LeaveList.propTypes = {
  navigator: PropTypes.any,
  route: PropTypes.any
};

LeaveList = reduxConnect(state => ({
  app: state.app,
  user_data: state.user.data
}))(LeaveList);

export default connect(LeaveList);
