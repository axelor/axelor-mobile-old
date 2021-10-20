import React from 'react';
import { Icon } from 'react-onsenui';

export const ManyToManyChipItem = ({ value, onDelete }) => (
  <div className="m2m-chip-item" style={{display: 'flex',alignItems: 'center'}}>
    <span> {value} </span>

    {
      onDelete &&
      <span className="remove" onClick={onDelete}>
        <Icon icon="fa-remove" />
      </span>
    }
  </div>
)

export default ManyToManyChipItem;
