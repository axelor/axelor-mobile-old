import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect as reduxConnect } from 'react-redux';
import { Icon, ProgressCircular, PullHook } from 'react-onsenui';
import moment from 'moment';
import classNames from 'classnames';

import Page from '../../../page';
import { SwiperViewContainer, Typo } from '../../../page-list';
import Translate, { translate } from '../../../../locale';
import connect from '../../connect/planning';
import MonthView from '../MonthView';
import DateBar from './DateBar';
import PlanningLine from './PlanningLine';
import ChronologicalView from './ChronologicalView';
import TaskView from "../../Task/add";

import './style.css';

const BLOCK_SIZE = 60;
let BLOCK = [];

class TimelineView extends Component {
  constructor(props) {
    super(props);
    this.generateBlock();
    const { day } = props.route;
    this.state = {
      plannedDate: moment(day).format("YYYY-MM-DD") || Date.now(),
      editMode: false,
      alertDialogShown: false,
      filter: 1,
      alert: null,
      loading: false,
      hookState: 'initial',
      keyword: '',
      data: [],
      offset: 0,
      total: 0,
      limit: 10,
    }
  }

  componentDidMount() {
    this.fetchData();
  }

  generateBlock() {
    BLOCK = [];
    for(let i = 0; i < 24; i++) {
      let number = i < 10 ? `0${i}` : i;
      BLOCK.push(`${number}:00`, `${number}:30`);
    }
  }

  openCalendar() {
    this.props.navigator.resetPage({
      component: MonthView,
      mainProps: this.props,
      path: 'MonthView_' + Date.now(),
      navigator: this.props.navigator
    });
  }

  renderToolbar() {
    return (
      <React.Fragment>
        <div className='center ellipse-toolbar center-align-title'>
          <Translate text={`app.planning.title`} />
        </div>

      </React.Fragment>
    );
  }

  getCardStyle(line) {
    const { startTime, endTime } = line;
    if(!startTime || !endTime) {
      return {};
    }
    const start = moment(startTime, "HH:mm").format("HH:mm");
    const end = moment(endTime, "HH:mm").format("HH:mm");

    const startIndex = BLOCK.indexOf(start);
    const endIndex = BLOCK.indexOf(end);

    const counter = endIndex - startIndex;
    const paddingMargin = 14;
    const height = (BLOCK_SIZE * counter) - paddingMargin;
    const top = startIndex * BLOCK_SIZE;

    return { height, top };
  }

  getFilterOptions(filter) {
    const { plannedDate, keyword } = this.state;
    const { user_data = {} } = this.props;
    const { info } = user_data;
    const fields = [];
    if(filter === 1) {
      // day filter
      const value = moment(plannedDate).format("YYYY-MM-DD");
      fields.push({ fieldName: 'date', value: value, operator: "="});
    }
    if(filter === 2) {
      // week filter
      // moment().startOf('week')
      const startDate = moment().startOf('isoWeek').format("YYYY-MM-DD");
      const endDate = moment().endOf('isoWeek').format("YYYY-MM-DD");
      fields.push(
        {fieldName: 'date', value: startDate, operator: '>='},
        {fieldName: 'date', value: endDate, operator: '<='}
      );
    }
    fields.push({ fieldName: 'user.id', value: info["user.id"], operator: "="});
    fields.push({ fieldName: 'task.fullName', value: keyword, operator: "like"});
    return fields;
  }

  fetchData(filter=this.state.filter, loading = true) {
    this.setState({ loading });
    const { limit, offset } = this.state;
    const { searchAll } = this.props.projectPlanningTime;
    let options = {};
    options["search"] = {
      fields: this.getFilterOptions(filter),
      operator: 'and',
      offset,
      limit
    };
    options["sortBy"] = ["date"];
    return new Promise((resolve, reject) => {
      searchAll({...options}).then(({ data = [], total, offset }) => {
        this.setState({ data, filter, total, offset, loading: false });
        resolve();
      })
    })
  }

  onLoadMore(done) {
    const { offset, limit, total } = this.state;
    const newOffset = offset + limit;
    const hasMore = newOffset < total;
    if (hasMore) {
      this.setState({ offset: newOffset }, () => this.fetchData().then(done));
    } else {
      done();
    }
  }

  renderListLoader() {
    return (
      this.state.loading && <div className="custom-loader-ui"><ProgressCircular indeterminate /></div>
    );
  }

  renderList(props = {}) {
    const { data, filter } = this.state;
    return (
        filter === 2 ?
          <ChronologicalView data={data} groupField="date" renderRow={(row, i) => this.renderRow(row, i)}/>
        :
        <div style={{ marginTop: 90, backgroundImage: 'none' }}>
          {
            data.map((row, i) => (
              <div key={i} className={
                  classNames(
                    'ax-list-item task-list-item task-list-item-border',
                    { 'offline': row.offline  },
                  )
                }
              >
                {this.renderRow(row, i)}
              </div>
            ))
          }
        </div>
    );
  }

