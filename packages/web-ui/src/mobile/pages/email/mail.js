import React, { Component } from 'react';
import { connect } from '@axelor/web-client';
import PropTypes from 'prop-types';
import { connect as reduxConnect } from 'react-redux';
import Page from '../page';
import Translate, { translate } from '../../locale';
import { Toolbar, ToolbarButton, Icon, List, ListItem, Modal, ProgressCircular } from 'react-onsenui';
import ComposeMail from './compose-mail';
import './styles.css';

class MailPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data: [],
      loading: false,
      contextData: {}
    };
  }

  componentDidMount() {
    let { search } = this.props.template;
    this.setState({ loading: true, contextData: this.props.route.data.contextData });
    search({ model: this.props.route.data.contextData.model, language: this.props.user_data.data.info["user.lang"] === "en" ? { id: 1 } : { id: 2 } })
      .then(res => {
        this.setState({ data: res.data, loading: false });
      });

  }

  composeMail(template) {
    const { data } = this.props.route;
    const { contextData } = this.state;
    const { action } = contextData.prop;
    action('action-generate-message-method-generate-message', {
      data: {
        context: {
          language: this.props.user_data.data.info["user.lang"] === "en" ? { id: 1 } : { id: 2 },
          _objectId: this.props.route.data.user.id.toString(),
          _tag: contextData.tag,
          _signal: "validate",
          _model: "com.axelor.apps.base.db.Wizard",
          _templateContextModel: contextData.templateContextModel,
          _xTemplate: template ? {
            ...template
          } : null
        }
      },
      model: "com.axelor.apps.base.db.Wizard",
      action: "action-generate-message-method-generate-message"
    })
      .then((result) => {
        let { fetch } = this.props.message;
        fetch({ id: result.data[0].view.context._showRecord })
          .then(res => {
            this.props.navigator.pushPage({
              component: ComposeMail,
              popPage: () => this.props.navigator.popPage(),
              viewProps: this.props.route.viewProps,
              data: {
                message: res.data[0],
                ...data
              },
              navigator: this.props.navigator,
            }, { animation: 'none' });
          })
          .catch(err => console.log(err));
      })
      .catch(err => console.log(err));
  }

  renderToolbar() {
    const { user } = this.props.route.data;
    return (
      <Toolbar noshadow modifier="transparent" style={{ background: '#fff' }}>
        <div className='left left-icon-width'>
          <ToolbarButton onClick={() => this.props.navigator.popPage()} style={{ color: '#000' }}>
            <Icon icon='md-chevron-left' style={{ fontSize: '40px' }} />
          </ToolbarButton>
        </div>
        <div className='center ellipse-toolbar left-align-title' style={{ color: '#000' }}>
          <span onClick={() => this.props.navigator.popPage()} style={{ display: "inline-block" }}>
            {user.full_name}
          </span>
        </div>
        <div className="right mail"></div>
      </Toolbar>
    );
  }

  renderModel(row, index) {
    return (
      <ListItem
        style={{ paddingLeft: 0 }}
        key={index}
      >
        <div className="model-list">
          <span style={{ fontSize: '17px' }}>{row.name}</span>
          <span onClick={() => this.composeMail(row)} className="mail-select-btn"> {translate('Message.select')} </span>
        </div>
      </ListItem>
    );
  }

  render() {
    const { data, loading } = this.state;
    const { renderBottomToolbar } = this.props;
    return (
      <Page
        {...this.props}
        renderToolbar={() => this.renderToolbar()}
        renderBottomToolbar={renderBottomToolbar}
        renderModal={loading && (
          <Modal className="auth-modal" isOpen={loading}>
            <ProgressCircular indeterminate />
          </Modal>
        )}
      >
        <section style={{ margin: 35 }}>
          <div className="mail">
            <div className="mail-progress">
              <div className="progress-button active"><span>1</span></div>
              <div className="connector"><hr /></div>
              <div className="progress-button not-active"><span>2</span></div>
            </div>
            <div className="mail-text">
              <Translate text="common.email.selectModel" />
            </div>
          </div>
          <List
            dataSource={data}
            renderRow={(e, i) => this.renderModel(e, i)}
          />
        </section>
      </Page>
    );
  }
}

MailPage.propTypes = {
  navigator: PropTypes.any,
  route: PropTypes.any,
};

const mapPropsToState = (state) => ({ app: state.app, user_data: state.user });
MailPage = reduxConnect(mapPropsToState)(MailPage);
export const MailPageComponent = MailPage;

const mapConnectToProps = (props) => {
  const { refs: { message }, ...template } = props;
  return { template, message };
}

const mapConnectConfig = {
  name: 'EmailTemplate',
  refs: [{
    model: 'Message', field: '',
  }],
};
export default connect(mapConnectToProps)(MailPage, mapConnectConfig);
