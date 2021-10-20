import BaseAPI from '../base';

export default class KapAPI extends BaseAPI {
  constructor(rest, options) {
    super(rest, options);
  }

  search(options = {}) {
    return this.interceptor(
      () => this.rest.action('com.axelor.apps.hr.mobile.HumanResourceMobileController:getKilometricAllowParam', {
        action: 'com.axelor.apps.hr.mobile.HumanResourceMobileController:getKilometricAllowParam',
      })
    );
  }

  add(options = {}) {
    console.log('intercept adk module add');
    return super.add(options);;
  }
}
