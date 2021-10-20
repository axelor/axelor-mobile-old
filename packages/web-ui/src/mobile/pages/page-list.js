import React, { Component } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import debounce from "lodash.debounce";
import {
  Toolbar,
  ToolbarButton,
  Icon,
  List,
  ListItem,
  PullHook,
  ProgressCircular,
  AlertDialog,
  Modal
} from "react-onsenui";
import Translate, { translate } from "../locale";
import { connect } from "react-redux";
import * as ACTIONS from "../redux/actions";
import Page from "./page";
import TimerBox from "./timer-box";
import TimesheetTimer from "./timesheet/timer";
import { debounceCallback } from "./debounce";
import ons from "onsenui";
import { getApps } from "../apps";
export const Typo = ({ variant, children, className }) => {
  return <p className={classNames(`ax-p ${className}`, variant)}>{children}</p>;
};

export class SwiperViewContainer extends Component {
  constructor(props) {
    super(props);
    this.swipeLeftListener = this.swipeLeftListener.bind(this);
    this.swipeRightListener = this.swipeRightListener.bind(this);
  }

  componentDidMount() {
    document.addEventListener("swipeleft", this.swipeLeftListener);
    document.addEventListener("swiperight", this.swipeRightListener);
  }

  componentWillUnmount() {
    document.removeEventListener("swipeleft", this.swipeLeftListener);
    document.removeEventListener("swiperight", this.swipeRightListener);
  }

  changeView(side = "left") {
    if (this.props.navigator.routes.length === 1) {
      const { reduxState, reduxActions } = this.props;
      if (reduxState && reduxActions) {
        const { apps, app } = reduxState;
        const activeRoute = app.route || "";
        if (apps.data[apps.active]) {
          const { configs } = apps;
          const activeApp = Object.assign({}, apps.data[apps.active]);
          const activeConfig = configs[apps.active] || [];
          if (activeApp.menu[activeApp.active]) {
            activeApp.menu = [...activeApp.menu].filter(x => {
              if (x.items) {
                return (
                  x.items.filter(
                    xx =>
                      xx.config === false || activeConfig.indexOf(xx.name) > -1
                  ).length > 0
                );
              }
              return x.config === false || activeConfig.indexOf(x.name) > -1;
            });
            const activeIndex = activeApp.menu.findIndex(x => {
              if (x.items) {
                return x.items.filter(xx => xx.name === activeRoute).length > 0;
              }
              return x.name === activeRoute;
            });

            if (activeApp.active === -1) return;
            const activeMenu = Object.assign(
              {},
              activeApp.menu[activeApp.active]
            );
            if (activeMenu.items) {
              activeMenu.items = [...activeMenu.items].filter(
                xx => activeConfig.indexOf(xx.name) > -1
              );
              activeMenu.active = activeMenu.active;
              if (side === "left") {
                const newIndex = (activeMenu.active || 0) + 1;
                if (activeMenu.items.length) {
                  if (newIndex >= activeMenu.items.length) {
                    if (activeIndex + 1 < activeApp.menu.length) {
                      reduxActions.selectMenu(activeApp.active + 1, true);
                    }
                  } else {
                    reduxActions.selectMenuItem(activeApp.active, newIndex);
                  }
                }
              } else if (side === "right") {
                const newIndex = (activeMenu.active || 0) - 1;
                if (activeMenu.items.length) {
                  if (newIndex < 0) {
                    if (activeIndex - 1 >= 0) {
                      reduxActions.selectMenu(activeApp.active - 1, true);
                    }
                  } else {
                    reduxActions.selectMenuItem(activeApp.active, newIndex);
                  }
                }
              }
            } else {
              if (side === "left" && activeIndex + 1 < activeApp.menu.length) {
                reduxActions.selectMenu(activeApp.active + 1, true);
              }
              if (side === "right" && activeIndex - 1 >= 0) {
                reduxActions.selectMenu(activeApp.active - 1, true);
              }
            }
          }
        }
      }
    }
  }

  swipeLeftListener(e) {
    if (this.props.onSwipeLeft() !== true) return false;
    this.changeView("left");
  }

  swipeRightListener(e) {
    if (this.props.onSwipeRight() !== true) return false;
    this.changeView("right");
  }

  render() {
    return <ons-gesture-detector>{this.props.children}</ons-gesture-detector>;
  }
}

const mapStateToProps = state => {
  return { reduxState: { apps: state.apps, app: state.app } };
};

