import { connect } from '@axelor/web-client';

const mapConnectToProps = (props) => {
  const { refs: { country, city, partneraddress }, ...address } = props;
  return { city, country, address, partneraddress };
}

export const model = {
  name: 'Address',
  refs: [{
    model: 'Address'
  }, {
    model: 'City'
  }, {
    model: 'Country'
  }],
};

export default (SaleComponent) => connect(mapConnectToProps)(SaleComponent, model);
