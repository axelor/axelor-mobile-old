import BaseAPI from '../base';

export default class TaskProjectAPI extends BaseAPI {
  constructor(rest, options) {
    super(rest, options);
  }

  search(options = {}) {
    return this.interceptor(() => this.rest.action('com.axelor.apps.businessproject.mobile.BusinessProjectMobileController:getProjects', {
      action: 'com.axelor.apps.businessproject.mobile.BusinessProjectMobileController:getProjects',
    }));
  }
}
