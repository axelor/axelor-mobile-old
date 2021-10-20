import React from 'react';
import PropTypes from 'prop-types';
import { connect as reduxConnect } from 'react-redux';
import PageListComponent, { Typo } from '../../../page-list';
import { Icon } from 'react-onsenui';
import connect from '../../connect/sale-contact';
import ContactView from '../../contact/view';
import Translate,{translate} from '../../../../locale';

export class ContactList extends PageListComponent {

  constructor(props) {
    super(props, {}, {
      fetchRelatedFields: {
        contactPartnerSet: ['fullName'],
        partnerAddressList: ['fullName'],
        emailAddress: ['fullName']
      },
    });
  }

  getAPI() {
    return this.props.api;
  }

  addContact() {
    const { navigator } = this.props;
    navigator.pushPage({
      component: ContactView,
      key: "add_contact_" + Date.now(),
      navigator,
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
    }, { animation: 'none' })
  }

  viewContact(row, index) {
    if (this.props.route.addContact) {
      this.props.route.addContact(row);
      this.props.navigator.popPage();
    } else {
      const { navigator } = this.props;
      navigator.pushPage({
        component: ContactView,
        key: "view_customer_" + Date.now(),
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
        data: row,
        navigator,
        getRecordsByIndex: (record, isMount) => this.getRecordsByIndex(record, isMount),
      }, { animation: 'none' })
    }
  }

  getSearchFields() {
    const fields = [];
      fields.push({ fieldName: 'isContact', value: true, operator: '=' });
      fields.push({ fieldName: 'mainPartner.isCustomer', value: true, operator: '=' })
    const options = {};
    if (fields.length) {
      options['search'] = { fields: [{ fields, operator: 'and' }], operator: 'and' };
    }
    return options;
  }

  getFetchOptions(searchOptions = {}) {
    const value = this.state.keyword;
    const searchFields = this.getSearchFields();
    searchOptions = value ? {
      fields: [
        { fieldName: 'name', value, operator: 'like' },
      ],
      operator: 'or',
    } : searchOptions;


    let options = { search: searchOptions };
    if (searchFields.search) {
      if (searchOptions.fields) {
        searchFields.search.fields.push(searchOptions);
      }
      options = searchFields;
    }
    return options;
  }
  // getFetchOptions(searchOptions) {
  //   return super.getFetchOptions(searchOptions, {
  //     fields: ['fixed_phone', 'full_name']
  //   });
  // }

  renderListSearch() {
    return super.renderListSearch({ placeholder: translate('commom.searchByContact') });
  }

  onListItemClick(row, index) {
    return this.viewContact(row, index)
  }

  findEmailAddress(customer) {
    const { email_address = {} } = customer;
    let emailAddress = customer.email_address && customer.email_address.name ? email_address.name.substring(email_address.name && email_address.name.indexOf('[') + 1, email_address.name.lastIndexOf(']')) : '';
    if (customer.email_address && customer.email_address.address) {
      return email_address.address
    } else {
      return emailAddress;
    }
  }

  renderRow(row, index) {
    return (
      <div className="list-row">
        <div>
          <Typo variant="title"> {row.name} {row.first_name} </Typo>
          <Typo variant="body"> {row.fixed_phone} </Typo>
          <Typo variant="body"> {this.findEmailAddress(row)} </Typo>
        </div>
        {
          this.props.app.mode === 'offline' ? '' :
            <div>
              {
                row.pictureURL &&
                <img src={row.pictureURL} style={{ width: 75, height: 75 }} alt="customer img" />
              }
            </div>
        }
      </div>
    )
  }

  renderPageTitle() {
    return (
      <React.Fragment>
        <div className='center center-align-title'>
          <Translate text="common.contactTitle" />
        </div>
        <div className="right icons  list_add_button">
          <div style={{ flex: 1 }} onClick={() => this.addContact()}>
            <div style={{ color: "rgba(44, 196,211,1)", margin: '0px auto' }} className="round-icon">
              <Icon icon='md-plus' />
            </div>
          </div>
        </div>

      </React.Fragment>
    )
  }
}

ContactList.propTypes = {
  navigator: PropTypes.any,
  route: PropTypes.any,
};

const mapPropsToState = (state) => ({ app: state.app, user_data: state.user });
ContactList = reduxConnect(mapPropsToState)(ContactList);

export const ContactListComponent = ContactList;

export default connect(ContactList);
