import TaxLine from './taxLine';

const search = (options) => {
  return {
    ...options,
    data: {
      ...(options.data || {}),
      _domain: options.data && options.data._domain || 'self.endDate = null or self.endDate > :__date__',
    },
  };
};

export default {
  ...TaxLine,
  search,
};
