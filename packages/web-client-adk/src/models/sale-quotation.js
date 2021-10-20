import Order from './order';

const search = ({ filterType, ...options }) => {
  let data = {};
  switch (filterType) {
    case "Draft":
      data = {
        ...(options.data || {}),
        _domain: options.data && options.data._domain || 'self.statusSelect = 1',
      };
      break;
    case "Finalized":
      data = {
        ...(options.data || {}),
        _domain: options.data && options.data._domain || 'self.statusSelect = 2',
      };
      break;
    case "Others":
      data = {
        ...(options.data || {}),
        _domain: options.data && options.data._domain || 'self.statusSelect NOT IN (1,2)',

      };
      break;
    default:
      data = {
        ...(options.data || {}),
        _domain: null,
      };
  }
  return {
    ...options,
    data,
  };
};

export default {
  ...Order,
  search,
};
