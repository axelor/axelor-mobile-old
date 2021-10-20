import React from 'react';
import moment from 'moment';
import classNames from 'classnames';

import { CardView } from './../../../../components';

const isRunning = (line) => {
  let flag = false;
  if(moment(line.date).isSame(new Date(), 'day')){
    const current = moment();
    const start = moment(line.startTime, "HH:mm");
    const end = moment(line.endTime, "HH:mm");
    if(current.isSameOrAfter(start) && current.isSameOrBefore(end)) {
      flag = true;
    }
  }
  return flag;
}

const PlanningLine = ({ line, style }) => {
  const isCurrent = isRunning(line);
  return (
  <CardView
    style={{...style}}
    className={classNames('line-card', { 'current-planning-card': isCurrent })}
  >
    <div className="planning-line-info">
      <div className={
          classNames('planning-line-primary', { 'current-planning-primary': isCurrent })
        }
      >
        {line.task && line.task.fullName}
      </div>
      <div className="planning-line-secondary">{moment(line.date).format("DD MMMM YYYY")}</div>
      <div className="planning-line-secondary">{line.project && line.project.full_name}</div>
    </div>
  </CardView>
)};

export default PlanningLine;
