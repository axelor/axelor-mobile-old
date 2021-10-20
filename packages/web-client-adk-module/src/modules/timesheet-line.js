import BaseAPI from '../base';

export default class TimesheetLine extends BaseAPI {
  constructor(rest, options) {
    super(rest, options);
  }

  add(data) {
    return this.init()
    .then(() => this.rest.action('com.axelor.apps.hr.mobile.HumanResourceMobileController:insertOrUpdateTSLine', {
      "date": data.date,
      "toInvoice": data.toInvoice,
      "comments": data.comments,
      "activity": data.product.id,
      "project": data.project.id,
      "duration": data.durationStored,
      "task": data.task ? data.task.id : null,
    }))
    .then((res) => res.json())
    .then((res) => {
      if (res.status == 0) {
        return this.fetch(res.data)
        .then((result) => ({ ...result, status: 0 })) ;
      }
      return Promise.resolve(res);
    });
  }
  update(data) {
    return this.init()
    .then(() => this.rest.action('com.axelor.apps.hr.mobile.HumanResourceMobileController:insertOrUpdateTSLine', {
      "id": data.id,
      "date": data.date,
      "toInvoice": data.toInvoice,
      "comments": data.comments,
      "activity": data.product.id,
      "project": data.project.id,
      "duration": data.durationStored,
      "task": data.task ? data.task.id : null,
    }))
    .then((res) => res.json())
    .then((res) => {
      if(res.status == 0) {
        return this.fetch(res.data)
        .then((result) => ({ ...result, status: 0 }));
      }
      return Promise.resolve(res);
    });
  }
}
