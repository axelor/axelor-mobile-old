import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import debounce from 'lodash.debounce';
import { connect as reduxConnect } from 'react-redux';
import { connect } from '@axelor/web-client';
import Page from '../../page';
import {  ListItem, List, ProgressCircular } from 'react-onsenui';
import { translate } from '../../../locale';
import { SearchInput } from '../../../components';

class SearchAddress extends Component {
  constructor(props) {
    super(props)
    this.state = {
      addresses: [],
      search: '',
      uploading: false,
      alert: null,
      pager: {
        offset: 0,
        limit: 20,
        total: 0,
      },
    }
    this.infiniteScroller = debounce(this.infiniteScroller.bind(this), 500);
    this.search = debounce(this.search.bind(this), 600);
  }

  componentDidMount() {
    this.fetchData();
  }

  fetchData(options = {}, keyword = null) {
    this.setState({ loading: true });
    const { searchAll } = this.props.address;
    const API = searchAll;
    const isSearch = keyword !== null;
    options = { ...options, ...this.state.pager }
    if (isSearch) {
      options.offset = 0;
    }
    delete options.total;
    API({ ...options })
      .then(({ data = [], total }) => {
        data = data.filter(d => !this.props.route.existingAddressList.includes(d.id));
        const { pager, addresses } = this.state;
        const newAddresses = isSearch ? data : [...addresses, ...data]
        if (data) {
          this.setState({ loading: false, addresses: newAddresses, pager: { ...pager, total, offset: options.offset } })
        }
      });
  }

  search(e) {
    const { value } = e.target;
    if (value !== this.state.search) {
      this.setState({ search: e.target.value });
      this.fetchData({
        search: {
          fields: ['fullName'],
          value: e.target.value,
        }
      }, e.target.value);
    }
  }

  infiniteScroller() {
    if (!this._list) {
      return;
    }
    this._list = ReactDOM.findDOMNode(this._list);
    const el = this._list;
    const offset = el.scrollHeight - el.parentNode.scrollTop - el.parentNode.clientHeight;

    if (offset <= 0) {
      const { pager } = this.state;
      pager.offset = pager.offset + pager.limit;
      const hasMore = pager.total > pager.offset;
      if (hasMore) {
        this.setState({ loading: true, pager: { ...pager } }, () => {
          el.parentNode.scrollTop = el.parentNode.scrollTop + 150;
          this.fetchData();
        });
      }
    }
  }

  renderRow(row, index) {
    return (
      <ListItem
        className={classNames('record')}
        key={index}
        onClick={() => {
          this.props.route.createAddress(row);
          this.props.navigator.popPage();
        }}
      >
        <div className="customer-item">
          <span className="customer-item-name-field">{row.fullName}</span>
        </div>
      </ListItem>
    )
  }
  render() {
    let { addresses, search, loading = false } = this.state;
    const { customer } = this.props.route;
    return (
      <Page
        {...this.props}
        title={[
          <div key={0} className='center' style={{ color: '#000' }}>{customer.full_name}</div>,
        ]}
        onScroll={this.infiniteScroller}
      >
        <div className="page-content" ref={list => this._list = list}>
          <div className="searchbar">
            <SearchInput placeholder={translate('common.search')} value={search} onChange={this.search} style={{ width: '90%' }} />
          </div>
          <div className="customer-list">
            <List
              dataSource={addresses}
              renderRow={(row, index) => this.renderRow(row, index)}
            />
          </div>
          {
            loading &&
            <div className="loader-ui" style={{ marginBottom: 30 }}>
              <ProgressCircular indeterminate />
            </div>
          }
        </div>
      </Page>
    );
  }
}

SearchAddress.propTypes = {
  navigator: PropTypes.any,
  route: PropTypes.any,
};

const mapPropsToState = (state) => ({ app: state.app });
SearchAddress = reduxConnect(mapPropsToState)(SearchAddress);

export const SearchAddressComponent = SearchAddress;

const mapConnectToProps = (props) => {
  const { ...address } = props;
  return { address };
}

const mapConnectConfig = {
  name: 'Address',
};
export default connect(mapConnectToProps)(SearchAddress, mapConnectConfig);
