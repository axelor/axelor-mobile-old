import React, { Component } from 'react';
import Select from 'react-select';
import 'react-select/dist/react-select.css';
import './index.css';
import debounce from 'lodash.debounce';

class ManyToMany extends Component {

  constructor(props) {
    super(props);
    this.getOption = debounce(this.getOptions.bind(this), 800);
}

  getOptions (input) {
    const { searchAPI } = this.props;
    const obj = {
          search: {
            fields: ["address"],
            value: input,
          }
        }
    return searchAPI(obj)
    .then(res => {
      const { data } = res;
      return Promise.resolve({ options: data});
    })
	}

  createNewOption(e, creatableEl) {
    const { add } = this.props.createNewOption
    add({ address: e.name })
      .then(res => {
        const { data } = res;
        this.props.onCreateEmail(data);
        creatableEl.select.setState({ inputValue: '' });
      })
  }

  render() {
    let { value, onChange,fieldLabel,palceholder,labelKey,valueKey } = this.props;
    return (
      <div className="card-field inline select-control">
        <span className="m2m-label"> { fieldLabel} </span>
         <Select.AsyncCreatable
          onNewOptionClick={(e) => this.createNewOption(e, this.creatableEl)}
          ref={el => this.creatableEl = el}
          loadOptions={(e) => this.getOptions(e)}
          multi
          labelKey={labelKey}
          valueKey={valueKey}
          palceholder={palceholder}
          value={value}
          onChange={(e) => onChange(e)}
          onInputChange={(e) => this.getOptions(e)}
        />
      </div>
    );
  }
}

export default ManyToMany;
