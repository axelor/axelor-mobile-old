import React, { Component } from 'react';
import classNames from 'classnames';

class TextInput extends Component {

  constructor(props) {
    super(props);
    this.state = {
      isValid: true,
    }
  }

  render() {
    const { placeholder, className, onValueChange, type, required, preventLetter } = this.props;
    const { isValid } = this.state;
    return (
        <div className={classNames(`text-field-container ${className}`, { 'highlight-error': !isValid})}>
            {
              placeholder &&
              <div className="field-title">{placeholder}</div>
            }
            <div className="field-input">
                <input
                    className="field-text-input text-input"
                    type={type || 'text'}
                    required={this.props.required}
                    value={this.props.value || ''}
                    readOnly={this.props.readOnly}
                    onKeyPress={(evt) => {
                      if (preventLetter) {
                        if ((evt.which > 64 && evt.which < 91) || (evt.which > 96 && evt.which < 123))
                        {
                            evt.preventDefault();
                        }
                      }
                    }}
                    onChange={(e) => {
                      let { isValid } = this.state;
                      if (required) {
                        isValid = e.target.value === '' ? false : true;
                        this.setState({ isValid });
                      }
                      onValueChange(e.target.value)
                    }}
                />
            </div>
        </div>
    );
  }
}

export default TextInput;
