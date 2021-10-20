import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Icon, ToolbarButton, SearchInput, Toolbar, Page, ListItem, Checkbox, ProgressCircular } from 'react-onsenui';
import ManyToManyChipItem from './chip';
import debounce from 'lodash.debounce';
import './styles.css';

export const getEventObject = (name, value) => ({ target: { name, value }});

class SelectionPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data: [],
      values: props.route.values || [],
      loading: true,
      pager: {
        offset: 0,
        limit: 20,
        total: 0,
      },
      search: '',
      searchText: ''
    };
    this.search = debounce(this.search.bind(this), 800);
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
      const newData = isSearch ? data :  [...stateData, ...data];
      this.setState({ loading: false, data: newData, pager: { ...pager, total, offset: options.offset } }, this.forceUpdate);
    });
  }

  search({ target: { value = '' }}) {
    if (this.searchText !== value) {
      this.searchText = value;
      this.setState({ searchText: value})
      this.fetchData(value);
    }
  }

  getValueById(id) {
    return this.state.data.find(r => r.id === Number(id));
  }

  handleChange(row, status) {
    const { values } = this.state;
    if (status) {
      values.push(row);
    } else {
      const ind = values.findIndex(v => v.id === row.id);
      values.splice(ind, 1);
    }
    this.setState({ values: [...values] });
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

  renderRow(row) {
    const { values } = this.state;
    const { targetName, renderListItem } = this.props.route;
    const isSelected = !!values.find(e => e.id === row.id);
    const onChange = (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.handleChange(row, !isSelected);
    };
    return (
      <ListItem key={row.id} tappable>
        <label className='left'>
          <Checkbox
            inputId={`checkbox-${row.id}`}
            value={`${row.id}`}
            checked={isSelected}
            onChange={onChange}
          />
        </label>
        <label htmlFor={`checkbox-${row.id}`} className='center'>
          {renderListItem ? renderListItem(row) : row[targetName]}
        </label>
      </ListItem>
    )
  }

  renderToolbar() {
    const { values } = this.state;
    const { onNavigate, title, targetName, name, onChange } = this.props.route;
    return (
      <Toolbar style={{ background: '#fff' }}>
        <div className='left'>
          <ToolbarButton onClick={() => onNavigate('popPage')} style={{ color: '#000' }}>
            <Icon icon='md-arrow-left' />
          </ToolbarButton>
        </div>
        <div className='center' style={{ color: '#000' }}>{title}</div>
        <div className='right'>
          <ToolbarButton onClick={() => {
              onChange(getEventObject(name, values.map(v => ({ id: v.id, [targetName]: v[targetName] }))));
              onNavigate('popPage');
            }} style={{ color: '#000', fontSize: 36, padding: 0, marginRight: 20 }}>
            <Icon icon='md-check' />
          </ToolbarButton>
        </div>
      </Toolbar>
    );
  }

  onNewCreateOption() {
    const value = this.state.searchText;
    const { onNewCreateOption } = this.props.route;
    onNewCreateOption(value);
    // this.searchText = ''
    this.setState({
      searchText: '',
    })
  }

  render() {
    const { data, loading } = this.state;
    const { placeholder, notFoundContent, isCreatable } = this.props.route;
    return (
      <Page
        ref={e => this.pageRef = e}
        renderToolbar={() => this.renderToolbar()}
        onInfiniteScroll={(done) => this.onLoadMore(done)}
      >
        <div ref={list => this._list = list}>
          <div style={{ padding: 12 }}>
            <SearchInput style={{ width: '100%' }} value={this.state.searchText} placeholder={placeholder} onChange={this.search} />
          </div>
          {
            loading &&
            <div style={{ textAlign: 'center', padding: 5 }}>
              <ProgressCircular indeterminate />
            </div>
          }

          {
            isCreatable && this.state.searchText ?
            <div style={{paddingLeft: '10px'}} onClick={() => this.onNewCreateOption()}> Create "{this.state.searchText}"</div>
            : ''
          }
          {
            data.map(e => this.renderRow(e))
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

export class ManyToMany extends Component {
  render() {
    const { title, isEditable, placeholder, value: values, onChange, targetName, searchAPI, searchAPIOptions, notFoundContent, name, renderItem, renderListItem, navigator,isCreatable,onNewCreateOption, ...restProps } = this.props;
    return (
      <div
        {...restProps}
        className={classNames('m2m-container', restProps.className)}
      >
        {
          (values || []).map((v, i) => renderItem(v, i))
        }
        {
          isEditable &&
          <div className="m2m-actions">
            <Icon
              className="m2m-action"
              icon="md-plus-circle-o"
              onClick={() => {
                navigator.pushPage({
                  component: SelectionPage,
                  path: `Select_${name}`,
                  name,
                  values,
                  searchAPI,
                  searchAPIOptions,
                  title,
                  placeholder,
                  onChange,
                  notFoundContent,
                  targetName,
                  renderListItem,
                  isCreatable,
                  onNewCreateOption,
                  onNavigate: (method, ...options) => navigator[method](...options)
                }, { animation: 'slide' })
              }}
            />
          </div>
        }
      </div>
    )
  }
}

ManyToMany.propTypes = {
  name: PropTypes.string,
  title: PropTypes.string,
  targetName: PropTypes.string,
  searchAPI: PropTypes.func,
  searchAPIOptions: PropTypes.object,
  value: PropTypes.any,
  onChange: PropTypes.func,
  renderItem: PropTypes.func,
  renderListItem: PropTypes.func,
  navigator: PropTypes.any,
  notFoundContent: PropTypes.any,
  isEditable: PropTypes.bool,
};

ManyToMany.defaultProps = {
  searchAPIOptions: {},
  notFoundContent: <h3> No Records </h3>,
  isEditable: true,
};

ManyToMany.Chip = ManyToManyChipItem;

export default ManyToMany;
