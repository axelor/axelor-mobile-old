import React, { Component } from 'react';

class StaticSelect extends Component {
  render() {
    const { title, className, onValueChange, optionList,selectStyle } = this.props;
    return (
        <div className={`text-field-container ${className}`}>
            <div className="field-title" style={{display: !title && 'none'}}>{title}</div>
            <div className="field-input" style={{width: !title && '100%'}}>
                <select
                    disabled={this.props.disabled}
                    style={{...selectStyle}}
                    className="select-input-field select-input select-input--underbar"
                    required
                    value={this.props.value}
                    onChange={(e) => onValueChange(e.target.value)}
                >
                    {
                        optionList.map((option, index) => (
                            <option key={index} value={option.value} >{option.text}</option>
                        ))
                    }
                </select>
            </div>
        </div>
    );
  }
}

export default StaticSelect;
