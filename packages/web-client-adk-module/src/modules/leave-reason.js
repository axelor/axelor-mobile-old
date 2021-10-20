import BaseAPI from '../base';

export default class LeaveReasonAPI extends BaseAPI {
  constructor(rest, options) {
    super(rest, options);
  }

  search(options = {}) {
    return this.interceptor(() => this.rest.action('com.axelor.apps.hr.mobile.HumanResourceMobileController:getLeaveReason'));
  }
}
