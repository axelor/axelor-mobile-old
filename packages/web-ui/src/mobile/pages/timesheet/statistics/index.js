import React, { Component } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import connect from '../connect';
import Page from '../../page';
import Translate from '../../../locale';
import './index.css';


const Bar = (props) => {
  const { height,label } = props;
  return(
    <div className="bar-container">
      <label className='bar-title' style={{ bottom: `${height + 10}px` }}>
        {label}
      </label>
      <div className="bar" style={{ height: `${height}px` }}>
      </div>
    </div>
  )
}

class TimesheetStatistics extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentDate: moment(),
      data: [],
    };
  }

  componentDidMount() {
    this.fetchData();
  }

  fetchData() {
    const { currentDate } = this.state;
    const weekStart = currentDate.clone().startOf('week');
    const weekEnd = currentDate.clone().endOf('week');

    const { searchAll } = this.props.api;
    searchAll({
      search: {
        fields: [
          { fieldName: 'date', fieldType: 'date', operator: '>=', value: weekStart.format('YYYY-MM-DD') },
          { fieldName: 'date', fieldType: 'date', operator: '<=', value: weekEnd.format('YYYY-MM-DD') },
        ],
        operator: 'and',
      },
    }).then(({ data = [], status }) => {
      this.setState({ data });
    });
  }

  groupData() {
    const { data } = this.state;
    const groupByDate = {};
    data.forEach(e => {
      if (!groupByDate[e.date]) {
        groupByDate[e.date] = [e];
      } else {
        groupByDate[e.date].push(e);
      }
    });
    return groupByDate;
  }

  moveLeft() {
    const { currentDate } = this.state;
    this.setState({ currentDate: currentDate.clone().subtract(7, 'days') }, () => this.fetchData());
  }

  moveRight() {
    const { currentDate } = this.state;
    this.setState({ currentDate: currentDate.clone().add(7, 'days') }, () => this.fetchData());
  }

  render() {
    const { currentDate, data } = this.state;
    const weekStart = currentDate.clone().startOf('week');
    const weekEnd = currentDate.clone().endOf('week');
    const groupByDate = this.groupData();
    const maxHrs = 30;
    const maxHeight = 400;
    let totalHrs = 0;
    data.forEach(e => {
      totalHrs += Number(e.durationStored);
    });
    return (
      <Page
        {...this.props}
        title={
          <div className='center'>
            <Translate text="app.timesheet.statistics.title" />
          </div>
        }
      >
        <div className="stats page-content">
          <div className="stats-nav">
            <div className="arrow-left" onClick={() => this.moveLeft()}>
              <i className="fa fa-chevron-left"></i>
            </div>
            <div>
              <h3>{weekStart.format('DD-MM')} to {weekEnd.format('DD-MM')}</h3>
              <p> <Translate text="app.timesheet.statistics.week" /> {currentDate.week()} </p>
            </div>
            <div className="arrow-right" onClick={() => this.moveRight()}>
              <i className="fa fa-chevron-right"></i>
            </div>
          </div>
          <div className="stats-chart" style={{ height: `${maxHeight}px` }}>
            <div className="stats-x stats-bars">
              {
                Array(7).fill(0).map((x, i) => {
                  const day = weekStart.clone().add(i, 'days').format('YYYY-MM-DD');
                  const tasks = groupByDate[day] || [];
                  let total = 0;
                  tasks.forEach((task) => {
                    total += Number(task.durationStored || 0);
                  });
                  const barHeight = Math.round(total * maxHeight / maxHrs);
                  return (
                    <Bar
                      key={i}
                      height={barHeight}
                      label={total > 0 && total.toFixed(2)}
                    />
                  );
                })
              }
            </div>
            <div className="stats-x stats-labels">
              {
                Array(7).fill(0).map((x, i) => {
                  const day = weekStart.clone().add(i, 'days').format('ddd');
                  return (
                    <div key={i} className="bar-label">
                      <Translate text={`app.timesheet.statistics.days.${day.toLowerCase()}`} />
                    </div>
                  );
                })
              }
            </div>
          </div>
          <div className="stats-task-list">
              {
                data.map((e, i) => (
                  <div key={i} className="stats-task">
                    <label> {e.product.fullName} </label>
                    <label> {Number(e.durationStored).toFixed(2)} </label>
                  </div>
                ))
              }
              <div className="stats-task totals">
                <label> <Translate text="app.timesheet.statistics.total" /> </label>
                <label> {totalHrs.toFixed(2)} </label>
              </div>
          </div>
        </div>
      </Page>
    );
  }
}

TimesheetStatistics.propTypes = {
  navigator: PropTypes.any,
  route: PropTypes.any,
};

export default connect(TimesheetStatistics);
