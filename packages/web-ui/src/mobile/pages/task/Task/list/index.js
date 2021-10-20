import React from "react";
import moment from "moment";
import PropTypes from "prop-types";
import { connect as reduxConnect } from "react-redux";

import connect from "../../connect/task";
import Translate, { translate } from "../../../../locale";
import PageListTabsComponent, { Typo } from "../../../page-tabs-list";
import TaskView from "../add";

import "../../../styles.css";

import ChronologicalView from "../../Planned/TimelineView/ChronologicalView";

export class TaskList extends PageListTabsComponent {
  constructor(props) {
    super(props, { filter: 2, date: moment() });

    this.userId =
      this.props.user_data.data && this.props.user_data.data.info["user.id"];
  }

  getAPI() {
    return this.props.api;
  }

  viewTask(record) {
    const { data } = this.state;
    const index = data.findIndex(d => d.id === record.id);
    this.props.navigator.pushPage(
      {
        component: TaskView,
        path: "TaskView",
        onUpdate: record => {
          const target = data.findIndex(d => d.id === record.id);
          data[target] = { ...record };
          if (record.status === "closed") {
            const targetIndex = data.findIndex(o => o.status === record.status);
            data.splice(targetIndex, 1);
            this.setState({ data });
          }
          this.setState({ data: [...data] });
        },
        removeRecord: record => {
          const targetIndex = data.findIndex(o => o.id === record.id);
          data.splice(targetIndex, 1);
          this.setState({ data });
        },
        data: record,
        recordIndex: index,
        getRecordsByIndex: (record, isMount) =>
          this.getRecordsByIndex(record, isMount)
      },
      { animation: "none" }
    );
  }

  addTask() {
    const { data } = this.state;
    this.props.navigator.pushPage(
      {
        component: TaskView,
        path: "TaskView",
        onUpdate: record => {
          const target = data.findIndex(d => d.id === record.id);
          data[target] = { ...record };
          this.setState({ data: [...data] });
        },
        removeRecord: record => {
          const targetIndex = data.findIndex(o => o.id === record.id);
          data.splice(targetIndex, 1);
          this.setState({ data });
        },
        getRecordsByIndex: (record, isMount) =>
          this.getRecordsByIndex(record, isMount),
        onNewUpdate: record => this.setState({ data: [record, ...data] })
      },
      { animation: "none" }
    );
  }

  getFetchFilterOptions(filter) {
    //Common filters
    let fetchFilterOptions = {
      fields: [
        { fieldName: "status", value: ["new", "in-progress"], operator: "IN" },
        { fieldName: "assigned_to.id", value: this.userId, operator: "=" }
      ],
      operator: "and"
    };

    // All Task's
    if (filter === 1) {
      return {
        ...fetchFilterOptions
      };
    }

    //Today's Task
    if (filter === 2) {
      fetchFilterOptions.fields.push({
        fieldName: "task_date",
        fieldType: "date",
        value: this.state.date,
        operator: "="
      });
      return {
        ...fetchFilterOptions
      };
    }

    //Current Week's Task
    if (filter === 3) {
      fetchFilterOptions.fields.push({
        fieldName: "task_date",
        fieldType: "date",
        value: moment(this.state.date)
          .startOf("isoWeek")
          .format(""),
        operator: ">="
      });
      fetchFilterOptions.fields.push({
        fieldName: "task_date",
        fieldType: "date",
        value: moment(this.state.date)
          .endOf("isoWeek")
          .format(""),
        operator: "<="
      });
      return {
        ...fetchFilterOptions
      };
    }

    //Current Month's Task
    if (filter === 4) {
      fetchFilterOptions.fields.push({
        fieldName: "task_date",
        fieldType: "date",
        value: moment(this.state.date)
          .startOf("month")
          .format(""),
        operator: ">="
      });
      fetchFilterOptions.fields.push({
        fieldName: "task_date",
        fieldType: "date",
        value: moment(this.state.date)
          .endOf("month")
          .format(""),
        operator: "<="
      });
      return {
        ...fetchFilterOptions
      };
    }

    //Late Task's
    if (filter === 5) {
      fetchFilterOptions.fields.push({
        fieldName: "task_date",
        fieldType: "date",
        value: this.state.date,
        operator: "<"
      });
      return {
        ...fetchFilterOptions
      };
    }
  }

