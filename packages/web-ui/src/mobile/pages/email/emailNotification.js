import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Toolbar, ToolbarButton, Icon } from 'react-onsenui';
import Page from '../page';

class EmailNotification extends Component {

  componentDidMount() {
    setTimeout(() => this.redirectToView(), 1000);
  }

  redirectToView() {
    this.props.route.navigator.popPage().then(res => {
      this.props.route.popPage();
    })
  }

  renderToolbar() {
    const { user } = this.props.route.data;
    return (
      <Toolbar style={{ background: '#fff' }}>
        <div className='left left-icon-width'>
          <ToolbarButton onClick={() => this.props.navigator.popPage()} style={{ color: '#000' }}>
            <Icon icon='md-arrow-left' />
          </ToolbarButton>
        </div>
        <div className='center ellipse-toolbar left-align-title' style={{ color: '#000' }}>{user.full_name}</div>
        <div className="right mail"></div>
      </Toolbar>
    );
  }

  render() {
    const { renderBottomToolbar } = this.props;
    const { message } = this.props.route.data;
    return (
      <Page
        {...this.props}
        renderToolbar={() => this.renderToolbar()}
        renderBottomToolbar={renderBottomToolbar}
      >
        <section className="notification-section">
          <div className="notification-message">{message} !</div>
        </section>
      </Page>
    );
  }

}

EmailNotification.propTypes = {
  navigator: PropTypes.any,
  route: PropTypes.any,
};

export default EmailNotification;
