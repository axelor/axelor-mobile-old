import MODELS from '../models';
import moment from 'moment';

// create mappers for particular model
const Mapper = ({ fields = [], mapLabels = {}, mapFields = {}, search = (e) => e, selection = null }, { refs = [] } = {}) => {
  let requestMapper = (e) => e;
  let responseMapper = (e) => e;
  let optionsMapper = (e) => e;
  let searchMapper = (e) => e;
  let fieldsMapper = () => [];
  let relatedFieldMapper = (e) => e;

  // resolve map field for e.g. customer.client_partner.id to customer.clientPartner.id
  let resolveField = (uiField) => {
    if (!uiField) return uiField;
    const nestedFields = uiField.toString().split('.');
    for(let k in mapFields) {
      const hasNested = (nestedFields.indexOf(mapFields[k]) > -1 && k !== 'id');
      if (hasNested) {
        return uiField.replace(mapFields[k], k);
      } else if (mapFields[k] == uiField) {
        return k;
      }
    }
    return uiField;
  }

  // fields mapper, create [{label, name}] object of array
  fieldsMapper = () => {
    return fields.map((f) => {
      return ({ label: mapLabels[f] || null, name: mapFields[f] || f });
    });
  }

  // map related fields for e.g. in fetch record api
  relatedFieldMapper = (relatedFields = {}) => {
    const _relatedFields = {};
    Object.keys(relatedFields).forEach(k => {
      const key = Object.keys(mapFields).find(f => mapFields[f] === k) || k;
      _relatedFields[key] = relatedFields[k];
    })
    return _relatedFields;
  }

  // map response record (renaming fields name)
  responseMapper = (v) => {
    const e = {...v};
    for(let k in e) {
      if (mapFields[k] && e[k] !== undefined && mapFields[k] !== k) {
        e[mapFields[k]] = e[k];
        delete e[k];
        k = mapFields[k];
      }
      const isRef = refs.find(r => r.field === k);
      if (e[k] && isRef && MODELS[isRef.model]) {
        const value = e[k];
        const ModelMapper = Mapper(MODELS[isRef.model]);
        e[k] = Array.isArray(value) ? value.map(v => ModelMapper.responseMapper(v)) : ModelMapper.responseMapper(value);
      }
    }
    return {...e};
  };

  // map request record
  requestMapper = (v) => {
    const e = {...v};
    for(let k in e) {
      const isRef = refs.find(r => r.field === k);
      if (e[k] && isRef && MODELS[isRef.model]) {
        const value = e[k];
        const ModelMapper = Mapper(MODELS[isRef.model]);
        e[k] = Array.isArray(value) ? value.map(v => ModelMapper.requestMapper(v)) : ModelMapper.requestMapper(value);
      }
      for(let mf in mapFields) {
        if (mapFields[mf] === k  && mf !== k) {
          e[mf] = e[k];
          delete e[k];
        }
      }
    }
    return {...e};
  };

  // search options mapper
  optionsMapper = (e) => {
    if (selection) {
      return {
        ...e,
        data: {
          _domain: "self.select.name = :name",
          _domainContext: {
            name: selection,
          },
        },
        fields: ["select", "value", "hidden", "priority", "order", "title"],
        sortBy: ["select.priority", 'order'],
      };
    }
    const allKeys = Object.keys(mapFields);
    const allValues = Object.values(mapFields);
    for(let opt in e) {
      switch(opt) {
        case 'sortBy':
        case 'fields':
          e[opt] = e[opt].map(f => {
            let isDesc = false;
            if (f.indexOf('-') == 0) {
              isDesc = true;
              f = f.substr(1);
            }
            return `${isDesc ? '-' : ''}${allValues.indexOf(f) > -1 ? allKeys[allValues.indexOf(f)] : f}`;
          });
          break;
        case 'search':
          const searchFilter = (searchOptions) => {
            const { operator = 'like', fields = [], value = '' } = searchOptions;
            const criteria = [...fields].map(f => {
              if (typeof f === 'object') {
                f = Object.assign({}, f);
                if (f.fieldType) {
                  if (f.fieldType === 'date') {
                    f.value = moment(f.value).isValid() ? moment(f.value).format(f.format || '') : f.value;
                  }
                  delete f.format;
                  delete f.fieldType;
                }
                if (f.fields) {
                  return searchFilter(f);
                }
                f.fieldName = resolveField(f.fieldName);
                return f;
              }
              return { fieldName: resolveField(f), operator, value };
            });
            return {
              operator: fields.length && typeof fields[0] === 'object' && !["like"].includes(operator) ? operator : "or",
              criteria,
            };
          };
          e.data = {
            ...(e.data || {}),
            ...searchFilter(e.search),
          };
          delete e[opt];
          break;
        case 'id':
          e.data = {
            ...(e.data || {}),
            _domain: `self.id ${Array.isArray(e.id) ? 'in': '=' } :ids`,
            _domainContext: {
              ids: e.id,
            },
          };
          break;
        case 'domain':
          let _domain = '';
          let _domainContext = {};
          Object.keys(e.domain).forEach(operator => {
            const values = e.domain[operator];
            Object.keys(values).forEach(k => {
              let kk = resolveField(k);
              if (kk !== k) {
                values[kk] = values[k];
                delete values[k];
              }
            })
            _domain = `${_domain} ${Object.keys(values).map(p => `self.${p} = :${p}`).join(` ${operator} `)}`;
            _domainContext = { ..._domainContext, ...values };
          });
          e.data = {
            ...(e.data || {}),
            _domain,
            _domainContext,
          };
          delete e[opt];
          break;
        default:
          break;
      }
    }
    return search({...e});
  };

  // search mapper, only intercept data for selection field
  searchMapper = (res) => {
    if (selection) {
      const { data = [] } = res;
      const newData = [];
      data.forEach(e => {
        const ind = newData.findIndex(v => v.value === e.value);
        if (ind > -1 && e.hidden) {
          newData[ind] = e;
        } else {
          newData.push(e);
        }
      });
      return {...res, data: newData};
    }
    return res;
  };

  return { requestMapper, responseMapper, fieldsMapper, relatedFieldMapper, optionsMapper, searchMapper };
};

export default Mapper;
