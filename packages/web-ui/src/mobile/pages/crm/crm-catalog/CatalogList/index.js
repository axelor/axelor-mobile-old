import React from 'react';
import PropTypes from 'prop-types';
import { Icon } from 'react-onsenui';
import { connect as reduxConnect } from 'react-redux';

import connect from '../../connect/crm-catalog';
import Translate from '../../../../locale';
import PageListComponent, { Typo } from '../../../page-list';

import './index.css';
import CatalogView from '../CatalogView';

class CatalogList extends PageListComponent {
  constructor(props) {
    super(props, {}, {
      fetchRelatedFields: {},
    });
  }
  getAPI() {
    return this.props.api;
  }

  getFetchOptions(searchOptions) {
    return super.getFetchOptions(searchOptions, {
      fields: ['name', 'first_name', 'company']
    });
  }

  addCatalog() {
    const { data } = this.state;
    this.props.navigator.pushPage({
      component: CatalogView,
      path: 'CatalogView',
      onUpdate: (record) => {
        const target = data.findIndex(d => d.id === record.id);
        data[target] = { ...record };
        this.setState({ data: [...data] });
      },
      removeRecord: (record) => {
        const targetIndex = data.findIndex(l => l.id === record.id);
        data.splice(targetIndex, 1);
        this.setState({ data });
      },
      getRecordsByIndex: (record, isMount) => this.getRecordsByIndex(record, isMount),
      onNewUpdate: (record) => {
        this.setState({ data: [record, ...data] })
      }
    },
      { animation: 'none' });
  }

  viewCatalog(record) {
    const { data } = this.state;
    const index = data.findIndex(d => d.id === record.id);
    this.props.navigator.pushPage({
      component: CatalogView,
      path: 'CatalogView',
      onUpdate: (record) => {
        const target = data.findIndex(d => d.id === record.id);
        data[target] = { ...record };
        this.setState({ data: [...data] });
      },
      removeRecord: (record) => {
        const targetIndex = data.findIndex(l => l.id === record.id);
        data.splice(targetIndex, 1);
        this.setState({ data });
      },
      data: record,
      recordIndex: index,
      getRecordsByIndex: (record, isMount) => this.getRecordsByIndex(record, isMount),
    },
      { animation: 'none' });
  }

  onListItemClick(item) {
    return this.viewCatalog(item);
  }

  renderRow(item, index) {
    return (
      <div className="list-row" key={item.id}>
        <div>
          <Typo variant="title"> {item.name} </Typo>
          <Typo variant="body"> {item.catalogType && item.catalogType.name} </Typo>
        </div>
        {
          this.props.app.mode === 'offline' ? '' :
            <div>
              {
                item.pictureURL &&
                <img src={item.pictureURL} style={{ width: 75, height: 75 }} alt="customer img" />
              }
            </div>
        }
      </div>
    )
  }

  renderList() {
    return super.renderList({
      style: { marginTop: 45, marginBottom: 50, backgroundImage: 'none' },
    });
  }

  renderPageTitle() {
    return (
      <React.Fragment>
        <div className='center center-align-title'>
          <Translate text="Catalog.appTitle" />
        </div>
        <div className='right icons  list_add_button'>
          <div style={{ flex: 1 }} onClick={() => this.addCatalog()}>
            <div className="round-icon add-button-icon" style={{ margin: '0px auto' }}>
              <Icon icon='md-plus' />
            </div>
          </div>
        </div>
      </React.Fragment>
    )
  }
}

CatalogList.propTypes = {
  navigator: PropTypes.any,
  route: PropTypes.any,
};

const mapPropsToState = (state) => ({ app: state.app, user_data: state.user });
CatalogList = reduxConnect(mapPropsToState)(CatalogList);

export default connect(CatalogList);
