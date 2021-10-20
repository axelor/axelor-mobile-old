import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Input } from 'react-onsenui';
import { ManyToOne, ManyToMany } from '../components';
import { connect } from '@axelor/web-client';
import Form from './form';

export class JsonFieldsComponent extends Component {
  state = {
    jsonFields: [],
  }

  componentDidMount() {
    this.props.api.jsonFields()
    .then(({ data: jsonFields = [] }) => {
      console.log(jsonFields)
      this.setState({ jsonFields });
    });
  }

  render() {
    const { data = {}, onDataChanges } = this.props;
    const { jsonFields = [] } = this.state;
    const getValue = ({ modelField, name }) => {
      try {
        return JSON.parse(data[modelField] || '{}')[name];
      } catch(e) {}
      return '';
    };
    const setValue = ({ modelField, name }) => (e) => {
      let values = {};
      try {
        values = JSON.parse(data[modelField] || '{}');
      } catch(e) {}
      onDataChanges({...data, [modelField]: JSON.stringify({...values, [name]: e.target.value }) })
    };
    const renderField = (field, props = {}) => {
      switch(field.type) {
        case 'string':
          return (
            <Form.Group key={props.key}>
              <Input
                type={field.type}
                name={field.name}
                modifier="underbar"
                float
                placeholder={field.title}
                {...props}
              />
            </Form.Group>
          );
        case 'many-to-many':
        case 'json-many-to-many':
          return (
            <Form.Group className="m2m-json-field" key={props.key}>
              <label>{field.title}</label>
              <ManyToMany
                navigator={this.props.navigator}
                name={field.name}
                title={field.title}
                placeholder={field.title}
                targetName={field.targetName}
                searchAPI={(e) => {
                  if (field.type === 'many-to-one') {
                    return this.props.api.search({ customModel: field.targetModel, ...e })
                  } else {
                    return this.props.search({
                      fields: [field.targetName],
                      search: {
                        fields: [
                          ...(((e.search || {}).fields || [])),
                          {
                            fieldName: 'jsonModel', value: field.jsonTarget, operator: '='
                          },
                        ],
                        operator: 'and',
                      }
                    })
                  }
                }}
                renderItem={(obj, i) => (
                  <ManyToMany.Chip key={i}
                    value={obj && obj[field.targetName]}
                    onDelete={() => {
                      const values = props.value;
                      values.splice(i, 1);
                      props.onChange({ target: { value: [...values] } });
                    }}
                  />
                )}
                {...props}
              />
            </Form.Group>
          )
        case 'many-to-one':
        case 'json-many-to-one':
          return (
            <ManyToOne
              style={{ width: '100%'}}
              navigator={this.props.navigator}
              name={field.name}
              title={field.title}
              placeholder={field.title}
              targetName={field.targetName}
              searchAPI={(e) => {
                if (field.type === 'many-to-one') {
                  return this.props.api.search({ customModel: field.targetModel, ...e })
                } else {
                  return this.props.search({
                    fields: [field.targetName],
                    search: {
                      fields: [
                        ...(((e.search || {}).fields || [])),
                        {
                          fieldName: 'jsonModel', value: field.jsonTarget, operator: '='
                        }
                      ],
                      operator: 'and',
                    }
                  })
                }
              }}
              renderItem={(obj, i) => (
                <Form.Selection
                  value={props.value && props.value[field.targetName]}
                  placeholder={field.title}
                />
              )}
              {...props}
            />
          );
        default:
          return null;
      }
    }
    return jsonFields.map((field, i) => (
        renderField(field, {
          value: getValue(field),
          onChange: setValue(field),
          key: i,
        })
    ))
  }
}

JsonFieldsComponent.propTypes = {
  data: PropTypes.any,
  onDataChanges: PropTypes.func,
  navigator: PropTypes.any,
  api: PropTypes.any,
}

export default connect()(JsonFieldsComponent, {
  name: 'MetaJsonRecord',
  refs: [],
});
