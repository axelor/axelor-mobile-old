import React, { Component } from 'react';
import { Icon } from 'react-onsenui';
import classNames from 'classnames';
import './index.css';

class RadioButton extends Component {

  render() {
    const { checked, radioButtonSize } = this.props;
    return (
        <div className={classNames(`radio-button-container ${this.props.className}`)} onClick={() => this.props.onClick(true)}>
          <span>
            <Icon
              icon={`${checked ? 'fa-check-circle' :'fa-circle'}`}
              style={{ color: `${checked ? '#3AC2D1' : '#ddd'}`, fontSize: `${radioButtonSize}px`}} />
          </span>
          <span className="radio-label">{this.props.label}</span>
        </div>
    );
  }
}

export default RadioButton;
