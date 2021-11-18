import BaseAPI from '../base';

export default class ExpenseLineAPI extends BaseAPI {
  constructor(rest, options) {
    super(rest, options);
  }

  add(data) {
    return this.init()
    .then(() => this.rest.action('com.axelor.apps.hr.mobile.HumanResourceMobileController:insertOrUpdateExpenseLine', {
      "action": "com.axelor.apps.hr.mobile.HumanResourceMobileController:insertOrUpdateExpenseLine",
      "date": data.expenseDate,
      "toInvoice": data.toInvoice,
      "comments": data.comments,
      "expenseType": data.expenseProduct.id,
      "unTaxTotal": data.totalAmount,
      "taxTotal": data.totalTax,
      "amountWithoutVat": data.untaxedAmount,
      "justification": data.justification,
      ...(data.project && {project: data.project.id}),
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
    .then(() => this.rest.action('com.axelor.apps.hr.mobile.HumanResourceMobileController:insertOrUpdateExpenseLine', {
      "action": "com.axelor.apps.hr.mobile.HumanResourceMobileController:insertOrUpdateExpenseLine",
      "id": data.id,
      "date": data.expenseDate,
      "toInvoice": data.toInvoice,
      "comments": data.comments,
      "expenseType": data.expenseProduct.id,
      "unTaxTotal": data.totalAmount,
      "taxTotal": data.totalTax,
      "amountWithoutVat": data.untaxedAmount,
      "justification": data.justification,
      ...(data.project && {project: data.project.id}),
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
}
