import moment from 'moment';
import _ from 'lodash';

/**
 * used to check given search criteria is true for given record
 * @param {*} searchOptions - contains search options (nested fields)
 * @param {Object} rec - record to apply filter on
 * @returns {Boolean}
 */
export const searchFilter = (searchOptions, rec) => {
  let { fields = [], operator = 'like', value = '' } = searchOptions || {};
  let outerOperator = operator;
  if (!fields.length) return true;
  return fields.map(f => {
    let fieldType = 'string';
    // check array element is object
    if (typeof f === 'object') {
      // check nested fields
      if (f.fields) {
        return searchFilter(f, rec);
      }
      operator = f.operator;
      value = f.value;
      fieldType = f.fieldType || fieldType;
      f = f.fieldName;
    } else if (outerOperator === 'like') {
      outerOperator = 'or';
    }
    if (value === '') return true;
    let fieldValue = rec[f];
    // acess nested object property for e.g. customer.partner.fullName
    if (f.indexOf('.') > -1) {
      fieldValue = _.get(rec, f);
    }
    switch (operator.toLowerCase()) {
      case 'like':
        return fieldValue && fieldValue.toString().toLowerCase().indexOf(value.toString().toLowerCase()) > -1;
      case '!=':
        return `${fieldValue}` !== `${value}`;
      case '=':
        if (fieldType === 'date' && moment(value).isValid() && moment(fieldValue).isValid()) {
          return moment(value).isSame(moment(fieldValue), 'day');
        }
        return `${fieldValue}` === `${value}`;
      case '<=':
      case '<':
        if (fieldType === 'date' && moment(value).isValid() && moment(fieldValue).isValid()) {
          return moment(fieldValue)[operator === '<=' ? 'isSameOrBefore' : 'isBefore'](moment(value), 'day');
        };
        return operator === '<=' ? fieldValue <= value : fieldValue < value;
      case '>=':
      case '>':
        if (fieldType === 'date' && moment(value).isValid() && moment(fieldValue).isValid()) {
          return moment(fieldValue)[operator === '>=' ? 'isSameOrAfter' : 'isAfter'](moment(value), 'day');
        };
        return operator === '>=' ? fieldValue >= value : fieldValue > value;
      case 'in':
        return Array.isArray(value) ? value.indexOf(fieldValue) > -1 : `${fieldValue}` === `${value}`;
      case 'notin':
        return Array.isArray(value) ? value.indexOf(fieldValue) === -1 : `${fieldValue}` !== `${value}`;
      default:
        return true;
    }
  })[outerOperator === 'and' ? 'every' : 'some']((e) => e === true);
}

export default searchFilter;
