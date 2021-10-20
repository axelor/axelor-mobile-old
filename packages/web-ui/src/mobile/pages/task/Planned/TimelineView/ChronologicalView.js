import React from 'react';
import moment from 'moment';
import classNames from 'classnames';

const getChronologicalData = (data = [], groupField) => {
  const list = [];
  let date = '';
  let item = {};
  data.forEach(element => {
    if(element[groupField] !== date) {
      if(item[groupField]) {
        list.push({...item});
      }
      item = { [groupField]: element[groupField], data: []};
      item.data.push({...element});
      date = element[groupField];
    } else {
      item.data.push({...element});
    }
  });
  if(item[groupField]) {
    list.push({...item});
  }

  return list;
}

const ChronologicalView = ({ data, renderRow, groupField, onClick }) => {
  const list = getChronologicalData(data, groupField);
  return (
    <div style={{  backgroundImage: 'none', marginTop:10 }}>
      {
        list.map((element, index) => (
          <div key={index}>
            <span className="chronological-tag">{moment(element[groupField]).format("DD MMM")}</span>
            {
              element.data.map((row, i) => (
                <div
                  key={i}
                  className={
                    classNames(
                      'ax-list-item task-list-item',
                      { 'offline': row.offline  },
                      { 'task-list-item-border': element.data.length !== (i+1)}
                    )
                  }
                  onClick={() => onClick && onClick(row, index)}
                >
                  {renderRow(row, i)}
                </div>
              ))
            }
          </div>
        ))
      }
    </div>
  );
}

export default ChronologicalView;
