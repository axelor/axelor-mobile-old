import React from 'react';
import PropTypes from 'prop-types';
import { connect } from '@axelor/web-client';
import moment from 'moment';
import { Icon } from 'react-onsenui';
import './index.css';

import EventView from './../EventView';
import { typeSelect } from './../common';

import Translate, { translate } from '../../../../locale';
import PageListTabsComponent, { Typo } from '../../../page-tabs-list';

class EventList extends PageListTabsComponent {
  constructor(props) {
    super(props, {}, {
      fetchRelatedFields: { lead: ['firstName', 'name', 'company', 'companyName'] },
    });
  }

  getFetchFilterOptions(filter) {
    return {
      fields: [
        { fieldName: 'status_select', value: filter, operator: '=' }
      ],
      operator: 'and',
    };
  }

  getFetchSearchOptions(keyword) {
    const searchCriteria = {
      fields: [
        { fieldName: 'subject', value: keyword, operator: 'like' },
      ],
      operator: 'or',
    };
    if (moment(keyword).isValid()) {
      searchCriteria.fields = [
        { fieldName: 'start_date_time', fieldType: 'date', value: moment(keyword).startOf('day').format(''), operator: '>=' },
        { fieldName: 'end_date_time', fieldType: 'date', value: moment(keyword).endOf('day').format(''), operator: '<=' },
      ];
      searchCriteria.operator = 'and';
    }
    return searchCriteria;
  }

  // overall filter, you can used to customize limit, sortBy, offset etc
  getFetchOptions(searchOptions) {
    return super.getFetchOptions({
      ...searchOptions,
      sortBy: ['start_date_time'],
    })
  }

  addEvent() {
    const { data } = this.state;
    this.props.navigator.pushPage({
      component: EventView,
      path: 'EventView',
      onUpdate: (record) => {
        const target = data.findIndex(d => d.id === record.id);
        data[target] = { ...record };
        this.setState({ data: [...data] });
      },
      removeRecord: (record) => {
        const targetIndex = data.findIndex(e => e.id === record.id);
        data.splice(targetIndex, 1);
        this.setState({ data });
      },
      getRecordsByIndex: (record, isMount) => this.getRecordsByIndex(record, isMount),
      onNewUpdate: (record) => this.setState({ data: [record, ...data] })
    },
      { animation: 'none' }
    )
  }

  viewEvent(record) {
    const { data } = this.state;
    const index = data.findIndex(d => d.id === record.id);
    this.props.navigator.pushPage({
      component: EventView,
      path: 'EventView',
      onUpdate: (record) => {
        const target = data.findIndex(d => d.id === record.id);
        data[target] = { ...record };
        console.log(target, record);
        this.setState({ data: [...data] });
      },
      removeRecord: (record) => {
        const { data } = this.state;
        const targetIndex = data.findIndex(e => e.id === record.id);
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
    return this.viewEvent(item);
  }

  renderRow(row, index) {
    return (
      <div>
        <Typo variant="title"> {row.subject} </Typo>
        <Typo variant="body"> {moment(row.start_date_time).format('DD MMM YYYY HH:mm')} </Typo>
        <Typo variant="body"> {translate(`Event.${typeSelect[row.type_select]}`)} </Typo>
        <Typo variant="body"> {row.user && row.user.full_name} </Typo>
      </div>
    )
  }

  getListTabsData() {
    return [
      { text: <Translate text={'event_All'} />, value: 0 },
      { text: <Translate text={'event_Planned'} />, value: 1 },
      { text: <Translate text={'event_Realized'} />, value: 2 },
      { text: <Translate text={'event_Canceled'} />, value: 3 },
    ];
  }

  renderPageTitle() {
    return (
      <React.Fragment>
        <div className='center center-align-title'>
          <Translate text="event_events" />
        </div>
        <div className='right icons  list_add_button'>
          <div style={{ flex: 1 }} onClick={() => this.addEvent()}>
            <div className="round-icon add-button-icon" style={{ margin: '0px auto' }}>
              <Icon icon='md-plus' />
            </div>
          </div>
        </div>
      </React.Fragment>
    )
  }

}

EventList.propTypes = {
  navigator: PropTypes.any,
  route: PropTypes.any,
};

export default connect()(EventList, {
  name: 'Event',
  refs: [{
    model: 'User', field: 'user'
  }, {
    model: 'CRMCustomer', field: 'client_partner'
  }, {
    model: 'MeetingType', field: 'meeting_type'
  }, {
    model: 'Lead', field: 'lead'
  }, {
    model: 'CRMContact', field: 'contact_partner'
  }],
});
