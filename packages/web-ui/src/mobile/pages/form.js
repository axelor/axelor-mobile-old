import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Input } from 'react-onsenui';
import { Icon } from 'react-onsenui';

export const Form = ({ children }) => (
  <div className="hr-form">
    {children}
  </div>
);

export const FormGroup = ({ children, className }) => (
  <div className={classNames('hr-form-group', className)}>
    {children}
  </div>
);

export const Radio = ({ checked, label, ...rest }) => (
  <div className="radio-btn" {...rest} >
    <span>
      <Icon
        icon={`${checked ? 'fa-check-circle' :'fa-circle'}`}
        style={{ color: `${checked ? '#3AC2D1' : '#ddd'}`, fontSize: `25px`}} />
    </span>
    <span className="radio-label">
      {label}
    </span>
  </div>
)

export const RadioWizard = ({ label, name, value, onChange, options = [] }) => (
  <Form.Group className="has-radios">
    <label>{label}</label>
    <div>
      {
        options.map((opt, i) => (
          <Radio
            key={i}
            checked={opt.value === value}
            label={opt.label}
            onClick={() => onChange({ target: { name, value: opt.value }})}
          />
        ))
      }
    </div>
  </Form.Group>
)

export const Selection = ({ icon, ...props}) => (
  <Form.Group className="has-navigation">
    <Input
      {...props}
      modifier="underbar"
      float
    />
    <div className="nav-icon">
      <i className={classNames('fa', icon)}></i>
    </div>
  </Form.Group>
);

Selection.propTypes = {
  icon: PropTypes.string,
};

Selection.defaultProps = {
  icon: 'fa-chevron-right',
};

export const NumberInput = ({ placeholder, name, ...inputProps }) => (
  <ons-input type="number" name={name} value="" modifier="underbar" float="" placeholder={placeholder}>
    <input
      className="text-input text-input--underbar"
      type="number"
      name={name}
      placeholder={placeholder}
      {...inputProps}
    />
    <span className="text-input__label text-input--underbar__label">{placeholder}</span>
  </ons-input>
)

Form.Number = NumberInput;
Form.Group = FormGroup;
Form.Selection = Selection;
Form.RadioWizard = RadioWizard;

export default Form;
