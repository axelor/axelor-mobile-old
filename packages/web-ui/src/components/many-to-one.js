import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import debounce from 'lodash.debounce';
import Select from 'react-select';

export const getEventObject = (name, value) => ({ target: { name, value }});

export class ManyToOne extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data: [],
      loading: false,
    };
    this.fetchAPI = debounce(this.fetchData.bind(this), 800);
  }

  fetchData(search = '') {
    const { targetName = 'id' } = this.props;
    this.setState({ loading: true });
    const options = { fields: [targetName], limit: 10 };
    if (search) {
      // options.data.criteria = [{ fieldName: targetName, operator: 'like', value: search }];
    }
    this.props.api(options)
    .then(({ data = [] }) => {
      this.setState({ data, loading: false })
    });
  }

  getValueById(id) {
    return this.state.data.find(r => `${r.id}` === `${id}`);
  }

  render() {
    const { data, loading } = this.state;
    const { placeholder: title, onChange, className, value: propValue, targetName, targetKey, name, ...rest } = this.props;
    const value = propValue ? { key: `${propValue.id}`, label: propValue[targetName] } : undefined;
    return (
      <Select
        {...rest}
        noResultsText={loading ? 'Loading...' : `No ${title} Found`}
        isLoading={loading}
        className={classNames('select-control', className, { 'selected': value })}
        options={data.map(e => ({ value: e[targetKey], label: e[targetName]}))}
        searchable
        placeholder={`Select ${title}`}
        onFocus={() => this.fetchData()}
        onInputChange={(e) => {
          if (e) {
            this.fetchAPI(e);
          }
        }}
        onChange={(e) => {
          console.log('change', e);
          onChange(getEventObject(name, e && e.value ? this.getValueById(e.value) : e))
        }}
        value={value}
        clearable
      />
    )
  }
}

ManyToOne.propTypes = {
  name: PropTypes.string,
  placeholder: PropTypes.string,
  className: PropTypes.any,
  targetKey: PropTypes.string,
  targetName: PropTypes.string,
  api: PropTypes.func,
  value: PropTypes.any,
  onChange: PropTypes.func,
};

ManyToOne.defaultProps = {
  targetKey: 'id',
};

export default ManyToOne;
