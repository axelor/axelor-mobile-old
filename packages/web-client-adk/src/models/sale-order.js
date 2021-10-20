import Order from './order';

const search = (options) => {
  return {
    ...options,
    data: {
      ...(options.data || {}),
      _domain: options.data && options.data._domain || 'self.statusSelect = 3',
    },
  };
};

export default {
  ...Order,
  search,
};
