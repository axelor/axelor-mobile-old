import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ons from 'onsenui';
import { notification } from 'onsenui';
import { connect } from 'react-redux';
import { getSettings, connect as connectClient } from '@axelor/web-client';
import { REDUX_ACTIONS as ACTIONS } from '@axelor/web-client';
import * as PAGE_ACTIONS from '../../redux/actions';
import { setApps, apps } from '../../apps';
import { Page, Modal, Input, Button, ProgressCircular } from 'react-onsenui';
import { CRMContactModel, CRMCustomerModel, CRMLeadModel } from '../crm/connect';
import { SaleContactModel, SaleCustomerModel, SaleProductModel } from '../sale/connect';
import './style.css';

class LoginPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loader: false,
      data: {},
    };
    this.settings = getSettings()();
  }

  handleOnChange({ target }) {
    const { data } = this.state;
    data[target.name] = target.value;
    this.setState({ data });
  }

  componentDidMount() {
    const { url, username, password } = this.props.route.payload;
    this.setState({
      data: { url, username, password },
    });
    this.props.changeMode('online');
  }

  setLoaderVisibility(loader = false) {
    this.setState({ loader });
  }

  showAlert(title, msg) {
    ons.ready(() => {
        notification.alert(msg, { title });
    });
  }

  handleSubmit(e) {
    const { url, username, password } = this.state.data;
    let info = {};
    let appSets = {};
    let appConfigs = {};

    this.setState({ loader: true }, () => {
      this.props.login(url, username, password)
      .then((res) => {
        const csrfToken = res.headers.get('X-CSRF-Token') || res.headers.get('x-csrf-token');
        if (res.status === 200) {
          this.settings.save({ url, username, password, csrfToken })
          .then(() => this.props.app())
          .then((x) => {
            appConfigs = x.apps || {};
            appSets = x.sets || {};
            if (!appConfigs.isAppMobileEnable) {
              this.showAlert('Mobile App', `Mobile module is not installed on server, this app can't work`);
              return Promise.reject();
            }
          })
          .then(() => this.props.info())
          .then((res) => res.json())
          .then((e) => {
            info = e;
            return this.props.user.fetch({ id: info['user.id'] }, {"activeCompany": ["currency","partner"] })
            .then((res) => {
              const appPermissions = (res.data[0].appPermissions || '').split(',').filter(x => x).map(x => x.trim());
              let enableApps = apps.map((app, i) => {
                const isEnable = appConfigs[app.configKey] && appPermissions.indexOf(app.userConfigKey) > -1;
                return { isEnable, app };
              });
              if (!enableApps[this.props.apps.active] || !enableApps[this.props.apps.active].isEnable) {
                const enableAppIndex = enableApps.findIndex(x => x.isEnable);
                this.props.selectAppByIndex(enableAppIndex);
              }
              enableApps = enableApps.filter(x => x.isEnable).map(x => x.app);
              if (enableApps.length === 0) {
                this.settings.save({ url, username, password: '' })
                this.showAlert('Mobile App', `No Apps are allowed for ${username}`);
                return Promise.reject();
              }
              setApps(enableApps.map(x => x.userConfigKey));
              info['email'] = res.data[0].email;
              info['active_company'] = res.data[0].active_company;
              info['active_team'] = res.data[0].active_team;
              info['employee'] = res.data[0].employee;
            });
          })
          .then(() => {
            const linkModels = {
              partnerSet: [
                { name: 'CRMCustomer', connect: connectClient((e) => e, false)(null, CRMCustomerModel) },
                { name: 'SaleCustomer', connect: connectClient((e) => e, false)(null, SaleCustomerModel) },
              ],
              partnerContactSet: [
                { name: 'CRMContact', connect: connectClient((e) => e, false)(null, CRMContactModel) },
                { name: 'SaleContact', connect: connectClient((e) => e, false)(null, SaleContactModel) },
              ],
              projectSet: [
                { name: 'Project', connect: connectClient((e) => e, false)(null, { name: 'Project' }) },
              ],
              leadSet: [
                { name: 'Lead', connect: connectClient((e) => e, false)(null, CRMLeadModel) },
              ],
              productSet: [
                { name: 'Product', connect: connectClient((e) => e, false)(null, SaleProductModel) },
              ],
            };
            return Promise.all(
              Object.keys(appSets)
              .map((x) => {
                const models = linkModels[x] || [];
                return Promise.all(
                  models.map((m) => {
                    const ids = appSets[x];
                    if (ids.length) {
                      const { searchAll, offline } = m.connect();
                      return searchAll({ id: ids.map(x => x.id) })
                      .then((res) => {
                        if (`${res.status}` === '0' && Array.isArray(res.data)) {
                          return Promise.all(res.data.map(record => offline.save(record)));
                        }
                      });
                    }
                    return Promise.resolve();
                  })
                );
              })
            );
          })
          .then(() => this.settings.save({ url, username, password, info }))
          .then(() => {
            this.props.updateSettings(true, this.settings.data);
            this.setLoaderVisibility();
            this.props.navigator.resetPageStack([{ name: 'Home' }]);
          })
          .catch((err) => {
            console.log('catch exp', err);
          })
          .finally(() => {
            this.setLoaderVisibility();
          });
        } else {
          this.setLoaderVisibility();
          this.showAlert('Authentication', 'Invalid Credentials');
        }
      })
      .catch(() => {
        this.setLoaderVisibility();
        this.showAlert('Login', 'Invalid Axelor URL.');
      });
    });
  }

  render() {
    const { loader, data } = this.state;
    const { url = '', username = '', password = '' } = data;
    const isValidate = url && username && password;
    return (
      <Page
        className="login-page"
        renderModal={() => (
          <Modal className="auth-modal" isOpen={loader}>
            <ProgressCircular indeterminate />
          </Modal>
        )}
      >
        <div className="login-title">
          Log In
        </div>
        <div className="login-form">
          <div className="login-form-group">
            <Input
              className="form-input"
              name="url"
              value={url}
              onChange={(e) => this.handleOnChange(e)}
              modifier='underbar'
              autocapitalize="off"
              autocorrect="off"
              float
              placeholder='URL' />
          </div>
          <div className="login-form-group">
            <Input
              className="form-input"
              name="username"
              value={username}
              onChange={(e) => this.handleOnChange(e)}
              modifier='underbar'
              autocapitalize="off"
              autocorrect="off"
              float
              placeholder='Username' />
          </div>
          <div className="login-form-group">
            <Input
              className="form-input"
              name="password"
              value={password}
              onChange={(e) => this.handleOnChange(e)}
              modifier='underbar'
              type='password'
              float
              placeholder='Password' />
          </div>
          <div className="login-form-group login-button">
            <Button disabled={!isValidate} modifier="large" onClick={() => this.handleSubmit()}>Login</Button>
          </div>
        </div>
      </Page>
    );
  }
}

LoginPage.propTypes = {
  navigator: PropTypes.any,
  route: PropTypes.any,
};

const mapStateToProps = ({ apps }) => ({ apps });
const mapDispatchToProps = (dispatch) => {
  return {
    selectAppByIndex: (e) => dispatch(PAGE_ACTIONS.selectAppByIndex(e)),
    changeMode: (e) => dispatch(ACTIONS.setAppMode(e)),
    updateSettings: (k, v) => dispatch(ACTIONS.setUserSettings(k, v)),
  }
};

LoginPage = connect(mapStateToProps, mapDispatchToProps)(LoginPage);

const mapConnectToProps = ({ refs: { user }, ...props}) => {
  return { ...props, user };
}

export default connectClient(mapConnectToProps)(LoginPage, { name: 'BASE', refs: [{
  model: 'User', field: 'user',
}] });