const mapDispatchToProps = (dispatch, { navigator }) => {
  return {
    reduxActions: {
      selectMenu: (e, v) => dispatch(ACTIONS.selectMenu(e, navigator, v)),
      selectMenuItem: (k, v) =>
        dispatch(ACTIONS.selectMenuItem(k, v, navigator))
    }
  };
};

SwiperViewContainer.propTypes = {
  navigator: PropTypes.any,
  onSwipeLeft: PropTypes.func,
  onSwipeRight: PropTypes.func
};

SwiperViewContainer.defaultProps = {
  onSwipeLeft: () => true,
  onSwipeRight: () => true
};

SwiperViewContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(SwiperViewContainer);

export class PageListComponent extends Component {
  constructor(
    props,
    pageState = {},
    { cacheRelatedFields = true, fetchRelatedFields = null, allowSorting = false } = {}
  ) {
    super(props);
    this.state = {
      data: [],
      offset: 0,
      total: 0,
      limit: 10,
      keyword: "",
      loading: false,
      hookState: "initial",
      alert: null,
      uploading: false,
      isOnline: false,
      sortBy: [],
      sortingFields: [],
      ...pageState
    };
    this.cacheRelatedFields = cacheRelatedFields;
    this.fetchRelatedFields = fetchRelatedFields;
    this.allowSorting = allowSorting;
    this.searchDataCallback = debounce(this.searchData.bind(this), 800);
    this._pageComponent = null;
    this.onOnline = this.onOnline.bind(this);
    this.onOffline = this.onOffline.bind(this);
    document.addEventListener("online", this.onOnline, false);
    document.addEventListener("offline", this.onOffline, false);
  }

  setState(...updates) {
    if (this._pageComponent) {
      super.setState(...updates);
    }
  }

  getFetchOptions(searchOptions = {}, { fields = ["id"], ...rest } = {}) {
    const { keyword } = this.state;
    if (keyword) {
      searchOptions.search = {
        fields,
        value: keyword,
        ...rest
      };
    }
    return { ...searchOptions };
  }

  getAPI() {
    return this.props;
  }

