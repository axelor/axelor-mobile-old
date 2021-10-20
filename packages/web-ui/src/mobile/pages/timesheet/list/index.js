import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { Icon } from 'react-onsenui';
import Translate from '../../../locale';
import TimesheetTimer from '../timer';
import connect from '../connect';
// import { connect as reduxConnect } from "react-redux";
import PageListComponent, { Typo } from '../../page-list';
import ViewTimesheet from '../view';
import './index.css';

class TimesheetList extends PageListComponent {

  getAPI() {
    return this.props.api;
  }

  getSearchFields() {
    const { search: criteriaOptions = {} } = this.props.route;
    const { project, product, date } = criteriaOptions;
    const fields = [];
    if (project && project.id) {
      fields.push({ fieldName: 'project.id', value: project.id, operator: '=' });
    }
    if (product && product.id) {
      fields.push({ fieldName: 'product.id', value: product.id, operator: '=' });
    }
    if (date) {
      fields.push({ fieldName: 'date', value: date, operator: '=' });
    }
    const options = {};
    if (fields.length) {
      options['search'] = { fields: [{ fields, operator: 'and' }], operator: 'and' };
    }
    return options;
  }

  getFetchOptions(searchOptions) {
    const value = this.state.keyword;
    const searchFields = this.getSearchFields();
    searchOptions = value ? {
      fields: [
        { fieldName: 'project.fullName', value, operator: 'like' },
        { fieldName: 'product.fullName', value, operator: 'like' },
      ],
      operator: 'or',
    } : searchOptions;

    if (value && moment(value).isValid()) {
      searchOptions.fields = [{ fieldName: 'date', fieldType: 'date', value, operator: '=' }];
    }

    let options = { search: searchOptions };
    if (searchFields.search) {
      if (searchOptions.fields) {
        searchFields.search.fields.push(searchOptions);
      }
      options = searchFields;
    }
    return options;
  }

  startTimer() {
    this.props.navigator.pushPage({
      path: 'timesheet_timer',
      component: TimesheetTimer,
      start_timer: true,
    }, { animation: 'none' });
  }

  addTimesheet() {
    this.props.navigator.pushPage({
      component: ViewTimesheet,
      path: 'add_timesheet',
      navigator: this.props.navigator,
      addRecord: (record) => {
        const { data } = this.state;
        data.splice(0, 0, record)
      },
      updateRecord: (record) => {
        const { data } = this.state;
        const targetIndex = data.findIndex(l => l.id === record.id);
        data[targetIndex] = record;
        this.setState({ data });
      },
      removeRecord: (record) => {
        const { data } = this.state;
        const targetIndex = data.findIndex(l => l.id === record.id);
        data.splice(targetIndex, 1);
        this.setState({ data });
      },
      getRecordsByIndex: (record, isMount) => this.getRecordsByIndex(record, isMount),
    }, { animation: 'none' });
  }

  editTimesheet(record) {
    this.props.navigator.pushPage({
      component: ViewTimesheet,
      path: 'edit_timesheet',
      data: record,
      navigator: this.props.navigator,
      removeRecord: (record) => {
        const { data } = this.state;
        const targetIndex = data.findIndex(l => l.id === record.id);
        data.splice(targetIndex, 1);
        this.setState({ data });
      },
      updateRecord: (record) => {
        const { data } = this.state;
        const targetIndex = data.findIndex(l => l.id === record.id);
        data[targetIndex] = record;
        this.setState({ data });
      },
      getRecordsByIndex: (record, isMount) => this.getRecordsByIndex(record, isMount),
    }, { animation: 'none' });
  }

  onListItemClick(item) {
    return this.editTimesheet(item);
  }

  renderRow(item, index) {
    return (
      <div>
        <Typo variant="title"> {item.project && item.project.fullName} </Typo>
        <Typo variant="body"> {item.product && item.product.fullName} </Typo>
        <Typo variant="body"> {item.durationStored} Hrs. </Typo>
        <Typo variant="body"> {moment(item.date).format('DD MMM YYYY')} </Typo>
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
          <Translate text="app.timesheet.list.title" />
        </div>
        <div className='right icons list_add_button'>
          <div style={{ flex: 1 }} onClick={() => this.addTimesheet()}>
            <div style={{ color: "rgba(44, 196,211,1)", margin: '0px auto' }} className="round-icon">
              <Icon icon='md-plus' />
            </div>
          </div>
        </div>
      </React.Fragment>
    )
  }
}

TimesheetList.propTypes = {
  navigator: PropTypes.any,
  route: PropTypes.any,
};

export default connect(TimesheetList);