  getTimeRange(start, end) {
    let text = ''
    if(start) {
        text = start;
        if(end) {
          text = `${text} - ${end}`;
        }
    }
    return text;
  }

  navigateToTask(task) {
    const { navigator } = this.props;
    navigator.pushPage(
      {
        component: TaskView,
        path: "TaskView_" + Date.now(),
        record: {...task},
        screen: 'plannedTask',
        navigator: this.props.navigator
      },
      { animation: "none" }
    );
  }

  renderRow(row, index) {
    return (
      <div onClick={() => this.navigateToTask(row.task)}>
        <Typo variant="title">{row.task && row.task.fullName}</Typo>
        <Typo variant="body">{row.project && row.project.full_name}</Typo>
        <Typo variant="body">{this.getTimeRange(row.startTime, row.endTime)}</Typo>
      </div>
    )
  }

  renderView() {
    const noOfBlock = 48;
    const height = noOfBlock * BLOCK_SIZE;
    const { planningList } = this.state;
    const Lines = ({ lines }) => (
      lines.map((line, i) => (
        line.startTime && line.endTime &&
        <PlanningLine style={this.getCardStyle(line)} key={i} line={line} />
      ))
    )
    return (
      <div className="timeline-container">
        <div className="timeline">
          <div className="header">
            <div className="header-time">
              <Translate text={`app.planning.timeBlockTitle`} />
            </div>
          </div>
          <div className="timeline-content" style={{ height }}>
            <div className="time-block">
              {
                BLOCK.map((b, i) => (
                  <span key={i} style={{ height: BLOCK_SIZE }}>{b}</span>
                ))
              }
            </div>
            <div className="line-block">
              <Lines lines={planningList} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  changeDate(e) {
    const filter = Number(e.target.value);
    this.setState({ filter });
    if(filter === 3) {

    } else {
      this.fetchData(filter);
    }
  }

  onKeywordChange = (e) => {
    this.setState({ keyword: e.target.value}, () => {
      this.fetchData();
    });
  }

  renderPullHookLoader(props = {}) {
    return (
      <div
        style={{ marginTop: 60 }}
        className="custom-hook-loader"
        {...props}
      >
          <ProgressCircular indeterminate />
      </div>
    );
  }

  renderPullHook() {
    const { hookState, loading } = this.state;
    let hookContent = null;
    if (hookState === 'action') {
      hookContent = this.renderPullHookLoader();
    }
    return (
      <PullHook
        disabled={loading}
        onChange={(e) => this.setState({ hookState: e.state })}
        onLoad={(done) => this.setState({ offset: 0 }, () => this.fetchData(this.state.filter, false).then(done))}
        fixedContent={true}
      >
        {hookContent}
      </PullHook>
    );
  }

  renderFixedContent() {
    const { keyword } = this.state;
    return(
      <React.Fragment>
        <div key="0" className="ax-searchbar">
          <Icon icon="fa-search" />
          <input
            placeholder={translate('app.planning.searchText')}
            value={keyword}
            onChange={this.onKeywordChange}
          />
        </div>
      </React.Fragment>
    )
  }

  onDateClick = (day) => {
    this.setState({ filter: 1, plannedDate: day }, () => {
      this.fetchData();
    });
  }

  onSwipeLeft() {
    return true;
  }

  onSwipeRight() {
    return true;
  }

  render() {
    const { plannedDate, filter } = this.state;
    return (
      <Page
        {...this.props}
        title={this.renderToolbar()}
        onInfiniteScroll={(done) => this.onLoadMore(done)}
        renderFixed={() => this.renderFixedContent()}
      >
        <div className="page-content timeline-page">
          <DateBar value={plannedDate} filter={this.state.filter} onChange={(e) => this.changeDate(e)} />
          {this.renderPullHook()}
          <SwiperViewContainer
            navigator={this.props.navigator}
            onSwipeLeft={() => this.onSwipeLeft()}
            onSwipeRight={() => this.onSwipeRight()}
          >
            {
              filter === 3 ?
                <div className="month-view">
                  <MonthView
                    onDateClick={this.onDateClick}
                  />
                </div>
              :
              <section id="page-list-gesture">
                {this.renderList()}
              </section>
            }
          </SwiperViewContainer>
          {this.renderListLoader()}
        </div>
      </Page>
    );
  }
}


TimelineView.propTypes = {
  navigator: PropTypes.any,
  route: PropTypes.any,
};

TimelineView = reduxConnect((state) => ({ app: state.app, user_data: state.user.data }))(TimelineView);

export default connect(TimelineView);

