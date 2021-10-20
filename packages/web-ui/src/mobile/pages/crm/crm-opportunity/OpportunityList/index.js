import React from 'react';
import moment from 'moment';
import PropTypes from 'prop-types';
import connect from '../../connect/crm-opportunity';
import { Icon } from 'react-onsenui';

import './index.css';
import Translate, { translate } from '../../../../locale';
import OpportunityView from './../OpportunityView';
import { saleStageType } from './../common';
import PageListTabsComponent, { Typo } from '../../../page-tabs-list';

class OpportunityList extends PageListTabsComponent {
  constructor(props) {
    super(props, {}, {
      fetchRelatedFields: { lead: ['firstName', 'name', 'company', 'companyName'] },
    });
  }
  getAPI() {
    return this.props.api;
  }

  getFetchSearchOptions(keyword) {
    const index = Object.keys(saleStageType).find(type => saleStageType[type] === keyword);
    const searchCriteria = {
      fields: [
        { fieldName: 'name', value: keyword, operator: 'like' },
        { fieldName: 'sales_stage_select', value: Number(index), operator: '=' },
      ],
      operator: 'or',
    };
    if (moment(keyword).isValid()) {
      searchCriteria.fields = [
        { fieldName: 'expected_close_date', fieldType: 'date', value: moment(keyword).startOf('day').format(''), operator: '=' },
      ];
      searchCriteria.operator = 'or';
    }
    return searchCriteria;
  }

  getFetchFilterOptions(filter) {
    return {
      fields: [
        { fieldName: 'opportunity_type.id', value: filter, operator: '=' }
      ],
      operator: 'and',
    };
  }

  // overall filter, you can used to customize limit, sortBy, offset etc
  getFetchOptions(searchOptions) {
    return super.getFetchOptions({
      ...searchOptions,
      sortBy: ['-expected_close_date'],
    })
  }

  viewOpportunity(record) {
    const { data } = this.state;
    const index = data.findIndex(d => d.id === record.id);
    this.props.navigator.pushPage({
      component: OpportunityView,
      path: 'OpportunityView',
      onUpdate: (record) => {
        const target = data.findIndex(d => d.id === record.id);
        data[target] = { ...record };
        this.setState({ data: [...data] });
      },
      removeRecord: (record) => {
        const targetIndex = data.findIndex(o => o.id === record.id);
        data.splice(targetIndex, 1);
        this.setState({ data });
      },
      data: record,
      recordIndex: index,
      getRecordsByIndex: (record, isMount) => this.getRecordsByIndex(record, isMount),
    },
      { animation: 'none' })
  }

  addOpportunity() {
    const { data } = this.state;
    this.props.navigator.pushPage({
      component: OpportunityView,
      path: 'OpportunityView',
      onUpdate: (record) => {
        const target = data.findIndex(d => d.id === record.id);
        data[target] = { ...record };
        this.setState({ data: [...data] });
      },
      removeRecord: (record) => {
        const targetIndex = data.findIndex(o => o.id === record.id);
        data.splice(targetIndex, 1);
        this.setState({ data });
      },
      getRecordsByIndex: (record, isMount) => this.getRecordsByIndex(record, isMount),
      onNewUpdate: (record) => this.setState({ data: [record, ...data] })
    },
      { animation: 'none' })
  }

  onListItemClick(item) {
    return this.viewOpportunity(item);
  }

  getListTabsData() {
    return [
      { text: <Translate text={'Opportunity.type.all'} />, value: 0 },
      { text: <Translate text={'Opportunity.type.new'} />, value: 1 },
      { text: <Translate text={'Opportunity.type.recurring'} />, value: 2 },
      { text: <Translate text={'Opportunity.type.existing'} />, value: 3 },
    ];
  }

  renderRow(item, index) {
    return (
      <div>
        <Typo variant="title"> {item.name} </Typo>
        <Typo variant="body"> {translate(`Opportunity.${saleStageType[item.sales_stage_select]}`)} </Typo>
        <Typo variant="body"> {moment(item.expected_close_date).format('DD MMM YYYY')} </Typo>
        <Typo variant="body"> {item.user && item.user.full_name} </Typo>
        <Typo variant="body"> {item.partner && item.partner.full_name} </Typo>
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
          <Translate text="opportunity_title" />
        </div>
        <div className='right icons  list_add_button'>
          <div style={{ flex: 1 }} onClick={() => this.addOpportunity()}>
            <div className="round-icon add-button-icon" style={{ margin: '0px auto' }}>
              <Icon icon='md-plus' />
            </div>
          </div>
        </div>
      </React.Fragment>
    )
  }

}

OpportunityList.propTypes = {
  navigator: PropTypes.any,
  route: PropTypes.any,
};

export default connect(OpportunityList);
