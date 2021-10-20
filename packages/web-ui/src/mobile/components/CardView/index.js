import React, { Component } from 'react';
import classNames from 'classnames';
import { Icon, Input } from 'react-onsenui';
import TextareaAutosize from 'react-autosize-textarea';
import moment from 'moment';

import './styles.css';
import ManyToOne from './../ManyToOne';
import ManyToMany from './../ManyToMany';
import Form from './../../pages/form';
import TextInput from './../TextInput';

import { openFilePicker } from './IosFilePicker';

const getCounteText = (counter, value = '') => {
  value = value || '';

  if (counter < value.length) {
    return '';
  }
  return `${value.length}/${counter}`;
}

const setPriceComma = (value, operator = ',') => {
  if ([null, undefined].includes(value)) {
    return '';
  }
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, operator);
}

export const CardField = ({ className, title, isPrice, counter, value, titleClassName, placeholder, textClassName, edit, onChange, onClick, type, showTitle = true, style, icon, onSelectFile, ...props }) => {
  const fileInput = React.createRef();
  return (
  <div className={classNames('card-field', className)} style={{ ...style }}>
    {
      showTitle &&
      <span className={classNames("card-field-title", titleClassName)}>{title}</span>
    }
    {
      edit ?
        <div>
          <Input
            style={{ width: "100%" }}
            type={type || 'text'}
            value={[null, undefined].includes(value) ? '' : `${value}`}
            onChange={(e) => onChange(e)}
            modifier="underbar"
            className={classNames({ 'test-class': counter !== undefined }, { 'short-margin-class': !value }, {'file-input': Boolean(onSelectFile)})}
            placeholder={showTitle ? '' : title}
            readOnly={props.readOnly}
          />
          {
            onSelectFile &&
            <span className="input-icon" onClick={() => {
              // fileInput.current.click();
                if(props.platform && props.platform === 'Android') {
                  fileInput.current.click();
                } else {
                  openFilePicker((res) => {
                    onSelectFile([res]);
                  });
                }
              }}
            >
              <Icon icon={icon} />
              <input
                type="file"
                ref={(c) => { if (c) { fileInput.current = c; } }}
                style={{ display: "none" }}
                name="attachment"
                id="attachment"
                multiple
                onChange={() => onSelectFile(fileInput.current.files)}
              />
            </span>
          }
        </div>
        :
        <span className={classNames("card-field-text", textClassName)}
        onClick={(e) => onClick && onClick(e)}
        >
          {
            isPrice ?
              setPriceComma(value)
              :
              value
          }
        </span>
    }
    {
      edit && counter &&
      <span className="counter-container">{getCounteText(counter, value)}</span>
    }
  </div>
)};

export const DateField = ({ className, title, value, titleClassName, textClassName, edit, onChange, type, showTitle = true, dateFormat }) => (
  <div className={classNames('card-field', className)}>
    {
      showTitle &&
      <span className={classNames("card-field-title", titleClassName)}>{title}</span>
    }
    {
      edit ?
        <TextInput type={'date'} value={moment(value).isValid() ? value && moment(value).format('YYYY-MM-DD') : ''} onValueChange={(e) => onChange({ target: { value: e } })} />
        :
        <span className={classNames("card-field-text", textClassName)}>{moment(value).isValid() ? moment(value).format(dateFormat || 'DD MMM YYYY') : ''}</span>
    }
  </div>
);

export const DateTimeField = ({ className, title, value, titleClassName, textClassName, edit, onChange, type, showTitle = true, dateFormat }) => (
  <div className={classNames('card-field', className)}>
    {
      showTitle &&
      <span className={classNames("card-field-title", titleClassName)}>{title}</span>
    }
    {
      edit ?
        <TextInput type={'datetime-local'} value={moment(value).isValid() ? moment(value).format('YYYY-MM-DDTHH:mm') : moment().format('YYYY-MM-DDTHH:mm')} onValueChange={(e) => onChange({ target: { value: e } })} />
        :
        <span className={classNames("card-field-text", textClassName)}>{moment(value).isValid() ? moment(value).format(dateFormat || 'DD MMM YYYY HH:mm') : ''}</span>
    }
  </div>
);

export const TextArea = ({ className, title, value, titleClassName, textClassName, edit, onChange, type, showTitle = true, dateFormat }) => (
  <div className={classNames('card-field', className)}>
    {
      showTitle &&
      <span className={classNames("card-field-title", titleClassName)}>{title}</span>
    }
    {
      edit ?
        <TextareaAutosize
          onChange={(e) => onChange(e)}
          className={classNames('textarea textarea--transparent card-textarea')}
          value={value || ''}
          rows={3}
        />
        :
        <span className={classNames("card-field-text", textClassName)} dangerouslySetInnerHTML={{ __html: value }}></span>
    }
  </div>
);

export const FieldWrapper = ({ className, edit, children, textClassName, value, titleClassName, fieldLabel, displayField, showTitle = true, ...props }) => {
  return (
    <div className={classNames('card-field', className)} style={{ width: '100%' }}>
      {
        fieldLabel && showTitle &&
        <span className={classNames("card-field-title", titleClassName)}>{fieldLabel}</span>
      }
      {
        edit ?
          children
          :
          <span className={classNames("card-field-text", textClassName)}>{value}</span>
      }
    </div>
  );
}

