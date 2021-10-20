import React from "react";
import moment from "moment";
import PropTypes from "prop-types";
import { connect as reduxConnect } from "react-redux";
import connect from "../../connect/qualitycontrol";
import Translate from "../../../../locale";
import PageListTabsComponent, { Typo } from "../../../page-tabs-list";
import ControlForm from "../add/ControlForm";
import ProcessList from "../add/ProcessList";
import ChronologicalView from "../../../task/Planned/TimelineView/ChronologicalView";
import MonthView from "../../../task/Planned/MonthView";
import DateBar from "../../../task/Planned/TimelineView/DateBar";
import { translate } from "../../../../locale";

import { Icon } from "react-onsenui";
import "moment/locale/fr";

export class ControlList extends PageListTabsComponent {
  constructor(props) {
    super(
      props,
      { filter: 1 },
      {
        fetchRelatedFields: {
          project: ["fullName", "id", "customerAddress", "contactPartner"]
        },
        cacheRelatedFields: false
      }
    );
    this.userId =
      this.props.user_data.data &&
      this.props.user_data.data.info.employee &&
      this.props.user_data.data.info.employee.id;

    //change date format as per language
    moment.locale(
      this.props.user_data.data && this.props.user_data.data.info["user.lang"]
    );
  }

  getAPI() {
    return this.props.api;
  }

  viewControl(record) {
    const { data } = this.state;
    const index = data.findIndex(d => d.id === record.id);
    this.props.navigator.pushPage(
      {
        component: ControlForm,
        path: `ViewControl` + Date.now(),
        data: record,
        recordIndex: index,
        getRecordsByIndex: (control, isMount) =>
          this.getRecordsByIndex(control, isMount),
        updateControl: control => {
          let index = data.findIndex(
            c => c.id.toString() === control.id.toString()
          );
          data[index] = { ...control };
          this.setState({ data: [...data] });
        }
      },
      { animation: "none" }
    );
  }

  getFetchFilterOptions(filter) {
    let fetchFilterOptions = {
      fields: [
        { fieldName: "status_select", value: [1,3,4], operator: "IN" },
        { fieldName: "responsible.id", value: this.userId, operator: "=" }
      ],
      operator: "and"
    };

    //Today's Control
    if (filter === 1) {
      fetchFilterOptions.fields.push({
        fieldName: "dead_line_date",
        fieldType: "date",
        format: 'YYYY-MM-DD',
        value: moment(this.state.date).format("YYYY-MM-DD"),
        operator: "="
      });
      return {
        ...fetchFilterOptions
      };
    }

    //Current Week's Control
    if (filter === 2) {
      fetchFilterOptions.fields.push({
        fieldName: "dead_line_date",
        fieldType: "date",
        format: 'YYYY-MM-DD',
        value: moment()
          .startOf("isoWeek")
          .format("YYYY-MM-DD"),
        operator: ">="
      });
      fetchFilterOptions.fields.push({
        fieldName: "dead_line_date",
        fieldType: "date",
        format: 'YYYY-MM-DD',
        value: moment()
          .endOf("isoWeek")
          .format("YYYY-MM-DD"),
        operator: "<="
      });
      return {
        ...fetchFilterOptions
      };
    }

    //Current Month's Control
    if (filter === 3) {
      fetchFilterOptions.fields.push({
        fieldName: "dead_line_date",
        fieldType: "date",
        format: 'YYYY-MM-DD',
        value: moment()
          .startOf("month")
          .format("YYYY-MM-DD"),
        operator: ">="
      });
      fetchFilterOptions.fields.push({
        fieldName: "dead_line_date",
        fieldType: "date",
        format: 'YYYY-MM-DD',
        value: moment()
          .endOf("month")
          .format("YYYY-MM-DD"),
        operator: "<="
      });
      return {
        ...fetchFilterOptions
      };
    }
    return {
      fields: [
        { fieldName: "statusSelect", value: [1,3,4], operator: "IN" },
        { fieldName: "responsible.id", value: this.userId, operator: "=" }
      ],
      operator: "and"
    };
  }

  renderListSearch() {
    return super.renderListSearch({
      placeholder: translate("app.quality.searchByName")
    });
  }

  getFetchSearchOptions(keyword) {
    const searchCriteria = {
      fields: [
        { fieldName: "name", value: keyword, operator: "like" },
        { fieldName: "statusSelect", value: [1,3,4], operator: "IN" },
        { fieldName: "responsible.id", value: this.userId, operator: "=" }
      ],
      operator: "and"
    };
    if (moment(keyword).isValid()) {
      searchCriteria.fields = [
        {
          fieldName: "dead_line_date",
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
      sortBy: ["startDate"]
    });
  }

  getListTabsData() {
    return [
      { text: <Translate text={"app.quality.today"} />, value: 1 },
      { text: <Translate text={"app.quality.week"} />, value: 2 },
      { text: <Translate text={"app.quality.month"} />, value: 3 }
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

  onDateClick = e => {
    this.handleTabChange(
      { target: { value: 1 } },
      moment.parseZone(e).format("YYYY-MM-DD")
    );
  };

  renderListTabsFilter() {
    return (
      <DateBar
        value={this.state.date}
        filter={this.state.filter}
        onChange={e => this.handleTabChange(e)}
      />
    );
  }

  addQualityControl() {
    this.props.navigator.pushPage(
      {
        component: ProcessList,
        path: `Processlist` + Date.now(),
        getRecordsByIndex: (control, isMount) =>
          this.getRecordsByIndex(control, isMount),
        addControl: control => {
          let { data } = this.state;
          data.unshift(control);
          this.setState({ data });
        },
        updateControl: control => {
          const { data } = this.state;
          let index = data.findIndex(c => c.id === control.id);
          if (control.status_select !== 1) {
            data.splice(index, 1);
          } else {
            data[index] = { ...control };
          }
          this.setState({ data: [...data] });
        }
      },
      { animation: "none" }
    );
  }

  onListItemClick(item) {
    return this.viewControl(item);
  }

  renderList() {
    const { data, filter } = this.state;
    if (filter === 3) {
      return (
        <div className="month-view">
          <MonthView onDateClick={this.onDateClick} type="QUALITY" />
        </div>
      );
    }
    if (filter !== 1) {
      return (
        <div style={{ marginTop: '30%' }}>
          <ChronologicalView
            groupField="dead_line_date"
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
    const { name, project, dead_line_date } = row;
    const { full_name, customer_address } = project || {};
    return (
      <div>
        <Typo variant="title">{name}</Typo>
        <Typo variant="body">{full_name}</Typo>
        <Typo variant="body">
          {customer_address && (
            <React.Fragment>
              {customer_address && customer_address.fullName}
            </React.Fragment>
          )}
        </Typo>
        <Typo variant="body">
          {dead_line_date && (
            <React.Fragment>
              <Translate text="app.quality.deadLineDate" />:{" "}
              {moment(dead_line_date).format("DD MMMM YYYY")}
            </React.Fragment>
          )}
        </Typo>
      </div>
    );
  }

  renderPageTitle() {
    return (
      <React.Fragment>
        <div className="center center-align-title">
          <Translate text="app.quality.listTitle" />
        </div>
        <div className="right icons list_add_button">
          <div style={{ flex: 1 }} onClick={() => this.addQualityControl()}>
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

ControlList.propTypes = {
  navigator: PropTypes.any,
  route: PropTypes.any
};

const mapPropsToState = state => ({ app: state.app, user_data: state.user });
ControlList = reduxConnect(mapPropsToState)(ControlList);

export const ControlListComponent = ControlList;

export default connect(ControlList);
