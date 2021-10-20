import React from 'react';
import PageListComponent, { Typo } from '../page-list';
import { connect } from '@axelor/web-client';

class CustomerList extends PageListComponent {
  getFetchOptions(searchOptions) {
    return super.getFetchOptions(searchOptions, {
      fields: ['fixed_phone', 'full_name']
    });
  }

  renderListSearch() {
    return super.renderListSearch({ placeholder: 'Search by Customer' });
  }

  renderRow(row, index) {
    return (
      <div>
        <Typo variant="title"> {row.full_name} </Typo>
        <Typo variant="body"> {row.mobile_phone} </Typo>
        <Typo variant="body"> {row['email_address.address'] || (row.email_address || {}).name} </Typo>
      </div>
    )
  }

  renderPageTitle() {
    return (
      <React.Fragment>
        <div className='center'>
          Customers
        </div>
      </React.Fragment>
    )
  }
}

export default connect()(CustomerList, {
  name: 'SaleContact',
});
