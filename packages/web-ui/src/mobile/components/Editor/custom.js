import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { findDOMNode } from 'react-dom';
import './custom.style.css';
import ons from 'onsenui';

export class EditableDiv extends Component {
  constructor(props) {
    super(props);
    this.state = {
      html: props.value,
      showToolbar: false,
    }
    this.emitChange = this.emitChange.bind(this);
    this.styleElement = null;
  }

	emitChange() {
    const { name } = this.props;
		const editor = findDOMNode(this._editor),
			newHtml = editor.innerHTML;

		this.setState({html: newHtml}, () => {
			this.props.onChange({
				target: {
          name,
					value: newHtml
				}
			});
		});
	}

  componentDidMount() {
    ons.ready(() => {
      if (ons.platform.isIOS() || ons.platform.isAndroid()) {
        const elHead = document.getElementsByTagName('head')[0];
        const elStyle = document.createElement('style');
        elStyle.type= 'text/css';
        elHead.appendChild( elStyle );
        elStyle.innerHTML = `* {
          user-select: inherit !important;
          -webkit-user-select: inherit !important;
          -moz-user-select: inherit !important;
          -ms-user-select: inherit !important;
        }`;
        this.styleElement = elStyle;
      }
    });
  }

  componentWillUnmount() {
    if (this.styleElement) {
      const elHead = document.getElementsByTagName('head')[0];
      elHead.removeChild(this.styleElement);
      this.styleElement = null;
    }
  }

	componentWillReceiveProps(nextProps) {
		this.setState({
			html: nextProps.value
		});
	}

	shouldComponentUpdate(nextProps, nextState) {
      return nextProps.value !== this.state.html || nextState.showToolbar !== this.state.showToolbar;
  }

  execCommand(command, arg) {
    document.execCommand(command, false, arg);
  }

	render() {
		return (
      React.createElement("div", null,
				React.createElement("div", Object.assign({
            ref: (e) => this._editor = e,
            className: "custom-editor"
          },
          this.props,
          {
            contentEditable: "true",
            dangerouslySetInnerHTML: {__html: this.state.html},
            onInput: this.emitChange
          }
        )),
				React.createElement("div", { className: 'toolbar-container' },
					React.createElement("div", {className: "toolbar-group" },
						React.createElement("select", { onChange: (e) => {
              this.execCommand('formatBlock', e.target.value);
            }},
              React.createElement("option", { value: 'P' },
                "Paragraph"
              ),
              React.createElement("option", { value: 'BLOCKQUOTE'},
                "Block Quote"
              ),
              React.createElement("option", { value: 'H1'},
                "Header 1"
              ),
              React.createElement("option", { value: 'H2'},
                "Header 2"
              ),
              React.createElement("option", { value: 'H3'},
                "Header 3"
              ),
              React.createElement("option", { value: 'H4'},
                "Header 4"
              ),
              React.createElement("option", { value: 'H5'},
                "Header 5"
              ),
              React.createElement("option", { value: 'H6'},
                "Header 6"
              )
						)
					),

					React.createElement("div", {className: "toolbar-group", role: "group"},
						React.createElement("button", {type: "button", className: "toolbar-btn", onClick: this.execCommand.bind(this, 'bold')},
							React.createElement("i", {className: "fa fa-bold"})
						),
						React.createElement("button", {type: "button", className: "toolbar-btn", onClick: this.execCommand.bind(this, 'italic')},
							React.createElement("i", {className: "fa fa-italic"})
						),
						React.createElement("button", {type: "button", className: "toolbar-btn", onClick: this.execCommand.bind(this, 'underline')},
							React.createElement("i", {className: "fa fa-underline"})
						),
						React.createElement("button", {type: "button", className: "toolbar-btn", onClick: this.execCommand.bind(this, 'strikeThrough')},
							React.createElement("i", {className: "fa fa-strikethrough"})
						),
					),

					React.createElement("div", {className: "toolbar-group", role: "group"},
						React.createElement("button", {type: "button", className: "toolbar-btn", onClick: this.execCommand.bind(this, 'insertOrderedList')},
							React.createElement("i", {className: "fa fa-list-ol"})
						),
						React.createElement("button", {type: "button", className: "toolbar-btn", onClick: this.execCommand.bind(this, 'insertUnorderedList')},
							React.createElement("i", {className: "fa fa-list-ul"})
						)
          ),
          React.createElement("div", {className: "toolbar-group", role: "group"},
            React.createElement("button", {
              type: "button",
              className: "toolbar-btn",
              onClick: this.execCommand.bind(this, 'removeFormat')},
              React.createElement("i", {className: "fa fa-eraser"})
            )
          ),
				),
			)
		);
	}
}

EditableDiv.propTypes = {
  name: PropTypes.string.isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired
};

export default EditableDiv;
