import BaseAPI from '../base';

export default class LeaveLineAPI extends BaseAPI {
  constructor(rest, options) {
    super(rest, options);
  }

  add(data) {
    return this.init()
    .then(() => this.rest.action('com.axelor.apps.hr.mobile.HumanResourceMobileController:insertLeave', {
      "toInvoice": data.toInvoice,
      "fromDateT": data.fromDate,
      "toDateT": data.toDate,
      "duration": data.duration,
      "leaveReason": data.leaveLine.id,
      "comments": data.comments,
      "startOn": data.startOnSelect,
      "endOn": data.endOnSelect,
      "leaveLine.quantity": data.leaveLine.quantity,
    }))
    .then((res) => res.json())
    .then((res) => {
      if (res.status == 0) {
        return this.fetch(res.data[0].values)
        .then((result) => ({ ...result, status: 0 })) ;
      }
      return Promise.resolve(res);
    });
  }
}
