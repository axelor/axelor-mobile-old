import React from 'react';
import PropTypes from 'prop-types';
import { Icon } from 'react-onsenui';

import connect from '../../connect/crm-lead';
import Translate from '../../../../locale';
import PageListComponent, { Typo } from '../../../page-list';

import './index.css';
import LeadView from './../LeadView';

class LeadList extends PageListComponent {
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

  addLead() {
    const { data } = this.state;
    this.props.navigator.pushPage({
      component: LeadView,
      path: 'LeadView',
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
      onNewUpdate: (record) => this.setState({ data: [record, ...data] })
    },
      { animation: 'none' });
  }

  viewLead(record) {
    const { data } = this.state;
    const index = data.findIndex(d => d.id === record.id);
    this.props.navigator.pushPage({
      component: LeadView,
      path: 'LeadView',
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
    return this.viewLead(item);
  }

  renderRow(item, index) {
    return (
      <div>
        <Typo variant="title"> {item.first_name} {item.name}</Typo>
        <Typo variant="body"> {item.company} </Typo>
        <Typo variant="body"> {item.fixed_phone} </Typo>
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
          <Translate text="lead_leads" />
        </div>
        <div className='right icons  list_add_button'>
          <div style={{ flex: 1 }} onClick={() => this.addLead()}>
            <div className="round-icon add-button-icon" style={{ margin: '0px auto' }}>
              <Icon icon='md-plus' />
            </div>
          </div>
        </div>
      </React.Fragment>
    )
  }
}

LeadList.propTypes = {
  navigator: PropTypes.any,
  route: PropTypes.any,
};

export default connect(LeadList);