export const ManyToOneField = ({ className, edit, textClassName, value, titleClassName, fieldLabel, displayField, showTitle = true, ...props }) => {
  return (
    <div className={classNames('card-field', className)} style={{ width: '100%' }}>
      {
        fieldLabel && showTitle &&
        <span className={classNames("card-field-title", titleClassName)}>{fieldLabel}</span>
      }
      {
        edit ?
          <ManyToOne
            {...props}
            value={value}
          />
          :
          <span className={classNames("card-field-text", textClassName)}>{value ? value[displayField] : null}</span>
      }
    </div>
  );
}

export const ManyToManyField = ({ className, edit, fieldLabel, displayField, showTitle = true, titleClassName, value, ...props }) => (
  <div className={classNames('card-field', className)}>
    {
      fieldLabel && showTitle &&
      <span className={classNames("card-field-title", titleClassName, value, ...props)}>{fieldLabel}</span>
    }
    {
      edit ?
        <ManyToMany
          {...props}
          value={value}
        />
        :
        <div style={{ paddingTop: 7 }}>
          {
            value &&
            value.map((obj, i) => (
              <span key={i} className="many-to-many-button">{obj ? obj[displayField] : null}</span>
            ))
          }
        </div>
    }
  </div>
);

export const NumberField = ({ className, title, value, titleClassName, textClassName, edit, onChange, type, showTitle = true, style, ...props }) => (
  <div className={classNames('card-field inline select-control', className)} style={{ ...style }}>
    {
      showTitle &&
      <span className={classNames("card-field-title", titleClassName)}>{title}</span>
    }
    {
      edit ?
        <Form.Number
          name={props.name}
          value={[null, undefined].includes(value) ? '' : `${value}`}
          onChange={(e) => onChange(e)}
          onClick={(e) => {
            if(props.defaultValue && e.target.value === props.defaultValue) {
              onChange({target: { value: ''}})
            }
          }}
          onBlur={(e) => {
            if(props.defaultValue && e.target.value === '') {
              onChange({target: { value: props.defaultValue }});
            }
          }}
        />
        :
        <span className={classNames("card-field-text", textClassName)}>{value}</span>
    }
  </div>
);

export const ActionItem = ({ className, children, icon, titleClassName, value, ...props, iconClassName, onClick }) => (
  <div className={classNames('action-item', className)} onClick={(e) => onClick(e)}>
    <Icon className={classNames('action-item-icon', iconClassName)} icon={icon} />
    <span className={classNames('action-item-title', titleClassName)}>{children}</span>
  </div>
);

export const ActionView = ({ className, children }) => (
  <div className={classNames('action-view', className)}>
    {children}
  </div>
);

export const TagButton = ({ className, children, bgColor, style = {} }) => (
  <span className={classNames('tag-button', className)} style={{ backgroundColor: bgColor, ...style }}>
    {children}
  </span>
)

export const QuantityField = ({ className, title, value, edit, onChange, showTitle = true }) => {
  value = isNaN(value) ? '0' : Number(value);
  return (
    <div className={classNames('card-field', className)}>
      {
        showTitle &&
        <span className={classNames("card-field-title")}>{title}</span>
      }
      {
        edit ?
          <div className="card-quantity-field">
            <span className="card-quantity-btn" onClick={() => onChange({ target: { value: value > 0 ? parseFloat(value-1).toFixed(2) : value } })}> - </span>
            <input style={{ textAlign: 'center', background: 'transparent', border: 'none' }}
              value={value}
              onChange={(e) => onChange(e)}
            />
            <span className="card-quantity-btn" onClick={() => onChange({ target: { value: parseFloat(value + 1).toFixed(2)} })}> + </span>
          </div>
          :
          <div className="card-quantity-field" style={{ justifyContent: 'center' }}>
            <span>{value}</span>
          </div>
      }
    </div>

  )
}

class CardView extends Component {
  render() {
    const { children, className, title, headerClassName, principalView, hidden,onClick, style={} } = this.props;
    return (
      !hidden &&
      <div onClick={onClick} className={classNames(principalView ? 'principal-card-view' : 'card-view', className)} style={{...style}}>
        {
          title &&
          <div className={classNames('card-header', headerClassName)}>{title}</div>
        }
        {children}
      </div>
    );
  }
}

CardView.CardField = CardField;
CardView.InputField = CardField;
CardView.TagButton = TagButton;
CardView.TextArea = TextArea;
CardView.DateField = DateField;
CardView.DateTimeField = DateTimeField;
CardView.ManyToOne = ManyToOneField;
CardView.ActionView = ActionView;
CardView.ActionItem = ActionItem;
CardView.ManyToMany = ManyToManyField;
CardView.Number = NumberField;
CardView.QuantityField = QuantityField;
CardView.FieldWrapper = FieldWrapper;

export default CardView;
