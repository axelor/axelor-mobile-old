import React from 'react';
import classNames from 'classnames';
import { connect } from 'react-redux';
import Translate from './../locale';

const TimerBox = ({ timer, onStart }) => {
  const { interval, interval_str, status } = timer;
  return (
    <div className={classNames('ts-timer-block', { init: !timer.interval, pause: !!interval && !status, running: status })}>
      <div>
      </div>
      <div className="counter">
        {interval_str !== '00:00:00' && interval_str}
      </div>
      <div className="start" onClick={() => onStart()}>
        <Translate text={`app.timesheet.timer.${status ? 'go' : 'start'}`} />
        {
          status ?
          <i className="fa fa-clock-o"></i> :
          <i className="fa fa-play"></i>
        }
      </div>
    </div>
  );
}

const mapStateToProps = ({ timer }) => ({ timer });

export default connect(mapStateToProps)(TimerBox);