  fetchData(loading = true) {
    this.setState({ loading });

    const { offset, limit, keyword } = this.state;
    const searchOptions = { ...this.getFetchOptions(), offset, limit };

    if (!searchOptions.search) {
      searchOptions.search = {};
    }

    const { searchAll, fetch } = this.getAPI();
    return searchAll(searchOptions)
      .then(res => {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve(res);
          }, 200);
        });
      })
      .then(({ data = [], total = 0, status }) => {
        // if any error happens
        if (!Array.isArray(data)) {
          data = [];
          total = 0;
        }
        this.setState(prevState => {
          return {
            data: offset === 0 ? data : [...prevState.data, ...data],
            offset,
            total,
            loading: this.cacheRelatedFields || keyword ? false : true
          };
        });
        if (this.fetchRelatedFields && !keyword) {
          Promise.all(
            data
              .filter(
                x =>
                  x.id && (this.cacheRelatedFields ? x.is_fetch !== true : true)
              )
              .map(x =>
                fetch(x, this.fetchRelatedFields).then(
                  ({ data: [record] = [] }) => record
                )
              )
          ).then(data =>
            this.setState(state => ({
              loading: false,
              data: state.data.map(
                record => data.find(x => x.id === record.id) || record
              )
            }))
          );
        }
      });
  }

  getRecordsByIndex(record) {
    const { data } = this.state;
    let newList = [];
    const index = data.findIndex(l => l.id === record.id);
    debounceCallback(() => {
      if (index >= data.length - 3) {
        this.onLoadMore(() => {});
      }
    });
    if (index === 0) {
      newList = data.slice(index, index + 2);
    } else {
      newList = data.slice(index - 1, index + 2);
    }
    return newList;
  }

  searchData() {
    this.setState({ offset: 0, data: [] }, () => {
      this.fetchData();
    });
  }

  componentDidMount() {
    this.fetchData();
  }

  onListItemClick() {
    return null;
  }

  onOnline() {
    this.setState({ isOnline: true });
  }

  onOffline() {
    this.setState({ isOnline: false });
  }

  onUploadSync(e, record, index) {
    const { data } = this.state;
    e.preventDefault();
    e.stopPropagation();
    const {
      app: { mode },
    } = this.props;
    if (mode === 'online') {
      this.setState({
        alert: {
          title: translate("Alert.syncRecordTitle"),
          content: translate("Alert.syncRecordContent"),
          onOk: () => {
            this.setState({ uploading: true });
            this.getAPI()
              .add(record)
              .then(({ data: [result], status, error = {} }) => {
                if (`${status}` !== "0") {
                  this.setState({
                    uploading: false,
                    alert: {
                      title: <Translate text={"app.alert.error"} />,
                      content: error.message || (
                        <Translate text={"app.alert.errorOthers"} />
                      )
                    }
                  });
                } else {
                  this.setState(
                    { alert: null, uploading: false, data: [] },
                    () => {
                      data[index] = result;
                      this.setState({ data: [...data] });
                    }
                  );
                }
              });
          }
        }
      });
    } else {
      ons.notification.alert(translate('common.noInternet'), {
        id: "internet-error"
      });
    }
  }

  onLoadMore(done) {
    const { offset, limit, total } = this.state;
    const newOffset = offset + limit;
    const hasMore = newOffset < total;
    if (hasMore) {
      this.setState({ offset: newOffset }, () => this.fetchData().then(done));
    } else {
      done();
    }
  }

  onSwipeLeft() {
    return true;
  }

  onSwipeRight() {
    return true;
  }

  renderListSearch({ placeholder = translate("common.search") } = {}) {
    const { keyword, sortBy } = this.state;
    const onKeywordChange = e => {
      this.setState({ keyword: e.target.value }, () => {
        this.searchDataCallback();
      });
    };

    const handleSortingKey = key => {
      this.setState((state) => {
        const index = state.sortBy.findIndex(e => e.startsWith("-") ? e === `-${key}` : e === key);
        if(index !== -1) {
          let sortBy = [...state.sortBy];
          if(sortBy[index].startsWith("-")) {
            sortBy.splice(index, 1);
          } else {
            sortBy[index] = `-${key}`;
          }
          return {sortBy: [...sortBy], isOpen: false};
        } else {
          return {sortBy: [...state.sortBy, key], isOpen: false};
        }
      }, () => {
        this.searchDataCallback();
      })
    }

    return (
      <div key="0" className="ax-searchbar">
        <Icon icon="fa-search" />
        <input
          placeholder={placeholder}
          value={keyword}
          onChange={onKeywordChange}
        />
        {this.allowSorting &&
            <div
              ref={(btn) => { this.btn = btn; }}
              onClick={() =>
                this.setState((state) => {
                  return { isOpen: !state.isOpen}
                })
              }
              className="search-sorting-icon-button"
            >
              <span>
                <i className="fa-sort fa" />
              </span>

            {this.state.isOpen && <div class="popover popover--top" style={{top: 30, right: 5, boxShadow: '0 8px 6px -6px #eee', border: '1px solid #eee',}}>
              {/* <div class="popover__arrow popover--top__arrow" style={{marginLeft: 110}}></div> */}
              <div class="popover__content popover--top__content" style={{borderRadius: '0px', width: 200, }}>
                <div>
                {
                  this.state.sortingFields.map((field) => {
                    let iconClassName = '';
                    if(sortBy.findIndex(e => e === `-${field.key}`) !== -1) {
                      iconClassName = 'sort-alpha-up';
                    } else if(sortBy.findIndex(e => e === field.key) !== -1) {
                      iconClassName = 'sort-alpha-down';
                    }

                    return (
                      <ListItem
                        key={field.key}
                        onClick={() => handleSortingKey(field.key)}
                        tappable
                      >
                        <div style={{fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between', width: '90%'}}>
                          <span>{field.title}</span>
                          {iconClassName && <i className={`fa-${iconClassName} fa sorting-item-icon`} />}
                        </div>
                      </ListItem>
                    )
                  })
                }
                </div>
              </div>
            </div>}
            </div>}
        {/* <Popover
          isOpen={this.state.isOpen}
          onCancel={() => this.setState({isOpen: false})}
          getTarget={() => this.state.target}
        >
          <div>
          {
            this.state.sortingFields.map((field) => (
              <ListItem
                key={field}
                onClick={() => handleSortingKey(field)}
                tappable
              >
                <div>{field}</div>
              </ListItem>
            ))
          }
          </div>
        </Popover> */}
      </div>
    );
  }

  renderRow(row, index) {
    return (
      <div>
        <h1> {index}. Record </h1>
      </div>
    );
  }

  renderRowUploadSync(item, index) {
    const appOnline =
      this.getAPI().app_state && this.getAPI().app_state.mode === "online";
    const isNewRecord = `${item.id}` === "0";
    const isOffline = `${item.is_offline}` === "1";
    return (
      appOnline &&
      isNewRecord &&
      isOffline && (
        <div
          className="ax-upload-sync"
          onClick={e => this.onUploadSync(e, item, index)}
        >
          <Icon icon="fa-cloud-upload" />
        </div>
      )
    );
  }

  renderList(props = {}) {
    const { data } = this.state;
    return (
      <List
        style={{ marginTop: 45, backgroundImage: "none", marginBottom: 100 }}
        dataSource={data}
        renderRow={(row, index) => (
          <ListItem
            key={row.row_id || row.id || index}
            className={classNames("ax-list-item", { offline: row.offline })}
            onClick={() => this.onListItemClick(row, index)}
          >
            {this.renderRowUploadSync(row, index)}
            {this.renderRow(row, index)}
          </ListItem>
        )}
        {...props}
      />
    );
  }

  renderListLoader() {
    return (
      this.state.loading && (
        <div className="custom-loader-ui">
          <ProgressCircular indeterminate />
        </div>
      )
    );
  }

  renderPageTitle() {
    return null;
  }

  renderToolbar() {
    return (
      <Toolbar className="ax-toolbar" noshadow modifier="transparent">
        <div className="left">
          <ToolbarButton>
            <Icon icon="fa-th-large" />
          </ToolbarButton>
        </div>
        <div className="center">Axelor</div>
      </Toolbar>
    );
  }

  renderPullHookLoader(props = {}) {
    return (
      <div style={{ marginTop: 60 }} className="custom-hook-loader" {...props}>
        <ProgressCircular indeterminate />
      </div>
    );
  }

  renderPullHook() {
    const { hookState, loading } = this.state;
    let hookContent = null;
    if (hookState === "action") {
      hookContent = this.renderPullHookLoader();
    }
    return (
      <PullHook
        disabled={loading}
        onChange={e => this.setState({ hookState: e.state })}
        onLoad={done =>
          this.setState({ offset: 0 }, () => this.fetchData(false).then(done))
        }
        fixedContent={true}
      >
        {hookContent}
      </PullHook>
    );
  }

  renderFixedContent(children = null) {
    return (
      <React.Fragment>
        {this.renderListSearch()}
        {children}
      </React.Fragment>
    );
  }

  renderAlertBox() {
    const { alert } = this.state;
    const closeDialog = () => this.setState({ alert: null });
    const {
      title = "",
      content = "",
      onOk = closeDialog,
      onCancel = closeDialog
    } = alert || {};
    return (
      <AlertDialog isOpen={!!alert} isCancelable={false}>
        <div className="alert-dialog-title">{title}</div>
        <div className="alert-dialog-content">{content}</div>
        <div className="alert-dialog-footer">
          <button onClick={onCancel} className="alert-dialog-button">
            <Translate text="app.alert.cancel" />
          </button>
          <button onClick={onOk} className="alert-dialog-button">
            <Translate text="app.alert.ok" />
          </button>
        </div>
      </AlertDialog>
    );
  }

  renderModal() {
    const { uploading } = this.state;
    return (
      uploading && (
        <Modal className="auth-modal" isOpen={uploading}>
          <ProgressCircular indeterminate />
        </Modal>
      )
    );
  }

  startTimer() {
    this.props.navigator.pushPage(
      {
        path: "timesheet_timer",
        component: TimesheetTimer,
        start_timer: true
      },
      { animation: "none" }
    );
  }

  // render() {
  // return super.render({
  //   renderBottomBar: <TimerBox onStart={() => this.startTimer()} />,
  // });
  // }

  render(pageProps = {}) {
    const activeApps = getApps();
    let isTimesheetActive = activeApps.includes("timesheet");
    pageProps.renderBottomBar = isTimesheetActive && (
      <TimerBox onStart={() => this.startTimer()} />
    );
    if (this.renderPageTitle() === null) {
      pageProps.renderToolbar = () => this.renderToolbar();
    }
    if (this.state.uploading) {
      pageProps.renderModal = this.renderModal();
    }
    return (
      <Page
        title={this.renderPageTitle()}
        onInfiniteScroll={done => this.onLoadMore(done)}
        renderFixed={() => this.renderFixedContent()}
        {...pageProps}
        {...this.props}
        ref={e => (this._pageComponent = e)}
      >
        {this.renderPullHook()}
        <SwiperViewContainer
          navigator={this.props.navigator}
          onSwipeLeft={() => this.onSwipeLeft()}
          onSwipeRight={() => this.onSwipeRight()}
        >
          <section id="page-list-gesture">{this.renderList()}</section>
        </SwiperViewContainer>
        {this.renderListLoader()}
        {this.renderAlertBox()}
      </Page>
    );
  }
}

PageListComponent.propTypes = {
  navigator: PropTypes.any,
  route: PropTypes.any
};

export const swiperPageList = CustomComponent => {
  return CustomComponent;
};

export default PageListComponent;
