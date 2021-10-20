import React, { Component } from 'react';

class CheckBoxInput extends Component {
  render() {
    const { title, className, onValueChange } = this.props;

    return (
        <div className={`checkbox-container ${className}`}>
            <label className="checkbox checkbox--material">
                <input
                    type="checkbox"
                    className="check checkbox__input checkbox--material__input"
                    checked={this.props.value || ''}
                    onChange={(e) => onValueChange(e.target.checked)}
                />
                <div className="checkbox__checkmark checkbox--material__checkmark"></div>
                <span style={{ marginLeft: '10px'}}> { title } </span>
            </label>
        </div>
    );
  }
}

export default CheckBoxInput;
