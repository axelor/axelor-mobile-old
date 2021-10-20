import BaseAPI from '../base';

export default class KMExpenseLineAPI extends BaseAPI {
  constructor(rest, options) {
    super(rest, options);
  }

  add(data) {
    return this.init()
    .then(() => this.rest.action('com.axelor.apps.hr.mobile.HumanResourceMobileController:insertKMExpenses', {
      // "toInvoice": data.toInvoice,
      "date": data.expenseDate,
      "comments": data.comments,
      "projectTask": data.project.id,
      "kmNumber": data.distance,
      "locationFrom": data.fromCity,
      "locationTo": data.toCity,
      "allowanceTypeSelect": data.kilometricTypeSelect,
      "kilometricAllowParam": data.kilometricAllowParam.id,
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
