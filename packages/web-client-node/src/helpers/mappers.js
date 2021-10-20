import MODELS from '../models';

export const Mappers = ({ mapFields }, { refs = [] } = {}) => {
  let requestMapper = (e) => e;
  let responseMapper = (e) => e;
  let optionsMapper = (e) => e;
  if (mapFields) {
    responseMapper = (v) => {
      const e = {...v};
      refs.forEach(r => {
        const refEntity = MODELS[r.model];
        if (refEntity && e[r.field]) {
          e[r.field] = Mappers(refEntity).responseMapper(e[r.field]);
        }
      });
      for(let k in mapFields) {
        if (e[k]) {
          e[mapFields[k]] = e[k];
          delete e[k];
        }
      }
      return {...e};
    };
    requestMapper = (v) => {
      const e = {...v};
      refs.forEach(r => {
        const refEntity = MODELS[r.model];
        if (refEntity && e[r.field]) {
          e[r.field] = Mappers(refEntity).requestMapper(e[r.field]);
        }
      });
      for(let k in mapFields) {
        let v = mapFields[k];
        if (e[v]) {
          e[k] = e[v];
          delete e[v];
        }
      }
      return {...e};
    };
    optionsMapper = (e) => {
      const allKeys = Object.keys(mapFields);
      const allValues = Object.values(mapFields);
      for(let opt in e) {
        switch(opt) {
          case 'sortBy':
          case 'fields':
            e[opt] = e[opt].map(f => allValues.indexOf(f) > -1 ? allKeys[allValues.indexOf(f)] : f);
            break;
          default:
            break;
        }
      }
      return {...e};
    };
  }
  return { requestMapper, responseMapper, optionsMapper };
};

export default Mappers;
