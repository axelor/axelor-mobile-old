import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { connect } from '@axelor/web-client';
import { typeSelect } from './../crm/crm-events/common';
import Translate, { translate } from '../../locale';
import PageListTabsComponent, { Typo } from '../page-tabs-list';

class EventsPage extends PageListTabsComponent {
  // tabs filter fields
  getFetchFilterOptions(filter) {
    return {
      fields: [
        { fieldName: 'status_select', value: filter, operator: '=' }
      ],
      operator: 'and',
    };
  }

  // searchbar filter fields
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
      sortBy: ['subject'],
    })
  }

  getListTabsData() {
    return [
      { text: <Translate text={'event_All'}/>, value: 0 },
      { text: <Translate text={'event_Planned'} />, value: 1 },
      { text: <Translate text={'event_Realized'} />, value: 2 },
      { text: <Translate text={'event_Canceled'} />, value: 3 },
    ];
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
}

EventsPage.propTypes = {
  navigator: PropTypes.any,
  route: PropTypes.any,
};

export default connect()(EventsPage, {
  name: 'Event',
  refs: [{
    model: 'User', field: 'user'
  },{
    model: 'CRMCustomer', field: 'client_partner'
  }, {
    model: 'MeetingType', field: 'meeting_type'
  }, {
    model: 'Lead', field: 'lead'
  }, {
    model: 'CRMContact', field: 'contact_partner'
  }],
});
