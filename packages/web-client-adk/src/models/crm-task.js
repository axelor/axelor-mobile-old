import Task from './task';

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
  ...Task,
  search,
};
