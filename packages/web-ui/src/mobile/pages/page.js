import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { connect } from 'react-redux';
import * as ACTIONS from '../redux/actions';
import { getApps } from '../apps';
import { ProgressCircular, Toolbar, Page, Modal, PullHook, ToolbarButton, BottomToolbar, Icon } from 'react-onsenui';
import Translate from '../locale';
import './styles.css';

export class PageElement extends Component {
  render() {
    const { app, online = true, offline = true, children } = this.props;

    if (app.mode === 'online' && !online) return null;
    if (app.mode === 'offline' && !offline) return null;

    return children;
  }
}

PageElement = connect((state) => ({ app: state.app }))(PageElement);


export class PageHook extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hookState: 'initial',
      status: true,
    };
    this.enableHook = this.enableHook.bind(this);
    this.disableHook = this.disableHook.bind(this);
    this.timeoutCallback = null;
  }

  componentDidMount() {
    this.timeoutCallback = setTimeout(() => {
      this.setHookState('initial');
    }, 600);
  }

  componentWillUnmount() {
    if (this.timeoutCallback) {
      clearTimeout(this.timeoutCallback);
    }
  }

  enableHook() {
    if (!this.state.status) {
      this.timeoutCallback = setTimeout(() => {
        this.setState({ status: true });
      }, 100);
    }
  }

  disableHook() {
    if (this.state.status) {
      this.setState({ status: false });
    }
  }

  setHookState(hookState) {
    this.setState({ hookState });
    const _list = ReactDOM.findDOMNode(this.props.list);
    if (_list) {
      if (hookState === 'action') {
        _list.classList.remove('page-no-hook');
      } else {
        _list.classList.add('page-no-hook');
      }
    }
  }

  checkListScrollOffset() {
    const { list } = this.props;
    if (!list) return 0;
    const _list = list;
    const el = _list;
    return el.parentNode.scrollTop;
  }

  render() {
    const { hookState, status } = this.state;
    const { fetchAPI } = this.props;
    const isPullToRefresh = hookState === 'action';
    const offset = this.checkListScrollOffset();
    const isDisabled = !status;
    return (
      <PullHook
        style={{ height: isPullToRefresh && !isDisabled ? '64px' : '0' }}
        disabled={isDisabled}
        onChange={(e) => {
          if (offset <= 0) {
            this.setHookState(e.state);
          }
        }}
        onLoad={(done) => {
          if (offset === 0 && !isDisabled) {
            fetchAPI().then(() => {
              done();
            });
          } else {
            done();
          }
        }}
      >
        {
          isPullToRefresh && !isDisabled && <ProgressCircular style={{ marginTop: '14%' }} indeterminate />
        }
      </PullHook>
    );
  }
}

class PageComponent extends Component {

  constructor(props) {
    super(props);
    this.state = {};
    window.addEventListener('keyboardWillShow', (event) => {
      // Describe your logic which will be run each time when keyboard is about to be shown.
      this.setState({ showBottomBar: false });

    });
    window.addEventListener('keyboardWillHide', () => {
      // Describe your logic which will be run each time when keyboard is about to be closed.
      this.setState({ showBottomBar: true });
    });
  }

  handlePageChanged() {
    const { isRecordChanged = () => Promise.resolve(true) } = this.props;
    return isRecordChanged();
  }

  handleMenuClick(index) {
    this.handlePageChanged()
    .then(ok => {
      ok && this.props.selectMenu(index);
    });
  }

  renderToolbar(title) {
    const { noBackIcon = false } = this.props;
    const { routes } = this.props.navigator;
    const isPop = !noBackIcon && routes.length > 2;
    const onClick = () => isPop ? this.props.navigator.popPage() : this.props.showModal('apps');
    return (
      <Toolbar noshadow modifier="transparent">
        <div className='left' onClick={onClick}>
          {
            isPop ?
            <ToolbarButton>
              <Icon icon='md-arrow-left' />
            </ToolbarButton> :
            <ToolbarButton>
              <Icon icon='fa-th-large' />
            </ToolbarButton>
          }
        </div>
        {
          title ? title :
          <div className='center'>
            Axelor
          </div>
        }
      </Toolbar>
    );
  }

  renderAppMenuModal() {
    const { hideModal } = this.props;
    const { active, data, modal } = this.props.apps;
    const activeApps = getApps();
    const maxHeight = window.innerHeight - 80;
    return (
      <Modal
        className={classNames('app-modal', 'apps')}
        isOpen={!!modal}
        animation={'fade'}
        onClick={hideModal}
      >
        <div className="apps-nav">
          <div className="nav-close">
            <Icon icon="fa-close" />
          </div>
          <h3> <Translate text="app.title" /> </h3>
          <div className="apps-menu-container" style={{ overflowY: 'auto', maxHeight }}>
          {
            data.filter(x => activeApps.indexOf(x.userConfigKey) > -1).map((app, i) => (
              <div onClick={() => this.props.selectApp(app.userConfigKey)} key={i} className={classNames('apps-nav-app', { active: i === active })}>
                <div className="app-box">
                  <div className={classNames('app-icon')} style={{ color: app.color || "#fff" }}>
                    <Icon icon={app.icon} />
                  </div>
                  <div className="app-title">
                    <Translate text={app.title} />
                  </div>
                </div>
              </div>
            ))
          }
          </div>
        </div>
      </Modal>
    );
  }

