import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import TimerBox from './timer-box';
import TimesheetTimer from './timesheet/timer';
import PageListComponent, { Typo, swiperPageList } from './page-list';

const Tabbar = ({ tabs, value, onChange }) => {
  if (tabs.filter(t => t.value === value).length === 0 && tabs && tabs.length) {
    value = tabs[0].value;
  }
  return (
    <div className="ax-tab-container">
      <div className="tabbar tabbar--top tabbar--material">
          {
            tabs.map((tab, i) => (
              <React.Fragment key={i}>
                <label className="tabbar__item tabbar--material__item" onClick={() => onChange(tab.value)}>
                  <button className={classNames("tabbar__button", {'highlight-list-tab-button': tab.value === value })} >
                      {tab.text}
                  </button>
                </label>
              </React.Fragment>
            ))
          }
      </div>
    </div>
  )
}

class PageListTabsComponent extends PageListComponent {
  constructor(props, options = {}, fetchOptions = {}) {
    super(props, {
      filter: 0,
      ...options,
    }, fetchOptions);
  }

  getFetchFilterOptions(filter) {
    return {
      fields: [],
      operator: 'and',
    };
  }

  getFetchSearchOptions(keyword) {
    const searchCriteria = {
      fields: [],
      operator: 'or',
    };
    return searchCriteria;
  }

  getFetchOptions(searchOptions) {
    searchOptions = {
      ...searchOptions,
      search: {
        fields: [],
        operator: 'and'
      },
    }

    const { filter, keyword } = this.state;

    if (filter) {
      searchOptions.search.fields.push(this.getFetchFilterOptions(filter));
    }

    if (keyword) {
      searchOptions.search.fields.push(this.getFetchSearchOptions(keyword));
    }

    return {...searchOptions};
  }

  getListTabsData() {
    return [];
  }

  onSwipeLeft() {
    if (this.props.navigator.routes.length !== 1) return false;
    const { filter } = this.state;
    if (filter < this.getListTabsData().length - 1) {
      return this.onTabChange(filter + 1);
    }
    return true;
  }

  onSwipeRight() {
    if (this.props.navigator.routes.length !== 1) return false;
    const { filter } = this.state;
    if (filter > 0) {
      return this.onTabChange(filter - 1);
    }
    return true;
  }

  onTabChange(newIndex) {
    const { filter } = this.state;
    if(filter !== newIndex) {
      this.setState({ filter: newIndex }, () => this.searchData());
    }
  }

  renderListTabsFilter() {
    const { filter } = this.state;
    return (
      <Tabbar
        value={filter}
        onChange={(e) => this.onTabChange(e)}
        tabs={this.getListTabsData()}
      />
    )
  }

  renderList() {
    return super.renderList({
      style: { marginTop: 100, backgroundImage: 'none', marginBottom: 100 },
    });
  }

  renderPullHookLoader() {
    return super.renderPullHookLoader({
      style: { marginTop: 100 },
    });
  }

  renderFixedContent() {
    return super.renderFixedContent(
      this.renderListTabsFilter()
    );
  }

  startTimer() {
    this.props.navigator.pushPage({
      path: 'timesheet_timer',
      component: TimesheetTimer,
      start_timer: true,
    }, { animation: 'none' });
  }

  render() {
    return super.render({
      renderBottomBar: <TimerBox onStart={() => this.startTimer()} />,
    });
  }
}

PageListTabsComponent.propTypes = {
  navigator: PropTypes.any,
  route: PropTypes.any,
};

export { Typo, swiperPageList };

export default PageListTabsComponent;
