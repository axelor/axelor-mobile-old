import React, { Component } from 'react';

class TextArea extends Component {
  render() {
    const { className, onValueChange } = this.props;
    return (
        <div
            className={`text-field-container ${className}`}
        >
            <textarea
                className="textarea-text textarea textarea--transparent"
                placeholder={this.props.placeholder}
                rows={this.props.rows || 2 }
                onChange={(e) => onValueChange(e.target.value)}
                value={this.props.value || ''}
            >
            </textarea>
        </div>
    );
  }
}

export default TextArea;
