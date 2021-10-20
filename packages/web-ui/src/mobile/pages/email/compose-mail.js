import React from 'react';
import PropTypes from 'prop-types';
import { connect } from '@axelor/web-client';
import { connect as reduxConnect } from 'react-redux';
import Translate, { translate } from '../../locale';
import Page from '../page';
import { Toolbar, ToolbarButton, Icon, Modal, ProgressCircular } from 'react-onsenui';
import { CardView, EditorComponent } from '../../components';
import EmailNotification from './emailNotification';
import PageCommentList, { RenderManyToMany } from '../page-comment-list';
import ons from 'onsenui';
import './styles.css';
import ManyToMany from './../../components/ManyToManyAutoComplete';


const AttachmentList = ({ files, maxFiles, removeAttachment, platform }) => {

  let defaultIcon = '';
  let fileItems = [];
  if (platform !== 'Android') {
    fileItems = files;
  } else {
    fileItems = Array.prototype.slice.call(files).slice(0, maxFiles);
  }
  return (
    <div className="attachment-list-container">
      {
        fileItems.map((item, index) => {
          switch (item.file && item.file.type) {
            case 'image/png':
            case 'image/jpeg':
              defaultIcon = 'fa-image';
              break;
            case 'application/pdf':
              defaultIcon = 'file-pdf-o';
              break;
            default:
              defaultIcon = 'fa-file';
          }
          return <div className="attachment-list-item" key={index}>
            <span style={{ paddingBottom: 15 }}>
              <span style={{ backgroundColor: '#E8EDF0', padding: 5 }}>
                <Icon icon={defaultIcon} />
              </span>
              <span style={{ paddingLeft: 5 }}>{item.file && item.file.name}</span>
            </span>
            <span style={{ padding: '0 10px' }} onClick={() => removeAttachment(item)}>
              <Icon icon="fa-times" />
            </span>
          </div>
        })
      }
    </div>
  )
}

let uploadAttachment = 0;

class ComposeMail extends PageCommentList {
  constructor(props) {
    super(props);
    this.state = {
      user: {},
      message: {},
      sending: false,
      fields: [],
      edit: true,
      attachmentList: [],
      submitError: {
        title: null,
        content: null,
      },
      showErrorDialog: false,
    };
  }

  componentDidMount() {
    let { user, message } = this.props.route.data;
    let userId = this.props.user_data.data.info["user.id"];
    let { fetch } = this.props.user;
    fetch({ id: userId }, { "partner": ["emailAddress"] })
      .then(({ data }) => {
        let { fields } = this.props.message;
        if (user.email_address) {
          message = { ...message, toEmailAddressSet: [user.email_address] };
        }
        this.setState({ user, message: { ...message }, record: { ...message, }, fields });
      });
  }

  onBackButtonClick() {
    const { message, record, edit } = this.state;
    if (!edit) {
      this.props.navigator.popPage();
      return;
    }
    if (JSON.stringify(record) !== JSON.stringify(message)) {
      ons.notification.confirm(translate('Alert.confirmClose'), { title: translate('Alert.confirm'), id: "compose-email", buttonLabels: [translate('Alert.cancelButton'), translate('Alert.yesButton')] }).then(res => {
        if (res === 1) {
          this.props.navigator.popPage();
        }
      })
    } else {
      this.props.navigator.popPage();
    }
  }

  renderToolbar() {
    const { user } = this.props.route.data;
    return (
      <Toolbar noshadow modifier="transparent" style={{ background: '#fff' }}>
        <div className='left left-icon-width'>
          <ToolbarButton onClick={() => this.onBackButtonClick()} style={{ color: '#000' }}>
            <Icon icon='md-chevron-left' style={{ fontSize: '40px' }} />
          </ToolbarButton>
        </div>
        <div className='center left-align-title ellipse-toolbar' style={{ color: '#000' }}>
          <span onClick={() => this.onBackButtonClick()} style={{ display: "inline-block" }}>
            {user.full_name}
          </span>
        </div>
        <div className="right icons" style={{ paddingRight: "10px" }} >
          <div style={{ color: "rgba(44, 196,211,1)", marginRight: 10 }} className="round-icon" onClick={() => this.onSend()}>
            <Icon icon='fa-paper-plane' style={{ fontSize: '18px', paddingRight: '3px' }} />
          </div>
        </div>
      </Toolbar>
    );
  }

  onChange(name, value) {
    let { message } = this.state;
    message[name] = value;
    this.setState({ message });
  }

  onCreateEmail(name, value) {
    let { message } = this.state;
    const emails = message[name]
    emails.push(value);
    this.setState({ message });
  }

