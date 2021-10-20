import React, { Component } from 'react';

class SubmitButton extends Component {
  render() {
    const { title, className } = this.props;
    return (
        <div style={{...this.props.style}} className={`save-button-container ${className}`}>
            <button
                className="button save-button"
                style={{ ...this.props.buttonStyle }}
                onClick={(e) => this.props.onClick(e)}
            >
                {title}
            </button>
        </div>
    );
  }
}

export default SubmitButton;
