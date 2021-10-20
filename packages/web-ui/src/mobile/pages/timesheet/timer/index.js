import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Page from '../../page';
import classNames from 'classnames';
import * as ACTIONS from '../../../redux/actions';
import { ToolbarButton, Toolbar, Icon } from 'react-onsenui';
import AddTimesheet from '../view';
import Translate from '../../../locale';
import './index.css';

class TimesheetTimer extends Component {

  componentDidMount() {
    const { status } = this.props.timer;
    const { start_timer = false } = this.props.route;
    if (start_timer && !status) {
      this.props.startTimer();
    }
  }

  compoentnWillUnmount() {
    this.clearTimer();
  }

  pauseTimer() {
    this.props.pauseTimer();
    if (this.props.route.start_timer) {
      this.props.navigator.popPage();
    }
  }

  stopTimer() {
    const { interval, interval_str } = this.props.timer;
    this.props.navigator.pushPage({
      component: AddTimesheet,
      path: 'add_timesheet',
      data: {
        interval,
        interval_str,
      },
    }, { animation: 'none' });
    setTimeout(() => {
      this.props.stopTimer();
    }, 500);
  }

  renderToolbar(title) {
    const isPop = this.props.route.start_timer;
    return (
      <Toolbar noshadow modifier="transparent">
        <div className='left'>
          <ToolbarButton onClick={() => isPop ? this.props.navigator.popPage() : this.props.showModal('apps')}>
            <Icon icon={isPop ? 'md-arrow-left' : 'fa-th-large'} />
          </ToolbarButton>
        </div>
        <div className='center'>
          <Translate text="app.timesheet.menu.timer" />
        </div>
      </Toolbar>
    );
  }

  render() {
    const { interval, interval_str, status } = this.props.timer;
    return (
      <Page
        {...this.props}
        renderToolbar={() => this.renderToolbar()}
      >
        <div className="timer page-content">
          <div className="timer-interval">
            <span>{interval_str}</span>
          </div>
          <div className={classNames('timer-actions', { resume: !status && interval })}>
            {
              status ?
              [
                <div key="pause" className="pause" onClick={() => this.pauseTimer()}>
                  <i className="fa fa-pause"></i>
                  <Translate text="app.timesheet.timer.pause" />
                </div>,
                <div key="stop" className="stop" onClick={() => this.stopTimer()}>
                  <Translate text="app.timesheet.timer.stop" />
                  <i className="fa fa-stop"></i>
                </div>,
              ] :
                <div className="start" onClick={() => this.props.startTimer()}>
                  {
                    interval ?
                    <Translate text="app.timesheet.timer.resume" /> :
                    <Translate text="app.timesheet.timer.start" />
                  }
                  <i className="fa fa-play"></i>
                </div>
            }
          </div>
        </div>
      </Page>
    );
  }
}

TimesheetTimer.propTypes = {
  navigator: PropTypes.any,
  route: PropTypes.any,
};

const mapStateToProps = ({ timer }) => ({ timer });
const mapDispatchToProps = (dispatch) => ({
  showModal: (e) => dispatch(ACTIONS.showModal(e)),
  setTimer: (e) => dispatch(ACTIONS.startTimer(e)),
  startTimer: () => dispatch(ACTIONS.startTimer()),
  resumeTimer: () => dispatch(ACTIONS.resumeTimer()),
  pauseTimer: () => dispatch(ACTIONS.pauseTimer()),
  stopTimer: () => dispatch(ACTIONS.stopTimer()),
});

export default connect(mapStateToProps, mapDispatchToProps)(TimesheetTimer);
