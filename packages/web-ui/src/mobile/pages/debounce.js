import debounce from 'lodash.debounce';

export const debounceCallback = debounce((func) => {
  func();
}, 100);
