import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Icon, ToolbarButton, SearchInput, Toolbar, Page, ListItem, Radio, ProgressCircular } from 'react-onsenui';
import debounce from 'lodash.debounce';

export const getEventObject = (name, value) => ({ target: { name, value }});

class SelectionPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data: [],
      value: props.route.value || null,
      loading: true,
      pager: {
        offset: 0,
        limit: 20,
        total: 0,
      },
      search: '',
    };
    this.search = debounce(this.search.bind(this), 800);
    this.is_closed = false;
  }

  setState(...data) {
    if (this.pageRef) {
      super.setState(...data);
    }
  }

  componentDidMount() {
    this.fetchData()
    .then(() => {
      this.forceUpdate();
    })
  }

  fetchData(keyword = null) {
    const { targetName = 'id', searchAPI, searchAPIOptions } = this.props.route;
    const isSearch = keyword !== null;
    const options = {
      fields: [targetName],
      ...this.state.pager,
      ...searchAPIOptions,
    };
    if (keyword) {
      options.search = {
        fields: [{ fieldName: targetName, operator: 'like', value: keyword }],
        operator: 'and',
      };
    }
    if (isSearch) {
      options.offset = 0;
    }
    this.setState({ loading: true, search: keyword });
    return searchAPI(options)
    .then(({ data = [], total = 0 }) => {
      const { pager, data: stateData } = this.state;
      const newData = isSearch ? [...data] :  [...stateData, ...data];
      this.setState({ loading: false, data: newData, pager: { ...pager, total, offset: options.offset } });
    });
  }

  filterData(keyword = null) {
    const { targetName = 'id' } = this.props.route;
    const allData = this.cloneData;
    const filteredData = keyword ? allData.filter(e => (e[targetName] || '').toString().toLowerCase().indexOf(keyword.toLowerCase()) > -1) : allData;
    this.setState({
      search: keyword,
      data: [...filteredData], pager: { offset: 0, limit: filteredData.length, total: filteredData.length }
    });
  }

  search({ target: { value = '' }}) {
    const { liveSearch = true } = this.props.route;
    if (!this.cloneData) {
      this.cloneData = this.state.data;
    }
    if (this.state.search !== value) {
      if (liveSearch) {
        this.fetchData(value);
      } else {
        this.filterData(value);
      }
    }
  }

  getValueById(id) {
    return this.state.data.find(r => r.id === Number(id));
  }

  handleChange(row, status) {
    this.setState({ value: row }, () => {
      if (this.props.route.closeOnSelect) {
        this.close();
      }
    });
  }

  close() {
    const { value } = this.state;
    const { onChange, targetName, name, goBack,all } = this.props.route;
    let obj = {}
    if(all) {
      obj = value;
    } else {
      obj = { row_id: value.row_id || '', id: value.id, [targetName]: value[targetName] }
    }
    onChange(getEventObject(name, obj));
    if (!this.is_closed) {
      this.is_closed = true;
      goBack();
    }
  }

  onLoadMore(done) {
    const { liveSearch = true } = this.props.route;
    const { pager, search } = this.state;
    pager.offset = pager.offset + pager.limit;
    const hasMore = pager.total > pager.offset;
    if (hasMore && liveSearch) {
      this.setState({ loading: true, pager: {...pager} }, () => {
        this.fetchData(search).then(done);
      });
    } else {
      done();
    }
  }

  renderRow(row, index) {
    const { value } = this.state;
    const { targetName } = this.props.route;
    const isSelected = value && value.id && value.id.toString() === row.id.toString();
    return (
      <ListItem key={row.id} tappable onClick={() => this.handleChange(row)}>
        <label className='left'>
          <Radio
            inputId={`radio-${row.id}`}
            checked={isSelected}
          />
        </label>
        <label htmlFor={`radio-${row.id}`} className='center'>
          {row[targetName]}
        </label>
      </ListItem>
    )
  }

  renderToolbar() {
    const { goBack, title } = this.props.route;
    return (
      <Toolbar style={{ background: '#fff' }}>
        <div className='left'>
          <ToolbarButton onClick={() => goBack()} style={{ color: '#000' }}>
            <Icon icon='md-arrow-left' />
          </ToolbarButton>
        </div>
        <div className='center' style={{ color: '#000', flex: 1 }}>{title}</div>
        <div className='right'>
          <ToolbarButton onClick={() => this.close()} style={{ color: '#000', fontSize: 36, padding: 0, marginRight: 20 }}>
            <Icon icon='md-check' />
          </ToolbarButton>
        </div>
      </Toolbar>
    );
  }

  render() {
    const { data, search, loading } = this.state;
    const { placeholder, notFoundContent } = this.props.route;
    return (
      <Page
        ref={e => this.pageRef = e}
        renderToolbar={() => this.renderToolbar()}
        onInfiniteScroll={(done) => this.onLoadMore(done)}
      >
        <div>
          <div style={{ padding: 12 }}>
            <SearchInput value={search} style={{ width: '100%' }} placeholder={placeholder} onChange={this.search} />
          </div>
          {
            loading &&
            <div style={{ textAlign: 'center', padding: 5 }}>
              <ProgressCircular indeterminate />
            </div>
          }
          {
            data.map((e, i) => this.renderRow(e, i))
          }
          {
            (!loading && data.length === 0) &&
            <ListItem>
              {notFoundContent}
            </ListItem>
          }
        </div>
      </Page>
    );
  }
}

export class ManyToOne extends Component {
  render() {
    const { title, liveSearch, placeholder, value, onChange, targetName, searchAPI, searchAPIOptions, name, closeOnSelect, notFoundContent, renderItem, navigator, all,...restProps } = this.props;
    return (
      <div
        {...restProps}
        className={classNames(restProps.className)}
      >
        {
          React.cloneElement(renderItem(value), {
            onClick: () => {
              navigator.pushPage({
                component: SelectionPage,
                path: `Select_${name}`,
                name,
                value,
                searchAPI,
                searchAPIOptions,
                title,
                placeholder,
                onChange,
                notFoundContent,
                closeOnSelect,
                targetName,
                liveSearch,
                all,
                goBack: () => navigator.popPage(),
              }, { animation: 'slide' })
            }
          })
        }
      </div>
    )
  }
}

ManyToOne.propTypes = {
  name: PropTypes.string,
  title: PropTypes.string,
  targetName: PropTypes.string,
  searchAPI: PropTypes.func,
  searchAPIOptions: PropTypes.object,
  value: PropTypes.any,
  onChange: PropTypes.func,
  renderItem: PropTypes.func,
  navigator: PropTypes.any,
  closeOnSelect: PropTypes.bool,
  notFoundContent: PropTypes.any,
  liveSearch: PropTypes.bool,
};

ManyToOne.defaultProps = {
  searchAPIOptions: {},
  liveSearch: true,
  closeOnSelect: true,
  notFoundContent: <h3> No Records </h3>,
};

export default ManyToOne;
