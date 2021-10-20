import PartnerAddress from './partner-address';

const search = (options) => {
  return {
    ...options,
    data: {
      ...(options.data || {}),
      _domain: options.data && options.data._domain || 'self.id = IN :addressId',
      _domainContext: {
        addressId: options.id
      }
    },
  };
};

export default {
  ...PartnerAddress,
  search,
};