  getFetchSearchOptions(keyword) {
    const searchCriteria = {
      fields: [
        { fieldName: "name", value: keyword, operator: "like" },
        { fieldName: "project.fullName", value: keyword, operator: "like" }
      ],
      operator: "or"
    };
    if (moment(keyword).isValid()) {
      searchCriteria.fields = [
        {
          fieldName: "task_date",
          fieldType: "date",
          value: keyword,
          operator: "="
        }
      ];
      searchCriteria.operator = "and";
    }
    return searchCriteria;
  }

  getFetchOptions(searchOptions) {
    return super.getFetchOptions({
      ...searchOptions,
      sortBy: ["task_date"]
    });
  }

  getListTabsData() {
    return [
      { text: <Translate text={"app.task.all"} />, value: 1 },
      { text: <Translate text={"app.task.today"} />, value: 2 },
      { text: <Translate text={"app.task.week"} />, value: 3 },
      { text: <Translate text={"app.task.month"} />, value: 4 },
      { text: <Translate text={"app.task.late"} />, value: 5 }
    ];
  }

  handleTabChange(e, date = moment()) {
    // manually check month tab
    const tabIndex = Number(e.target.value);
    if (tabIndex !== 3) {
      this.setState({ date }, () => {
        this.onTabChange(tabIndex);
      });
    } else {
      this.setState({ filter: tabIndex });
    }
  }

  onListItemClick(item) {
    return this.viewTask(item);
  }

  renderListSearch() {
    return super.renderListSearch({
      placeholder: translate("app.task.searchByName")
    });
  }

  onDateClick = e => {
    this.handleTabChange({ target: { value: 1 } }, moment(e));
  };

  renderList() {
    const { data, filter } = this.state;
    if (filter !== 1 && filter !== 5) {
      return (
        <div style={{ margin: "100px 0px" }}>
          <div
            style={{
              margin: "0px 15px",
              marginLeft: "5%",
              display: "flex",
              padding: "15px 15px",
              paddingBottom: 0
            }}
          >
            <div style={{
              position: 'absolute',
              backgroundColor: '#fff',
              width: '100%',
              height: 27,
              pointerEvents: 'none',
            }}>
              {moment(this.state.date).format("YYYY-MM-DD")}
            </div>
            <input
              ref={e => (this.date = e)}
              type="date"
              name="task"
              value={
                moment(this.state.date).format("YYYY-MM-DD") ||
                moment().format("YYYY-MM-DD")
              }
              onChange={e => {
                this.setState(
                  {
                    date: moment.parseZone(e.target.value).format()
                  },
                  () => {
                    this.searchData();
                  }
                );
              }}
            />
          </div>
          <ChronologicalView
            groupField="task_date"
            data={data}
            renderRow={(row, i) => this.renderRow(row, i)}
            onClick={(row, index) => this.onListItemClick(row)}
          />
        </div>
      );
    }
    return super.renderList();
  }

  renderRow(row, index) {
    return (
      <div>
        <Typo variant="title">{row.name}</Typo>
        <Typo variant="body">{row.project && row.project.full_name}</Typo>
        {row.signURL && (
          <Typo variant="task-signed-tag">
            <Translate text="app.task.signed" />
          </Typo>
        )}
      </div>
    );
  }

  renderPageTitle() {
    return (
      <React.Fragment>
        <div className="center center-align-title">
          <Translate text="app.task.title" />
        </div>
      </React.Fragment>
    );
  }
}

TaskList.propTypes = {
  navigator: PropTypes.any,
  route: PropTypes.any
};

const mapPropsToState = state => ({ app: state.app, user_data: state.user });
TaskList = reduxConnect(mapPropsToState)(TaskList);

export const TaskListComponent = TaskList;

export default connect(TaskList);
