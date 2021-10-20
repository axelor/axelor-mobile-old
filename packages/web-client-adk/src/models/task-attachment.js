import Attachment from './attachment';

const search = (options) => {
  return {
    ...options,
    data: {
      ...(options.data || {}),
      _domain: options.data && options.data._domain,
    },
  };
};

export default {
  ...Attachment,
  search,
};
