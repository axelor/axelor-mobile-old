import React, { Component } from 'react';
// import { SaleCustomersComponent2 } from '../../sale/customer/sale-customers';
import  { CustomerListComponent as SaleCustomersComponent }  from '../../sale/customer/list';
import connect from '../connect/crm-customer';

class CustomersPage extends Component {
  render() {
    return (
      <SaleCustomersComponent {...this.props} />
    );
  }
}

export default connect(CustomersPage);
