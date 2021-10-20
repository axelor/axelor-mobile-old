import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Page from '../../page';
import { Input, ToolbarButton, Toolbar, Icon, Button } from 'react-onsenui';
import Form from '../../form';
import { ManyToOne } from '../../../components';
import Translate, { translate } from '../../../locale';
import classNames from 'classnames';
import connect from '../connect';
import { connect as reduxConnect } from 'react-redux';
import * as ACTIONS from '../../../redux/actions';

class SearchTimesheet extends Component {
  search() {
    this.props.navigator.pushPage({
      name: 'timesheets',
      search: this.props.searchFields,
    }, { animation: 'none' });
  }

  reset() {
    this.props.doSearch({});
  }

  isFormValid() {
    const { project, product, date } = this.props.searchFields;
    if ((!project || !project.id) && (!product || !product.id) && !date) return false;
    return true;
  }

  renderForm() {
    const validity = this.isFormValid();
    const { searchFields: data, doSearch } = this.props;
    const onChange = ({ target: { name, value, type, checked }}) => {
      doSearch({ ...data, [name]: type === 'checkbox' ? checked : value });
    };
    return (
      <Form>
        <ManyToOne
          style={{ width: '100%'}}
          navigator={this.props.navigator}
          name="project"
          title={translate('app.timesheet.add.select_project')}
          placeholder={translate('app.timesheet.add.project')}
          targetName="fullName"
          value={data.project}
          searchAPI={(e) => this.props.taskProject.search(e)}
          renderItem={(obj, i) => (
            <Form.Selection
              name="project"
              value={data.project ? data.project.fullName : ''}
              placeholder={translate('app.timesheet.add.project')}
            />
          )}
          onChange={onChange}
          liveSearch={false}
        />

        <ManyToOne
          style={{ width: '100%'}}
          navigator={this.props.navigator}
          name="product"
          title={translate('app.timesheet.add.select_activity')}
          placeholder={translate('app.timesheet.add.activity')}
          targetName="fullName"
          value={data.product}
          searchAPI={(e) => this.props.timesheetActivity.search(e)}
          renderItem={(obj, i) => (
            <Form.Selection
              value={data.product ? data.product.fullName : ''}
              placeholder={translate('app.timesheet.add.activity')}
            />
          )}
          onChange={onChange}
          liveSearch={false}
        />

        <Form.Group>
          <Input
            type="date"
            name="date"
            value={data.date}
            onChange={onChange}
            modifier="underbar"
            float
            placeholder={translate('app.timesheet.add.time_spent')}
          />
        </Form.Group>
        <Form.Group>
          <Button disabled={!validity} onClick={() => this.search()} modifier='large'>
            <Translate text="app.timesheet.search.search" />
          </Button>
        </Form.Group>
      </Form>
    );
  }


  renderToolbar(title) {
    const validity = this.isFormValid();
    return (
      <Toolbar noshadow modifier="transparent">
        <div className='left'>
          <ToolbarButton onClick={() => this.props.navigator.replacePage({ name: 'timesheets' })}>
            <Icon icon={'md-arrow-left'} />
          </ToolbarButton>
        </div>
        <div className='center'>
          <Translate text="app.timesheet.search.title" />
        </div>
        <div className='right adjust-right'>
          <ToolbarButton className={classNames('btn-custom', { 'disabled': !validity })} onClick={() => validity && this.reset()}>
            <Translate text="app.timesheet.search.reset" />
          </ToolbarButton>
        </div>
      </Toolbar>
    );
  }

  render() {
    return (
      <Page
        {...this.props}
        renderToolbar={() => this.renderToolbar()}
      >
        <div className="page-content hr-form-page">
          {
            this.renderForm()
          }
        </div>
      </Page>
    );
  }
}

SearchTimesheet.propTypes = {
  navigator: PropTypes.any,
  route: PropTypes.any,
};

const mapStateToProps = ({ search }) => ({ searchFields: search.timesheet });
const mapDispatchToProps = (dispatch) => ({ doSearch: (fields) => dispatch(ACTIONS.searchData('timesheet', fields)) });

SearchTimesheet = reduxConnect(mapStateToProps, mapDispatchToProps)(SearchTimesheet);

export default connect(SearchTimesheet);