  renderNavMenuModal() {
    const { hideModal } = this.props;
    const { modal, data, configs, active, activeMenuIndex, activeMenuItemIndex } = this.props.apps;
    const app = data[active];
    const { items = [] } = app.menu[activeMenuIndex];
    const config = configs[active];
    const getItemIndex = (name) => items.findIndex(item => item.name === name);
    return (
      <Modal
          className={classNames('app-modal', 'apps')}
          isOpen={!!modal}
          animation={'lift'}
        >
        <div className="app-nav-container">
          <div className="nav-close" onClick={hideModal}>
            <Icon icon="fa-close" />
          </div>
          <div className="app-nav-menu">
            {
              items.filter(i => config.indexOf(i.name) > -1).map((item, i) => {
                const isActive = app.active === activeMenuIndex && i === activeMenuItemIndex;
                return (
                  <div key={i} onClick={() => isActive ? hideModal() : this.props.selectMenuItem(activeMenuIndex, getItemIndex(item.name))} className={classNames('nav-menu-item', { active: isActive })}>
                    <span className="nav-menu-item-title">
                      <Translate text={item.title} />
                    </span>
                  </div>
                )
              })
            }
          </div>
        </div>
      </Modal>
    );
  }

  renderModal() {
    const { modal } = this.props.apps;
    if (!modal) return null;
    return modal === 'apps' ? this.renderAppMenuModal() : this.renderNavMenuModal();
  }

  renderBottombar(children = null) {
    const { apps, app: { mode, route}, isMenuVisible = true } = this.props;
    const { data, configs } = apps;
    let { active } = apps;
    if (!data[active]) {
      active = 0;
    }
    const app = data[active];
    const appMenu = app.menu;
    const config = configs[active];
    return (
      isMenuVisible &&
      <BottomToolbar className="app-bottombar" modifier="material">
        {children}
        <div className={classNames('app-tabbar', mode)}>
          {
            appMenu.map((item, i) => {
              const showItems = item.items ? item.items.filter(i => config.indexOf(i.name) > -1) : [];
              if (item.items) {
                if (showItems.length === 0) {
                  return null;
                }
              } else if (item.config !== false && config.indexOf(item.name) === -1) {
                return null;
              }
              const { icon, title, name, is_button = false, backgroundColor, activeColor } = item.items ? showItems[(showItems.length <= item.active ? 0 : item.active) || 0] : item;
              const isActive = i === app.active;
              return (
                <div key={i} className={classNames('app-tabbar-item', { active: isActive })}>
                  <div
                    className={classNames('tab-item', { 'tab-button': is_button })}
                    style={{
                      background: is_button && isActive ? backgroundColor : 'none',
                      borderColor: is_button && isActive ? backgroundColor : 'none',
                    }}
                    onClick={() => isActive && !item.items && route === name ? null : this.handleMenuClick(i)}
                  >
                    <div className="tab-item-icon">
                      <Icon icon={icon} style={{ color: isActive && activeColor ? activeColor : 'inherit' }} />
                    </div>
                    <div className="tab-item-title" style={{ color: isActive && activeColor ? activeColor : 'inherit' }}>
                      <Translate text={title} />
                    </div>
                  </div>
                </div>
              )
            })
          }
        </div>
      </BottomToolbar>
    );
  }

  render() {
    const { showBottomBar } = this.state;
    const { title, renderModal, renderToolbar, renderBottomBar, renderBottomToolbar, className, ...rest } = this.props;

    return (
      <Page
        {...rest}
        className={classNames('app-page', className, showBottomBar === false && 'page-with-out-bottom-toolbar')}
        renderToolbar={() => renderToolbar ? renderToolbar() : this.renderToolbar(title)}
        renderBottomToolbar={() =>
          showBottomBar === false ?
          null
          :
          renderBottomToolbar ? renderBottomToolbar() : this.renderBottombar(renderBottomBar)
        }
        renderModal={() => renderModal ? (typeof renderModal === 'function' ? renderModal() : renderModal) : this.renderModal()}
        >
        {
          this.props.children
        }
      </Page>
    );
  }
}

PageComponent.propTypes = {
  navigator: PropTypes.any,
  route: PropTypes.any,
};

const mapStateToProps = (state) => {
  return { apps: state.apps, app: state.app };
}

const mapDispatchToProps = (dispatch, { navigator }) => {
  return {
    showModal: (e) => dispatch(ACTIONS.showModal(e)),
    hideModal: () => dispatch(ACTIONS.hideModal()),
    selectApp: (e) => dispatch(ACTIONS.selectApp(e, navigator)),
    selectMenu: (e) => dispatch(ACTIONS.selectMenu(e, navigator)),
    selectMenuItem: (k, v) => dispatch(ACTIONS.selectMenuItem(k, v, navigator)),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(PageComponent);
