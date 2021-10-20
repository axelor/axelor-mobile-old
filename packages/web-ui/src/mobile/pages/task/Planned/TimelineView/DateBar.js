import React from 'react';
import { Icon } from 'react-onsenui';
import moment from 'moment';
import { filter as DateFilter} from './filterConstant';
import { translate } from '../../../../locale';

const getDateOnFormat = (filter, value) => {
  let text = moment(value).format("DD MMM");
  if(filter === 2) {
    text = moment().startOf("isoWeek").format("DD MMMM");
  }
  if(filter === 3) {
    text = moment().format("MMMM");
  }
  return text;
}

const DateBar = ({ onChange, value, filter }) => (
  <div className="datebar-container">
    <div className="bar-date">
      <span>
        {
          getDateOnFormat(filter, value)
        }
      </span>
    </div>
    <select
      className="select-filter"
      onChange={onChange}
      value={filter}
    >
      {
        DateFilter.map((filter, i) => (
          <option key={i} value={filter.value}>{translate(`app.planning.${filter.name}`)}</option>
          ))
      }
    </select>
    <Icon className="bar-icon" icon="fa-chevron-down" />
  </div>
);

export default DateBar;
