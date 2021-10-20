import BaseAPI from '../base';

export default class ContactAPI extends BaseAPI {
  constructor(rest, options) {
    super(rest, options);
  }

  search(options = {}) {
    console.log('intercept adk module search');
    return super.search(options);;
  }

  add(options = {}) {
    console.log('intercept adk module add');
    return super.add(options);;
  }
}
