import React, { Component } from 'react';
import { ContactListComponent as SaleContactsComponent } from '../../sale/contact/list';
import connect from '../connect/crm-contact';

class ContactsPage extends Component {
  render() {
    return (
      <SaleContactsComponent {...this.props} />
    );
  }
}

export default connect(ContactsPage);