  uploadChunk(file, offset = 0) {
    let attachment = this.getAttchmentBlob(file);
    let { uploadFile } = this.props.message;
    const chunkSize = 100000;
    const end = (offset + chunkSize) < attachment.size ? (offset + chunkSize) : attachment.size;
    const blob = attachment.slice(offset, end);
    const headers = this.getHeaders(file, offset);
    uploadFile(blob, headers).then(res => {
      const { result } = res;
      if (result && result.id) {
        this.addToDMS(result);
      }
      else {
        if (offset < attachment.size) {
          if (result.fileId) {
            file.id = result.fileId;
          }
          this.uploadChunk(file, chunkSize + offset);
        }
      }
    })
  }

  getAttchmentBlob(file) {
    const { app } = this.props;
    if (app.platform !== 'Android') {
      return file.blob;
    }
    return file.file;
  }

  getHeaders(file, offset) {
    const attachment = file.file;
    const headers = {
      'X-File-Name': attachment.name,
      'X-File-Offset': offset,
      'X-File-Size': attachment.size,
      'X-File-Type': attachment.type,
    };
    if (file.id) {
      headers['X-File-Id'] = file.id;
    }
    return headers;
  }

  addToDMS(result) {
    const { dmsfile } = this.props;
    const payload = {
      fileName: result.fileName,
      metaFile: { id: result.id },
      relatedId: this.state.message.id,
      relatedModel: 'com.axelor.apps.message.db.Message'
    }
    dmsfile.add(payload)
      .then(res => {
        if (res.status === 0) {
          uploadAttachment--;
          if (uploadAttachment === 0) {
            this.sendMail();
          }
        }
      })
  }


  popPage() {
    this.props.route.navigator.popPage().then(res => {
      this.props.route.popPage();
    });
  }

  uploadAttachment() {
    let { attachmentList } = this.state;
    for (let i = 0; i < attachmentList.length; i++) {
      this.uploadChunk(attachmentList[i])
    }
  }

  sendMail() {
    let { message } = this.state;
    let { action, update, add } = this.props.message;

    const API = this.props.message && this.props.message.id !== undefined ? update(message)
      : add(message)
    API
      .then(res => {
        message = res.data[0];
        this.setState({ message, sending: true }, () => {
          if (this.state.message.toEmailAddressSet.length <= 0) {
            ons.notification.alert(translate('Message.alert.toEmailAddressSet'), { id: "email-address" }).then(res => {
              this.setState({ sending: false });
            });
          } else if (this.state.message.mailAccount === undefined || this.state.message.mailAccount === null) {
            ons.notification.alert(translate('Message.alert.mailAccount'), { id: "mail-account" }).then(res => {
              this.setState({ sending: false });
            });
          } else {
            action('action-message-method-send-message', {
              data: {
                context: {
                  ...message,
                  _model: 'com.axelor.apps.message.db.Message',
                  _signal: 'send',
                }
              },
              action: 'action-message-method-send-message',
              model: 'com.axelor.apps.message.db.Message',
            })
              .then(res => {
                if (res.status === 0) {
                  this.props.navigator.pushPage({
                    component: EmailNotification,
                    popPage: () => this.popPage(),
                    path: 'EmailNotification',
                    key: new Date(),
                    viewProps: this.props.route.viewProps,
                    data: {
                      message: res.data[0].flash,
                      user: this.props.route.data.user,
                    },
                    navigator: this.props.route.navigator
                  }, { animation: 'none' });
                }
                this.setState({ sending: false });
              });
          }
        });
      });
  }

  onSend() {
    let { attachmentList } = this.state;
    if (attachmentList.length > 0) {
      uploadAttachment = attachmentList.length;
      this.uploadAttachment()
    } else {
      this.sendMail();
    }
  }

  selectFile(files) {
    let attachmentList = this.state.attachmentList;
    if (this.props.app.platform !== 'Android') {
      attachmentList = attachmentList ? attachmentList.concat([...files]) : files;
    } else {
      attachmentList = attachmentList ? attachmentList.concat([...this.filesToItems(files)]) : this.filesToItems(files);
    }
    this.setState({ attachmentList });
  }

  filesToItems(files) {
    const chunkSize = 512 * 1024;
    const fileItems = Array.prototype.slice.call(files).slice(0, this.props.maxFiles);
    const items = fileItems.map((f, i) => {
      const chunkProgress = [];
      for (let j = 0; j <= f.size / chunkSize; j += 1) {
        chunkProgress.push(0);
      }
      return { file: f, index: i, progress: 0, cancelled: false, completed: false, chunkProgress, error: false, totalUploaded: 0 };
    });
    return items;
  }

  onNewCreateOption(e, targetField) {
    const { message } = this.state;
    let targetValue = message[targetField];
    const { add } = this.props.emailaddress

    add({ address: e })
      .then(res => {
        const { data } = res;
        targetValue.push(data[0]);
        this.setState({ message: { ...message, [targetField]: targetValue } })
      })
  }

  removeAttachment(file) {
    const { attachmentList } = this.state;
    let targetIndex = attachmentList.findIndex(item => JSON.stringify(item) === JSON.stringify(file))
    attachmentList.splice(targetIndex, 1)
    this.setState({ attachmentList })
  }

