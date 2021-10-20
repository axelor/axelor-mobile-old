import React from 'react';
import PropTypes from 'prop-types';
import { connect as reduxConnect } from 'react-redux';
import PageListComponent, { Typo } from '../../../page-list';
import { Icon } from 'react-onsenui';
import connect from '../../connect/sale-customer';
import CustomerView from '../../customer/view';
import Translate, { translate } from '../../../../locale';
import './index.css';
import '../style.css';

export class CustomerList extends PageListComponent {

  constructor(props) {
    super(props, {}, {
      fetchRelatedFields: {
        contactPartnerSet: ['fullName', 'fixedPhone'],
        partnerAddressList: ['fullName', 'address.addressL4', 'address'],
        emailAddress: ['fullName']
      },
    });
  }

  getAPI() {
    return this.props.api;
  }

  addCustomer() {
    const { navigator } = this.props;
    navigator.pushPage({
      component: CustomerView,
      key: "add_customer_" + Date.now(),
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
    })
  }

  viewCustomer(row, index) {
    if (this.props.route.addCustomer) {

    } else {
      const { navigator } = this.props;
      navigator.pushPage({
        component: CustomerView,
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
      })
    }
  }

  getFetchOptions(searchOptions) {
    return super.getFetchOptions(searchOptions, {
      fields: ['fixed_phone', 'full_name']
    });
  }

  renderListSearch() {
    return super.renderListSearch({ placeholder: translate('commom.searchByCustomer') });
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

  onListItemClick(row, index) {
    return this.viewCustomer(row, index)
  }

  renderRow(row, index) {
    console.log()
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
          <Translate text="common.customerTitle" />
        </div>
        <div className="right icons  list_add_button">
          <div style={{ flex: 1 }} onClick={() => this.addCustomer()}>
            <div style={{ color: "rgba(44, 196,211,1)", margin: '0px auto' }} className="round-icon">
              <Icon icon='md-plus' />
            </div>
          </div>
        </div>
      </React.Fragment>
    )
  }
}

CustomerList.propTypes = {
  navigator: PropTypes.any,
  route: PropTypes.any,
};

const mapPropsToState = (state) => ({ app: state.app, user_data: state.user });
CustomerList = reduxConnect(mapPropsToState)(CustomerList);

export const CustomerListComponent = CustomerList;

export default connect(CustomerList);
