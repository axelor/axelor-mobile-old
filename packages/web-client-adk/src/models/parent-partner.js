import Partner from './partner';

const search = (options) => {
  return {
    ...options,
    data: {
      ...(options.data || {}),
      _domain: options.data && options.data._domain || 'self.isContact = false AND self.partnerTypeSelect = 1',
    },
  };
};

export default {
  ...Partner,
  search,
};
