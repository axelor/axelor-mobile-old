import Partner from './partner';

const search = (options) => {
  return {
    ...options,
    data: {
      ...(options.data || {}),
      _domain: options.data && options.data._domain || 'self.isCustomer = true AND self.isContact = false',
    },
  };
};

export default {
  ...Partner,
  search,
};
