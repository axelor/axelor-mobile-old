import React, { Component } from "react";
import PropTypes from "prop-types";
import { Icon } from "react-onsenui";
import { connect as reduxConnect } from "react-redux";
import Translate from "../../../../locale";
import connect from "../../connect/planning";
import moment from "moment";
import "../../../styles.css";
import "./style.css";

class MonthView extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentMonth: new Date(),
      selectedDate: new Date(),
      tasks: [],
      pager: {
        offset: 0,
        limit: null,
        total: 0
      }
    };
    this.userId = this.props.user_data && this.props.user_data.info["user.id"];
  }

  fetchData(currentMonth = new Date()) {
    this.setState({ loading: true });
    const { searchAll } = this.props.projectPlanningTime;

    let API = searchAll;
    let options = { ...this.state.pager };

    const monthStart = moment(currentMonth).startOf("month");
    const monthEnd = moment(monthStart).endOf("month");

    options["search"] = {
      fields: [
        { fieldName: "date", fieldType: "date", value: monthStart.format(""), operator: ">=" },
        { fieldName: "date", fieldType: "date", value: monthEnd.format(""), operator: "<=" }
      ],
      operator: "and"
    };

    return API({
      ...options
    }).then(({ data = [], total }) => {
      const { pager } = this.state;
      if (data) {
        this.setState({
          loading: false,
          tasks: data,
          pager: { ...pager, total, offset: options.offset }
        });
      }
    });
  }

  componentDidMount() {
    const { type = "TASK" } = this.props;
    if(type !== "QUALITY"){
      this.fetchData(new Date());
    }
  }

  renderHeader() {
    return (
      <div className="header row flex-middle">
        <div className="col col-start">
          <div className="icon" onClick={this.prevMonth}>
            <Icon icon="fa-chevron-left" />
          </div>
        </div>
        <div className="col col-center" style={{ color: "#31b7ac" }}>
          <span>{moment(this.state.currentMonth).format("MMMM YYYY")}</span>
        </div>
        <div className="col col-end" onClick={this.nextMonth}>
          <div className="icon">
            <Icon icon="fa-chevron-right" />
          </div>
        </div>
      </div>
    );
  }

  renderDays() {
    const days = [];
    let startDate = moment(this.state.currentMonth).startOf("isoWeek");

    for (let i = 0; i < 7; i++) {
      days.push(
        <div className="col col-center" key={i}>
          {moment(startDate)
            .add(i, "days")
            .format("dd")}
        </div>
      );
    }

    return <div className="days row">{days}</div>;
  }

  renderCells() {
    const { currentMonth, selectedDate, tasks = [] } = this.state;
    const monthStart = moment(currentMonth).startOf("month");
    const monthEnd = moment(monthStart).endOf("month");
    const startDate = moment(monthStart).startOf("isoWeek");
    const endDate = moment(monthEnd).endOf("monthEnd");

    const rows = [];

    let days = [];
    let day = startDate;
    let formattedDate = "";
    let eventDates = [];

    tasks.forEach(task => {
      eventDates.push(moment(task.task_deadline).format("YYYY MM DD"));
    });

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        let eventDate = moment(day).format("YYYY MM DD");
        formattedDate = moment(day).format("D");
        let match = eventDates.includes(eventDate);
        const cloneDay = day;

        days.push(
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center"
            }}
            className={`col cell ${
              !moment(day).isSame(monthStart, "month")
                ? "disabled"
                : moment(day).isSame(moment(selectedDate))
                ? "selected"
                : ""
            }`}
            key={day}
            onClick={() => this.onDateClick(moment(cloneDay))}
          >
            <span className="number">{formattedDate}</span>
            {match ? (
              <span
                style={{
                  height: 10,
                  width: 10,
                  backgroundColor: !moment(day).isSame(monthStart, "month")
                    ? "#b6dbd6"
                    : "#31b7ac",
                  borderRadius: "50%",
                  marginTop: -10
                }}
              />
            ) : (
              ""
            )}
          </div>
        );
        day = moment(day).add(1, "days");
      }
      rows.push(
        <div className="row" key={day}>
          {days}
        </div>
      );
      days = [];
    }
    return <div className="body">{rows}</div>;
  }

  onDateClick = day => {
    this.props.onDateClick(day.format("YYYY-MM-DD"));
  };

  nextMonth = () => {
    this.setState({
      currentMonth: moment(this.state.currentMonth).add(1, "month")
    },() => this.fetchData(this.state.currentMonth));
  };

  prevMonth = () => {
    this.setState({
      currentMonth: moment(this.state.currentMonth).subtract(1, "month")
    },() => this.fetchData(this.state.currentMonth));
  };

  renderToolbar() {
    return (
      <React.Fragment>
        <div className="center center-align-title">
          <Translate text={`app.planning.title`} />
        </div>
        <div className="right icons  list_add_button">
          <div style={{ flex: 1 }}>
            <div
              style={{ color: "rgba(44, 196,211,1)", margin: "0px auto" }}
              className="round-icon"
            >
              <Icon icon="fa-calendar-o" style={{ fontSize: 20 }}/>
            </div>
          </div>
        </div>
      </React.Fragment>
    );
  }

  renderForm() {
    return (
      <div className="calendar">
        {this.renderHeader()}
        {this.renderDays()}
        {this.renderCells()}
      </div>
    );
  }

  render() {
    return (
      this.renderForm()
    );
  }
}

MonthView.propTypes = {
  navigator: PropTypes.any,
  route: PropTypes.any
};

MonthView = reduxConnect(state => ({
  app: state.app,
  user_data: state.user.data
}))(MonthView);

export default connect(MonthView);
