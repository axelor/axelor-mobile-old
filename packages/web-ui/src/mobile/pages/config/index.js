import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { getSettings } from "@axelor/web-client";
import {
  REDUX_ACTIONS as BASE_ACTIONS,
  connectWebClient
} from "@axelor/web-client";
import * as ACTIONS from "../../redux/actions";
import Page from "../page";
import { Icon, Switch } from "react-onsenui";
import Translate, { translate } from "../../locale";
import { Select, Modal, ProgressCircular, AlertDialog } from "react-onsenui";
import models from "../models";
import { SwiperViewContainer } from "../page-list";
import ons from "onsenui";
import "./style.css";

class ConfigPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      alert: null,
      syncing: false,
      isOnline: false
    };
    this.onOnline = this.onOnline.bind(this);
    this.onOffline = this.onOffline.bind(this);
    document.addEventListener("online", this.onOnline, false);
    document.addEventListener("offline", this.onOffline, false);
    this.settings = getSettings()();
  }

  componentDidMount() {
    this.forceUpdate();
  }

  onOnline() {
    this.setState({ isOnline: true });
  }

  onOffline() {
    this.setState({ isOnline: false });
  }

  syncAll() {
    const {
      app: { mode },
    } = this.props;
    if (mode === 'online') {
      this.setState({ syncing: true });

      const allModels = models.map(m => connectWebClient(m));

      Promise.all(allModels.map(m => m.offline.search()))
        .then(results => {
          return Promise.all(
            results.map((result, ind) => {
              return Promise.all(
                result.map(record => allModels[ind].add(record))
              );
            })
          );
        })
        .finally(() => {
          this.setState({
            syncing: false,
            alert: {
              title: <Translate text={"app.syncTitle"} />,
              content: <Translate text="app.syncSuccessMsg" />
            }
          });
        });
    } else {
      ons.notification.alert(translate('common.noInternet'), {
        id: "internet-error"
      });
    }
  }

  changeLang(val) {
    this.settings.init().then(data => {
      data["info"]["user.lang"] = val;
      this.settings.save({ ...data });
      this.props.updateSettings(true, { ...data });
      this.props.setLocale(val);
      this.forceUpdate();
    });
  }

  logout() {
    this.settings = getSettings()();
    this.settings.init().then(data => {
      this.settings.save({ ...data, password: "" });
      this.props.navigator.resetPageStack([
        {
          name: "Login",
          payload: { ...data, password: "" }
        }
      ]);
    });
  }

  renderAlertBox() {
    const { alert } = this.state;
    const {
      title = "",
      content = "",
      onOk = () => this.setState({ alert: null })
    } = alert || {};
    return (
      <AlertDialog isOpen={!!alert} isCancelable={false}>
        <div className="alert-dialog-title">{title}</div>
        <div className="alert-dialog-content">{content}</div>
        <div className="alert-dialog-footer">
          <button onClick={onOk} className="alert-dialog-button">
            <Translate text="common.dialog.ok" />
          </button>
        </div>
      </AlertDialog>
    );
  }

  render() {
    const {
      app: { mode },
      lang
    } = this.props;
    const { data, active, configs } = this.props.apps;
    const app = data[active];
    let pages = [];
    app.menu.forEach(m => {
      if (m.items) {
        pages.push(...m.items);
      } else {
        pages.push(m);
      }
    });
    pages = pages.filter(p => p.config !== false);
    const isChecked = p => configs[active].indexOf(p) > -1;
    const pageProps = {};
    if (this.state.syncing) {
      pageProps.renderModal = () => (
        <Modal className="auth-modal" isOpen={this.state.syncing}>
          <ProgressCircular indeterminate />
        </Modal>
      );
    }
    return (
      <Page
        noBackIcon
        {...this.props}
        title={
          <div className="center" style={{ top: 0, left: -20 }}>
            <Translate text="app.configuration" />
          </div>
        }
        {...pageProps}
      >
        <SwiperViewContainer navigator={this.props.navigator}>
          <div className="config-content">
            {this.renderAlertBox()}
            <div className="config-list switch-color">
              {pages.map((page, i) => (
                <div key={i} className="config-page">
                  {<Translate text={page.title} />}
                  <Switch
                    checked={isChecked(page.name)}
                    onChange={() => this.props.toggle(page.name)}
                  />
                </div>
              ))}
            </div>
            <div className="common-list">
              <div className="config-page">
                <Translate text={"app.language.title"} />
                <Select
                  value={lang}
                  onChange={e => this.changeLang(e.target.value)}
                >
                  <option value="en">
                    {translate("app.language.en")}
                  </option>
                  <option value="fr">
                    {translate("app.language.fr")}
                  </option>
                  <option value="de">
                    {translate("app.language.de")}
                  </option>
                  <option value="it">
                    {translate("app.language.it")}
                  </option>
                  <option value="nl">
                    {translate("app.language.nl")}
                  </option>
                  <option value="es">
                    {translate("app.language.es")}
                    </option>
                  <option value="pl">
                    {translate("app.language.pl")}
                  </option>
                  <option value="pt">
                    {translate("app.language.pt")}
                  </option>
                  <option value="ru">
                    {translate("app.language.ru")}
                  </option>
                </Select>
              </div>
              <div className="config-page switch-color">
                <Translate text="app.offline" />
                <Switch
                  checked={mode === "offline"}
                  onChange={(e) =>{
                    e.preventDefault();
                    e.stopPropagation();
                    this.props.changeMode(
                      mode === "online" ? "offline" : "online"
                    )
                  }
                  }
                />
              </div>
            </div>
            {mode === "online" && (
              <div className="extra" onClick={() => this.syncAll()}>
                <Icon className="fa-cloud-upload" />
                <span>
                  {" "}
                  <Translate text="app.syncAll" />{" "}
                </span>
              </div>
            )}
            <div className="extra" onClick={() => this.logout()}>
              <Icon className="fa-power-off" />
              <span>
                {" "}
                <Translate text="app.logout" />{" "}
              </span>
            </div>
          </div>
        </SwiperViewContainer>
      </Page>
    );
  }
}

ConfigPage.propTypes = {
  navigator: PropTypes.any,
  route: PropTypes.any
};

const mapStateToProps = state => {
  return {
    app: state.app,
    lang: state.locale.key,
    apps: state.apps
  };
};

const mapDispatchToProps = dispatch => {
  return {
    changeMode: e => dispatch(BASE_ACTIONS.setAppMode(e)),
    updateSettings: (e, v) => dispatch(BASE_ACTIONS.setUserSettings(e, v)),
    setLocale: e => dispatch(ACTIONS.setLocale(e)),
    toggle: e => dispatch(ACTIONS.toggleConfig(e))
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ConfigPage);
