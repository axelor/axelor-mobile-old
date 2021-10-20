export default {
  LeaveReason: {
    model: "",
    fields: ["id", "name"]
  },
  ExpenseType: {
    model: "",
    fields: ["id", "name"],
    mapFields: {
      name: "fullName"
    }
  },
  TaskProject: {
    model: "",
    fields: ["id", "name"],
    mapFields: {
      name: "fullName"
    }
  },
  TimesheetActivity: {
    model: "",
    fields: ["id", "name"],
    mapFields: {
      name: "fullName"
    }
  },
  ProjectTask: {
    model: "com.axelor.apps.project.db.ProjectTask",
    fields: ["id", "name"],
    mapFields: {
      name: "fullName",
    }
  },
  LeaveLine: {
    model: "com.axelor.apps.hr.db.LeaveRequest",
    fields: [
      "id",
      "leaveLine",
      "fromDate",
      "toDateT",
      "fromDateT",
      "statusSelect",
      "endOnSelect",
      "toDate",
      "requestDate",
      "company",
      "startOnSelect",
      "user",
      "comments",
      "duration",
      "leaveLine.quantity"
    ],
    mapFields: {
      fromDateT: "fromDate",
      toDateT: "toDate"
    }
  },
  TimesheetLine: {
    model: "com.axelor.apps.hr.db.TimesheetLine",
    fields: [
      "id",
      "product",
      "statusSelect",
      "project",
      "toInvoice",
      "visibleDuration",
      "user",
      "hoursDuration",
      "date",
      "comments",
      "attrs",
      "projectTask",
    ],
    mapFields: {
      hoursDuration: "durationStored"
    }
  },
  ExpenseLine: {
    model: "com.axelor.apps.hr.db.ExpenseLine",
    fields: [
      "id",
      "totalTax",
      "statusSelect",
      "totalAmount",
      "toInvoice",
      "comments",
      "justificationMetaFile",
      "project",
      "untaxedAmount",
      "user",
      "expense",
      "expenseProduct",
      "expenseDate",
    ],
    mapFields: {
      project: "project"
    },
    responseMapper: (e, rest) => {
      const { justificationMetaFile } = e;
      e.expenseProduct = Object.assign({}, e.expenseProduct, {
        fullName: e.expenseProduct && e.expenseProduct.fullName.replace(/\[.*\]/i, "")
      });
      if (justificationMetaFile) {
        e.picture = `${rest.baseURL}ws/rest/com.axelor.meta.db.MetaFile/${justificationMetaFile.id}/content/download?v=${justificationMetaFile.$version}&image=true`;
      }
      return e;
    },
    search: options => {
      return {
        ...options,
        data: {
          ...(options.data || {}),
          _domain: `${
            options.data && options.data._domain
              ? `${options.data._domain} AND`
              : ""
          } self.kilometricExpense = null`
        }
      };
    }
  },
  KAP: {
    model: "",
    fields: ["id", "name"]
  },
  KMExpenseLine: {
    model: "com.axelor.apps.hr.db.ExpenseLine",
    fields: [
      "id",
      "project",
      "totalAmount",
      "toInvoice",
      "kilometricAllowParam",
      "distance",
      "fromCity",
      "toCity",
      "expenseDate",
      "comments",
      "kilometricTypeSelect"
    ],
    mapFields: {
      project: "project"
    },
    search: options => {
      return {
        ...options,
        data: {
          ...(options.data || {}),
          _domain: `${
            options.data && options.data._domain
              ? `${options.data._domain} AND`
              : ""
          } self.kilometricExpense != null`
        }
      };
    }
  },
  MetaJsonField: {
    model: "com.axelor.meta.db.MetaJsonField",
    fields: ["modelField", "name", "model", "type", "title", "targetModel"]
  },
  MetaJsonRecord: {
    model: "com.axelor.meta.db.MetaJsonRecord",
    fields: []
  }
};
