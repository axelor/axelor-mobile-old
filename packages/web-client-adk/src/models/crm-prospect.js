import Partner from './partner';

const search = (options) => {
  return {
    ...options,
    data: {
      ...(options.data || {}),
      _domain: options.data && options.data._domain || "self.isContact = false AND self.isProspect = true",
    },
  };
};

export default {
  ...Partner,
  search,
};
