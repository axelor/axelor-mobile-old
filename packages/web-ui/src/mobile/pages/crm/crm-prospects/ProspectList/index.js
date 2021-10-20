import React, { Component } from 'react';
// import { SaleCustomersComponent2 } from '../../sale/customer/sale-customers';
import  { CustomerListComponent as SaleCustomersComponent }  from '../../../sale/customer/list';
import connect from '../.././connect/crm-prospect';

class CustomersPage extends Component {
  render() {
    return (
      <SaleCustomersComponent {...this.props} type="propspect"/>
    );
  }
}

export default connect(CustomersPage);