  render() {
    const { renderBottomToolbar } = this.props;
    let { message: { toEmailAddressSet, subject, content }, fields, sending } = this.state;
    const getField = (key) => {
      const field = fields.find(f => f.name === key) || {};
      return field.label ? translate(field.label) : '';
    }
    // const TextEditor = this.props.app.platform.toLowerCase() === 'ios' ? Editor : CoreEditor;;
    return (
      <Page
        {...this.props}
        renderToolbar={() => this.renderToolbar()}
        renderBottomToolbar={renderBottomToolbar}
        renderModal={sending && (
          <Modal className="auth-modal" isOpen={sending}>
            <ProgressCircular indeterminate />
          </Modal>
        )}
      >
        <section style={{ margin: 12 }}>
          <div className="mail">
            <div className="mail-progress">
              <div className="progress-button active"><span>1</span></div>
              <div className="connector"><hr /></div>
              <div className="progress-button active"><span>2</span></div>
            </div>
            <div className="mail-text">
              <Translate text="common.email.write" /> !
            </div>
          </div>
          <div>
            <CardView principalView>
              <div style={{ padding: "10px" }}>
                {
                  this.props.app.platform !== 'Android' ?
                    <div>
                      <RenderManyToMany
                        name="toEmailAddressSet"
                        fieldLabel={translate('Message.toEmailAddressSet')}
                        placeholder="Select ..."
                        targetName="name"
                        displayField="name"
                        value={toEmailAddressSet || null}
                        searchAPI={(e) => this.props.emailaddress.searchAll(e)}
                        onChange={(e) => this.onChange('toEmailAddressSet', e.target.value)}
                        edit={this.state.edit}
                        navigator={this.props.navigator}
                        isCreatable={true}
                        onNewCreateOption={(e) => this.onNewCreateOption(e, 'toEmailAddressSet')}
                      />
                    </div>
                    :
                    <div>
                      <ManyToMany
                        name="toEmailAddressSet"
                        fieldLabel={translate('Message.toEmailAddressSet')}
                        placeholder="Select ..."
                        searchAPI={(e) => this.props.emailaddress.searchAll(e)}
                        createNewOption={this.props.emailaddress}
                        value={toEmailAddressSet || null}
                        onCreateEmail={(data) => this.onCreateEmail('toEmailAddressSet', data[0])}
                        onChange={(e) => this.onChange('toEmailAddressSet', e)}
                        labelKey="name"
                        valueKey="id"
                      />

                    </div>
                }
              </div>
            </CardView>
            <CardView>
              <CardView.InputField
                edit={this.state.edit}
                title={translate('Message.subject')}
                onChange={(e) => this.onChange("subject", e.target.value)}
                value={subject || ''} placeholder={getField('subject')}
                icon="paperclip"
                platform={this.props.app.platform}
                onSelectFile={(e) => this.selectFile(e)}
              />

              <AttachmentList
                files={this.state.attachmentList}
                maxFiles={this.props.maxFiles}
                removeAttachment={(e) => this.removeAttachment(e)}
                platform={this.props.app.platform}
              />
              <EditorComponent
                content={content}
                onContentChange={(e) => this.setState({ message: { ...this.state.message, content: e } })}
                style={{ minHeight:500 }}
             />
              {/* <TextEditor
                placeholder={`${translate("common.email.messagePlaceholder")}...`}
                name="content"
                value={content || ''}
                onChange={(e) => this.onChange('content', e.target.value)}
              /> */}
              {/* <EmailEditor
                placeholder={`${translate("common.email.messagePlaceholder")}...`}
                value={content || ''}
                name="content"
                onChange={(e) => this.onChange('content', e.target.value)}
              /> */}
            </CardView>
          </div>

          <div className="mail-footer">
            <button onClick={() => this.onSend()} className="button save-customer-button send-mail">
              <Translate text='common.email.send' />
            </button>
          </div>
        </section>
      </Page>
    );
  }
}

ComposeMail.propTypes = {
  navigator: PropTypes.any,
  route: PropTypes.any,
};

const mapPropsToState = (state) => ({ app: state.app, user_data: state.user });
ComposeMail = reduxConnect(mapPropsToState)(ComposeMail);

const mapConnectToProps = (props) => {
  const { refs: { emailaddress, user, emailaccount, dmsfile }, ...message } = props;
  return { message, emailaddress, user, emailaccount, dmsfile };
}

const mapConnectConfig = {
  name: 'Message',
  refs: [{
    model: 'EmailAddress', field: ''
  }, {
    model: 'User', field: ''
  }, {
    model: 'EmailAccount', field: 'mailAccount'
  }, {
    model: 'DMSFile', field: ''
  }
  ],
};
export default connect(mapConnectToProps)(ComposeMail, mapConnectConfig);
