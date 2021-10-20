import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { getSettings } from '@axelor/web-client';
import { REDUX_ACTIONS as ACTIONS } from '@axelor/web-client';
import * as ACTIONS2 from '../../redux/actions';
import Page from '../page';
import Translate from '../../locale';
import ons from 'onsenui';
import Logo from './logo.svg';
import './style.css';

class HomePage extends Component {
  constructor(props) {
    super(props);
    this.settings = getSettings()();
  }

  componentDidMount() {
    ons.ready(() => {
      let platform = 'Android';
      if (ons.platform.isIOS()) {
        platform = 'Ios';
      }
      this.props.setPlatform(platform);
      if (document.body.className.indexOf(`app_${platform}`) === -1) {
        document.body.className += ` app_${platform.toLowerCase()}`;
      }
      this.checkAuth();
      this.checkNetwork();
    });
  }

  checkNetwork() {
    if(navigator && navigator.connection && navigator.connection.type) {
      if (navigator.connection.type === 'none') {
        this.props.changeMode('offline');
      } else {
        this.props.changeMode('online');
      }
    }
  }

  checkAuth() {
    this.settings.init()
    .then((data) => {
      this.props.resetApp();
      if (this.settings.auth) {
        this.props.setLocale(this.settings.data.info['user.lang'] || 'en');
        this.props.updateSettings(true, this.settings.data)
      } else {
        this.props.updateSettings(false, {});
        this.props.navigator.resetPageStack([{ name: 'Login', payload: data }]);
      }
      if (ons.platform.isWebView()) {
        window.navigator.splashscreen.hide();
      }
    })
    .catch(err => console.log('err', err));
  }

  render() {
    return (
      <Page
        {...this.props}
        title={
          <div className='center adjust-center'>
            Axelor
          </div>
        }
        >
        <div className="home-content">
          <h1  style={{ textAlign: 'center', marginTop: 50, marginBottom: -10 }}>
            <Translate text="welcome" />
          </h1>
          <div className="home-img">
            <img src={Logo} alt="Axelor Logo" />
          </div>
        </div>
      </Page>
    );
  }
}

HomePage.propTypes = {
  navigator: PropTypes.any,
  route: PropTypes.any,
};

const mapPropsToState = (state) => ({ app: state.app, user: state.user });

const mapDispatchToState = (dispatch) => ({
  changeMode: (e) => dispatch(ACTIONS.setAppMode(e)),
  setPlatform: (e) => dispatch(ACTIONS.setPlatform(e)),
  setLocale: (e) => dispatch(ACTIONS2.setLocale(e)),
  resetApp: () => dispatch(ACTIONS2.resetApp()),
  updateSettings: (e, v) => dispatch(ACTIONS.setUserSettings(e, v)),
});

export default connect(mapPropsToState, mapDispatchToState)(HomePage);

