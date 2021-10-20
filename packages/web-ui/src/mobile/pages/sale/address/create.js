import React, { Component } from 'react';
import PropTypes from 'prop-types';
import connect from '../connect/sale-address';
import { Toolbar, Page, ToolbarButton, Icon } from 'react-onsenui';
import { TextInput, SubmitButton, ManyToOne } from '../../../components';
import SearchAddress from './search';
import './styles.css';
import Translate,{translate} from '../../../locale';

class CreateAddress extends Component {

  constructor(props) {
    super(props);
    this.state = {
      address: {},
    }
  }

  onInputChange(name, value) {
    const { address } = this.state;
    address[name] = value;
    this.setState({ address });
  }

  onManyToOneChange(e) {
    const { address } = this.state;
    const { name, value } = e.target;
    address[name] = value;
    this.setState({ address });
  }

  onSave() {
    const { address } = this.state;
    const { add } = this.props.address;
    add(address).then((res) => {
      this.props.route.createAddress({ ...res.data[0] });
      this.props.navigator.popPage();
    });
  }

  renderToolbar() {
    const { data } = this.props.route;
    return (
      <Toolbar noshadow modifier="transparent" style={{ background: '#fff', boxShadow: 'none' }}>
        <div className='left'>
          <ToolbarButton onClick={() => this.props.navigator.popPage()} style={{ color: '#000', fontSize: '2rem' }}>
            <Icon icon='md-chevron-left' />
          </ToolbarButton>
        </div>
        <div className='center' style={{ color: '#000' }}>{data.name || translate('common.createAddress.name')}</div>
      </Toolbar>
    );
  }

  render() {
    const { data, addressList, createAddress } = this.props.route;
    const { address } = this.state;
    const { addressL4, city, addressL7Country, addressL6 } = address;
    const { fields } = this.props.address;
    if (!fields.length) return null;
    const getField = (key) => {
      const field = fields.find(f => f.name === key);
      return field.label ? translate(field.label) : '';

    }
    return (
      <Page
        renderToolbar={() => this.renderToolbar()}
      >
        <div className="new-customer-detail-view">
          <div className='address-header' >
          {translate('common.createAddress.addressTitle')}
          </div>
          <div className="new-customer-basic-detail">
            <div style={{ fontSize: 15 }} className="txt-name">
              <TextInput
                placeholder={getField('addressL4')}
                name="addressL4"
                value={addressL4 || ''}
                onValueChange={(value) => this.onInputChange('addressL4', value)} />
            </div>
            <div className="new-customer-assignedto-container">
              <div style={{ fontSize: 15 }} className="new-customer-field">
                <div className="field-title">{getField('city')}</div>
                <div className="field-input">
                  <ManyToOne
                    navigator={this.props.navigator}
                    name="city"
                    title={getField('city')}
                    placeholder={getField('city')}
                    targetName="name"
                    value={city && (city || '')}
                    searchAPI={(e) => this.props.city.search(e)}
                    renderItem={(obj, i) => <div
                      key={i}
                    >
                      {obj ? obj.name : <span className="m2o_placeholder"><Translate text="common.manyToOneField.selectCity"/></span>}
                    </div>}
                    onChange={(e) => this.onManyToOneChange(e)}
                  />
                </div>
              </div>
            </div>

            <div style={{ fontSize: 15 }} className="txt-name">
              <TextInput
                placeholder={getField('addressL6')}
                name="addressL6"
                value={addressL6 || ''}
                onValueChange={(value) => this.onInputChange('addressL6', value)} />
            </div>
            <div className="new-customer-assignedto-container">
              <div style={{ fontSize: 15 }} className="new-customer-field">
                <div className="field-title">{getField('addressL7Country')}</div>
                <div className="field-input">
                  <ManyToOne
                    navigator={this.props.navigator}
                    name="addressL7Country"
                    title={getField('addressL7Country')}
                    placeholder={getField('addressL7Country')}
                    targetName="name"
                    value={addressL7Country && (addressL7Country || '')}
                    searchAPI={(e) => this.props.country.search(e)}
                    renderItem={(obj, i) => <div
                      key={i}
                    >
                      {obj ? obj.name : <span className="m2o_placeholder"><Translate text="common.manyToOneField.selectCountry"/></span>}
                    </div>}
                    onChange={(e) => this.onManyToOneChange(e)}
                  />
                </div>
              </div>
            </div>
          </div>
          <SubmitButton
            title={translate('common.createAddress.Add')}
            onClick={() => this.onSave()}
          />
          <div style={{ textAlign: 'center' }} > {translate('common.createAddress.or')} </div>
          <SubmitButton
            className="address-search"
            title={translate('common.createAddress.selectList')}
            onClick={() => this.props.navigator.replacePage({
              component: SearchAddress,
              customer: data,
              createAddress: (a) => createAddress(a),
              existingAddressList: addressList !== undefined ? addressList.map(a => a.id):[],
            }, { animation: 'none' })}
          />
        </div>
      </Page>
    );
  }
}

CreateAddress.propTypes = {
  navigator: PropTypes.any,
  route: PropTypes.any,
};

export default connect(CreateAddress);
