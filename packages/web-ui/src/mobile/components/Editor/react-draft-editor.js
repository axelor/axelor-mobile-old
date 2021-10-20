import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { EditorState, convertToRaw, ContentState } from 'draft-js';
import { Editor } from 'react-draft-wysiwyg';
import draftToHtml from 'draftjs-to-html';
import htmlToDraft from 'html-to-draftjs';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
import './react-draft.css';

class EditorComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      editorState: EditorState.createEmpty(),
      content: props.content,
    };
    this.setContent = this.setContent.bind(this);
    this.getContent = this.getContent.bind(this);
  }

  componentDidMount() {
    this.setContent(this.props.content);
  }

  componentWillReceiveProps(nextProps) {
    if (this.state.content !== nextProps.content && nextProps.content) {
      this.setContent(nextProps.content);
    }
  }

  setContent(html) {
    if (!html) return null;
    const blocksFromHtml = htmlToDraft(html);
    const { contentBlocks, entityMap } = blocksFromHtml;
    const contentState = ContentState.createFromBlockArray(contentBlocks, entityMap);
    const editorState = EditorState.createWithContent(contentState);
    this.setState({ editorState });
  }

  getContent({ editorState } = this.state) {
    const html = draftToHtml(convertToRaw(editorState.getCurrentContent()));
    return html;
  }

  render() {
    const { onContentChange, ...rest } = this.props;
    const { editorState } = this.state;
    return (
      <div {...rest}>
        <Editor
          editorState={editorState}
          wrapperClassName="ax-base-draft-editor-wrapper"
          editorClassName="ax-base-draft-editor"
          onEditorStateChange={e => this.setState({ editorState: e, content: this.getContent({ editorState: e }) }, () => {
            onContentChange(this.state.content);
          })}
          toolbar={{
            options: ['inline', 'blockType', 'fontSize', 'fontFamily','list'],
            inline: {
              options: ['bold', 'italic', 'underline', 'strikethrough', 'monospace'],
              bold: { className: 'bordered-option-classname' },
              italic: { className: 'bordered-option-classname' },
              underline: { className: 'bordered-option-classname' },
              strikethrough: { className: 'bordered-option-classname' },
              code: { className: 'bordered-option-classname' },
            },
            list: {
              unordered: { className: 'demo-option-custom' },
              ordered: { className: 'demo-option-custom' },
              indent: { className: 'demo-option-custom' },
              outdent: { className: 'demo-option-custom' },
            },
            blockType: {
              className: 'bordered-option-classname',
            },
            fontSize: {
              className: 'bordered-option-classname',
            },
            fontFamily: {
              className: 'bordered-option-classname',
            },
          }}
          style={{...rest.style}}
        />
      </div>
    );
  }
}

EditorComponent.propTypes = {
  onContentChange: PropTypes.func.isRequired,
};


export default EditorComponent;

