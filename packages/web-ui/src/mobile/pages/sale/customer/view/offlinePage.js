import React, { Component } from 'react';
import Page from '../../../page';
import { CardView } from '../../../../components';
import './index.css'
import { translate } from '../../../../locale';
import { Toolbar, ToolbarButton, Icon } from 'react-onsenui';

class OffLinePage extends Component {

  renderToolbar() {
    return (
      <Toolbar noshadow modifier="transparent">
        <div className="left left-icon-width">
          <ToolbarButton onClick={() => this.props.navigator.popPage()}>
            <Icon icon="chevron-left" />
          </ToolbarButton>
        </div>
      </Toolbar>
    )
  }

  render() {
    return (
      <Page
        renderToolbar={() => this.renderToolbar()}
        {...this.props}>
        <CardView className="offline-card-view">
          <div className="offline-msg-header">
            {translate('offline_mode_header_first')}
            <br />
            {translate('offline_mode_header_second')}
            <div className="offline-msg-footer">
              {translate('offline_mode_footer')}
            </div>
          </div>
        </CardView>
      </Page>
    )
  }
}
export default OffLinePage;

