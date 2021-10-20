import Partner from './partner';

const search = (options) => {
  return {
    ...options,
    data: {
      ...(options.data || {}),
      _domain: options.data && options.data._domain || 'self.isCustomer = false AND self.isContact = true',
    },
  };
};

export default {
  ...Partner,
  search,
};
