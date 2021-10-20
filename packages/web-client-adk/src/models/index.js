import Partner from './partner';
import SaleCustomer from './sale-customer';
import SaleContact from './sale-contact';
import CRMCustomer from './crm-customer';
import CRMCustomerProspect from './crm-prospect';
import CRMContact from './crm-contact';
import CRMSupplier from './crm-supplier';
import Order from './order';
import SaleOrder from './sale-order';
import SaleQuotation from './sale-quotation';
import TaxLine from './tax-line';
import PartnerAddress from './partner-address';
import ParentPartner from './parent-partner';
import HR_MODELS from './hr-app';
import EmailTemplate from './email-template';
import Task from './crm-task';
import QualityControl from './quality-control';
import ControlPoint from './quality-control-point';
import MeasurePoint from './quality-measure-point';
import Attachment from './task-attachment';
export default {
  BASE: {
    fields: [],
  },
  PartnerType: {
    selection: 'partner.partner.type.select',
  },
  Contact: {
    model: 'com.axelor.contact.db.Contact',
    fields: ['fullName', 'lastName', 'company'],
    mapFields: {
      firstName: 'first_name',
      lastName: 'last_name',
      fullName: 'full_name',
    },
    mapLabels: {
      firstName: 'First Name',
      lastName: 'Last Name',
      fullName: 'Full Name',
      company: 'Company',
    },
  },
  Company: {
    model: 'com.axelor.apps.base.db.Company',
    fields: ['id', 'name','partner','printingSettings'],
  },
  Category: {
    model: 'com.axelor.apps.base.db.PartnerCategory',
    fields: ['id', 'name'],
  },
  Partner,
  Customer: Partner,
  CRMCustomer,
  CRMCustomerProspect,
  CRMContact,
  CRMSupplier,
  SaleContact,
  SaleCustomer,
  SaleOrder,
  SaleQuotation,
  ParentPartner,
  Order,
  TaxLine,
  PartnerAddress,
  Task,
  QualityControl,
  ControlPoint,
  MeasurePoint,
  Attachment,
  Industry: {
    model: 'com.axelor.apps.base.db.IndustrySector',
    fields: ['id', 'name'],
  },
  Currency: {
    model: 'com.axelor.apps.base.db.Currency',
    fields: ['id', 'name','symbol'],
  },
  MetaSelect: {
    model: 'com.axelor.meta.db.MetaSelect',
    fields: ['id', 'name', 'items'],
  },
  Source: {
    model: 'com.axelor.apps.base.db.Source',
    fields: ['id', 'name'],
  },
  Country: {
    model: 'com.axelor.apps.base.db.Country',
    fields: ['id', 'name'],
  },
  City: {
    model: 'com.axelor.apps.base.db.City',
    fields: ['id', 'name'],
  },
  MetaFile: {
    model: 'com.axelor.meta.db.MetaFile',
    fields: ['id', 'name'],
  },
  EmailTemplate,
  Message: {
    model: "com.axelor.apps.message.db.Message",
    fields: ["ccEmailAddressSet", "recipientUser", "mailAccount", "subject", "toEmailAddressSet",
      "bccEmailAddressSet", "sentDateT", "content", "statusSelect", "replyToEmailAddressSet",
      "relatedTo2Select", "mediaTypeSelect", "relatedTo1Select", "senderUser", "company",
      "relatedTo1SelectId", "fromEmailAddress", "addressBlock", "relatedTo2SelectId"],
    mapLabels: {
      toEmailAddressSet: 'Message.toEmailAddressSet',
      ccEmailAddressSet: 'Message.ccEmailAddressSet',
      bccEmailAddressSet: 'Message.bccEmailAddressSet',
      fromEmailAddress: 'Message.fromEmailAddress',
      subject: 'Message.subject',
      mediaTypeSelect: 'Message.mediaTypeSelect',
      statusSelect: 'Message.statusSelect',
      senderUser: 'Message.senderUser',
      sentDateT: 'Message.sentDateT',
      mailAccount: 'Message.mailAccount',
      replyToEmailAddressSet: 'Message.replyToEmailAddressSet',
      company: 'Message.company',
      relatedTo1Select: 'Message.relatedTo1Select',
      relatedTo2Select: 'Message.relatedTo2Select',
    }
  },
  User: {
    model: 'com.axelor.auth.db.User',
    fields: ['fullName', 'name', 'partner', 'activeCompany', 'activeTeam', 'email', "appPermissions", "employee"],
    mapFields: {
      fullName: 'full_name',
      activeCompany: 'active_company',
      activeTeam: 'active_team',
      employee: 'employee'
    },
    mapLabels: {
      name: 'Name',
      partner: 'Partner',
      fullName: 'Full Name',
      activeCompany: 'Company',
    },
  },
  Address: {
    model: 'com.axelor.apps.base.db.Address',
    fields: ['addressL2', 'addressL3', 'addressL4', 'addressL5',
      'addressL6', 'addressL7Country', 'city', 'fullName'],
    mapLabels: {
      addressL2: 'Address.addressL2',
      addressL3: 'Address.addressL3',
      addressL4: 'Address.addressL4',
      addressL5: 'Address.addressL5',
      addressL6: 'Address.addressL6',
      addressL7Country: 'Address.addressL7Country',
      city: 'Address.city',
      fullName: 'Address.Address',
    },
  },
  EmailAddress: {
    model: 'com.axelor.apps.message.db.EmailAddress',
    fields: ['address', 'name'],
  },
  EmailAccount: {
    model: 'com.axelor.apps.message.db.EmailAccount',
    fields: ['id', 'name'],
  },
  DMSFile: {
    model: 'com.axelor.dms.db.DMSFile',
    fields: ['id'],
  },
  CancelReason:{
    model: 'com.axelor.apps.base.db.CancelReason',
    fields: ['id', 'name'],
    mapFields: {
      name: 'cancel_reason'
    },
    mapLabels: {
      name: 'CancelReason.name'
    }
  },
  App: {
    model: 'com.axelor.apps.base.db.App',
    fields: ['name', 'id', 'code'],
    mapFields: {
      name: 'name',
      id: 'id',
      code: 'code',
    }
  },
  AppStock: {
    model: 'com.axelor.apps.base.db.AppStock',
    fields: ['isSeparateShipmentOperations'],
    mapFields: {
      isSeparateShipmentOperations: 'isSeparateShipmentOperations',
    }
  },
  AppProduction: {
    model: 'com.axelor.apps.base.db.AppProduction',
    fields: ['manageWorkshop'],
    mapFields: {
      manageWorkshop: 'manageWorkshop',
    }
  },
  AppBase: {
    model: 'com.axelor.apps.base.db.AppBase',
    fields: ['activateBarCodeGeneration', 'enableMultiCompany'],
    mapFields: {
      activateBarCodeGeneration: 'activateBarCodeGeneration',
      enableMultiCompany: 'enableMultiCompany',
    }
  },
  StockLocationLine: {
    model: 'com.axelor.apps.stock.db.StockLocationLine',
    fields: ['stockLocation.company','product','requestedReservedQty','product.unit','stockLocation.parentStockLocation.name','reservedQty','currentQty','futureQty','stockLocation.name'],
    mapLabels: {
      'stockLocation.company': 'company'
    }
  },
  StockLocation: {
    model: 'com.axelor.apps.stock.db.StockLocation',
    fields: ['company','product','name',],
    mapLabels: {
      'company': 'company',
      'name': 'name',
      'product': 'product',
    }
  },
  StockMove: {
    model: 'com.axelor.apps.stock.db.StockMove',
    fields: ['stockMoveSeq', 'toAddressStr', 'origin', 'estimatedDate', 'fromStockLocation', 'partner', 'company', 'availabilityRequest', 'pickingIsEdited', 'isReversion', 'statusSelect', 'typeSelect'],
    mapFields: {
      availabilityRequest: 'availabilityRequest',
      pickingIsEdited: 'pickingIsEdited',
      fromStockLocation: 'fromStockLocation',
      partner: 'partner',
      company: 'company',
      stockMoveSeq: 'stockMoveSeq',
      toAddressStr: 'toAddressStr',
      origin: 'origin',
      estimatedDate: 'estimatedDate',
      isReversion: 'isReversion',
      statusSelect: 'statusSelect',
      typeSelect: 'typeSelect'
    }
  },
  Inventory: {
    model: 'com.axelor.apps.stock.db.Inventory',
    fields: ['stockLocation', 'company', 'inventorySeq'],
    mapFields: {
      stockLocation: 'stockLocation',
      company: 'company',
      inventorySeq: 'inventorySeq',
    },
  },
  InventoryLine: {
    model: 'com.axelor.apps.stock.db.InventoryLine',
    fields: ['currentQty', 'realQty', 'unit', 'description', 'rack', 'trackingNumber', 'inventory'],
    mapFields: {
      currentQty: 'currentQty',
      realQty: 'realQty',
      unit: 'unit',
      description: 'description',
      rack: 'rack',
      trackingNumber: 'trackingNumber',
      inventory: 'inventory',
    },
    mapLabels: {
      currentQty: 'Inventory.currentQty',
      realQty: 'Inventory.realQty',
      unit: 'Inventory.unit',
      description: 'Inventory.description',
      rack: 'Inventory.rack',
      trackingNumber: 'Inventory.trackingNumber',
      inventory: 'Inventory.inventory',
    }
  },
  TrackingNumber: {
    model: 'com.axelor.apps.stock.db.TrackingNumber',
    fields: ['trackingNumberSeq', 'product'],
    mapFields: {
      trackingNumberSeq: 'trackingNumberSeq',
      product: 'product',
    },
  },
  OperationOrder: {
    model: 'com.axelor.apps.production.db.OperationOrder',
    fields: [
      'prodProcessLine',
      'outsourcing',
      'manufOrder',
      'manufOrder.manufOrderSeq',
      'manufOrder.product',
      'manufOrder.statusSelect',
      'barCode',
      'statusSelect',
      'toConsumeProdProductList',
      'prodProcessLine.description',
      'manufOrder.workshopStockLocation',
      'prodHumanResourceList',
      'machine',
      'plannedStartDateT',
      'workCenter',
      'manufOrderSeq',
      'workshopStockLocation',
      'manufOrder.company',
      'priority',
      'typeSelect',
      'comments',
      'name',
      'inStockMoveList'
    ],
    mapFields: {
      name: 'name',
      manufOrderSeq: 'manufOrderSeq',
      company: 'company',
      workshopStockLocation: 'workshopStockLocation',
      product: 'product',
      priority: 'priority',
      prodProcessLine: 'prodProcessLine',
      workCenter: 'workCenter',
      machine: 'machine',
      plannedStartDateT: 'plannedStartDateT',
      statusSelect: 'statusSelect',
      prodHumanResourceList: 'prodHumanResourceList',
      toConsumeProdProductList: 'toConsumeProdProductList',
      prodProcessLine: 'prodProcessLine',
      barCode: 'barCode',
      outsourcing: 'outsourcing',
      manufOrder: 'manufOrder',
      typeSelect: 'typeSelect',
      comments: 'comments',
      inStockMoveList: 'inStockMoveList',
    },
  },
  WorkCenter: {
    model: 'com.axelor.apps.production.db.WorkCenter',
    fields: ['name', 'code'],
    mapFields: {
      name: 'name',
      code: 'code',
    },
  },
  Machine: {
    model: 'com.axelor.apps.production.db.Machine',
    fields: ['name', 'code'],
    mapFields: {
      name: 'name',
      code: 'code',
    },
  },
  ManufOrder: {
    model: 'com.axelor.apps.production.db.ManufOrder',
    fields: [
      'manufOrderSeq',
      'statusSelect',
      'typeSelect',
      'workshopStockLocation',
      'isConsProOnOperation',
      'company',
      'qty',
      'unit',
      'barCode',
      'plannedStartDateT',
      'prioritySelect',
      'workshopStockLocation',
      'billOfMaterial',
      'note',
      'prodProcess',
      'moCommentFromSaleOrder',
      'saleOrder',
      'operationOrderList',
      'toConsumeProdProductList',
      'toProduceProdProductList',
      'product',
    ],
    mapFields: {
      manufOrderSeq: 'manufOrderSeq',
      statusSelect: 'statusSelect',
      typeSelect: 'typeSelect',
      workshopStockLocation: 'workshopStockLocation',
      isConsProOnOperation: 'isConsProOnOperation',
      company: 'company',
      qty: 'qty',
      unit: 'unit',
      plannedStartDateT: 'plannedStartDateT',
      prioritySelect: 'prioritySelect',
      workshopStockLocation: 'workshopStockLocation',
      billOfMaterial: 'billOfMaterial',
      note: 'note',
      prodProcess: 'prodProcess',
      moCommentFromSaleOrder: 'moCommentFromSaleOrder',
      saleOrder: 'saleOrder',
      operationOrderList: 'operationOrderList',
      toConsumeProdProductList: 'toConsumeProdProductList',
      toProduceProdProductList: 'toProduceProdProductList',
      product: 'product',
    }
  },
  StockMove: {
    model: 'com.axelor.apps.stock.db.StockMove',
    fields: [
      "availableStatusSelect",
      "stockMoveSeq",
      "statusSelect",
      "availableStatusSelect",
      "company",
      "estimatedDate",
      "fromStockLocation",
      "stockMoveLineList",
      "note",
      "pickingOrderComments",
      "originTypeSelect",
      "realDate"
    ],
    mapFields: {
      availableStatusSelect: "availableStatusSelect",
      stockMoveSeq: "stockMoveSeq",
      statusSelect: "statusSelect",
      availableStatusSelect: "availableStatusSelect",
      company: "company",
      estimatedDate: "estimatedDate",
      fromStockLocation: "fromStockLocation",
      stockMoveLineList: "stockMoveLineList",
      note: "note",
      pickingOrderComments: "pickingOrderComments",
      originTypeSelect: "originTypeSelect",
      realDate: "realDate",
    },
  },
  StockMoveLine: {
    model: 'com.axelor.apps.stock.db.StockMoveLine',
    fields: [
      "product",
      "availableStatusSelect",
      "qty",
      "realQty",
      "unit",
      "trackingNumber",
      "netMass",
    ],
    mapFields: {
      product: "product",
      availableStatusSelect: "availableStatusSelect",
      qty: "qty",
      realQty: "realQty",
      unit: "unit",
      trackingNumber: "trackingNumber",
      netMass: "netMass",
    },
  },
  ProdHumanResource: {
    model: 'com.axelor.apps.production.db.ProdHumanResource',
    fields: ['employee', 'operationOrder'],
    mapFields: {
      employee: 'employee',
      operationOrder: 'operationOrder',
    },
  },
  ProdProcessLine: {
    model: 'com.axelor.apps.production.db.ProdProcessLine',
    fields: ['description', 'objectDescriptionList'],
    mapFields: {
      objectDescriptionList: 'objectDescriptionList',
      description: 'description',
    },
  },
  ObjectDescription: {
    model: 'com.axelor.apps.production.db.ObjectDescription',
    fields: ['description', 'image', 'prodProcessLine'],
    mapFields: {
      prodProcessLine: 'prodProcessLine',
      description: 'description',
      image: 'image',
    },
  },
  ProdProduct: {
    model: 'com.axelor.apps.production.db.ProdProduct',
    fields: ['product', 'qty', 'plannedQty'],
    mapFields: {
      product: 'product',
      qty: 'qty',
      plannedQty: 'plannedQty',
    },
  },
  Timesheet: {
    model: "com.axelor.apps.hr.db.Timesheet",
    fields: [],
  },
  TimeLogLine: {
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
      "attrs"
    ],
    mapFields: {
      hoursDuration: "durationStored"
    }
  },
  Product: {
    model: 'com.axelor.apps.base.db.Product',
    fields: ['isModel', 'expense', 'isShippingCostsProduct','code', 'name', 'productTypeSelect', 'productFamily','picture',
      'productFamily', 'productCategory', 'salePrice', 'unit','discountTypeSelect',
      'description', 'internalDescription', 'sellable'],
    mapFields: {
      productTypeSelect: 'product_type_select',
      discountTypeSelect:'discountTypeSelect',
      productFamily: 'product_family',
      productCategory: 'product_category',
      salePrice: 'sale_price',
      internalDescription: 'internal_description',
    },
    mapLabels: {
      code: 'Product.code',
      name: 'Product.name',
      productTypeSelect: 'Product.productTypeSelect',
      productFamily: 'Product.productFamily',
      productCategory: 'Product.productCategory',
      salePrice: 'Product.salePrice',
      unit: 'Product.unit',
      description: 'Product.description',
      internalDescription: 'Product.internalDescription',
      sellable: 'Product.sellable',
    },
    responseMapper: (data, rest) => {
      if (!data.picture) return data;
      return Object.assign({}, data, {
        pictureURL: `${rest.baseURL}ws/rest/com.axelor.meta.db.MetaFile/${data.picture.id}/content/download?image=true&v=${data.version}`
      })
    },
  },
  ProductCategory: {
    model: 'com.axelor.apps.base.db.ProductCategory',
    fields: ['code', 'name', 'parentProductCategory', 'productFamily'],
  },
  ProductFamily: {
    model: 'com.axelor.apps.base.db.ProductFamily',
    fields: ['code', 'name'],
  },
  OrderLine: {
    model: 'com.axelor.apps.sale.db.SaleOrderLine',
    fields: ['productName', 'product', 'exTaxTotal','priceDiscounted', 'inTaxTotal', 'qty', 'price', 'taxLine', 'unit', 'discountAmount', 'discountTypeSelect', 'priceDiscounted'],
    mapFields: {
      product: 'product',
      productName: 'product_name',
      qty: 'quantity',
      price: 'rate',
      taxLine: 'tax',
      unit: "unit",
      inTaxTotal: 'in_tax_total',
      exTaxTotal: 'ex_tax_total',
      discountAmount: 'discount_amount',
      discountTypeSelect: 'discount_type_select',
      priceDiscounted: 'price_discounted'
    },
    mapLabels: {
      productName: 'OrderLine.productName',
      qty: 'OrderLine.qty',
      price: 'OrderLine.price',
      taxLine: 'OrderLine.taxLine',
      unit: "OrderLine.unit",
      discountAmount: "OrderLine.discountAmount",
      discountTypeSelect: "OrderLine.discountTypeSelect",
      priceDiscounted: "OrderLine.priceDiscounted"

    },
  },
  Unit: {
    model: 'com.axelor.apps.base.db.Unit',
    fields: ['name', 'labelToPrinting', 'unitTypeSelect'],
    mapLabels: {
      labelToPrinting: 'Unit.labelToPrinting',
      unitTypeSelect: 'Unit.unitTypeSelect',
    },
  },
  OrderLineTax: {
    model: 'com.axelor.apps.sale.db.SaleOrderLineTax',
    fields: ['taxLine', 'taxTotal', 'inTaxTotal', 'exTaxBase'],
  },
  Event: {
    model: 'com.axelor.apps.crm.db.Event',
    fields: ['typeSelect', 'callTypeSelect', 'meetingType', 'statusSelect',
      'subject', 'startDateTime', 'endDateTime', 'duration', 'user', 'description',
      'partner', 'contactPartner', 'lead'],
    mapFields: {
      typeSelect: 'type_select',
      callTypeSelect: 'call_type_select',
      meetingType: 'meeting_type',
      statusSelect: 'status_select',
      startDateTime: 'start_date_time',
      partner: 'client_partner',
      supplierPartner: 'supplier_partner',
      contactPartner: 'contact_partner',
      endDateTime: 'end_date_time',
    },
    mapLabels: {
      typeSelect: 'Event.typeSelect',
      callTypeSelect: 'Event.callTypeSelect',
      meetingType: 'Event.meetingType',
      statusSelect: 'Event.statusSelect',
      subject: 'Event.subject',
      startDateTime: 'Event.startDateTime',
      duration: 'Event.duration',
      user: 'Event.user',
      description: 'Event.description',
      partner: 'Event.clientPartner',
      supplierPartner: 'Event.supplierPartner',
      contactPartner: 'Event.contactPartner',
      lead: 'Event.lead',
      endDateTime: 'Event.endDateTime',
    },
  },
  MeetingType: {
    model: 'com.axelor.apps.crm.db.MeetingType',
    fields: ['id', 'name'],
  },
  Opportunity: {
    model: 'com.axelor.apps.crm.db.Opportunity',
    fields: ['name', 'opportunityType', 'source', 'salesStageSelect',
      'nextStep', 'expectedCloseDate', 'probability', 'amount', 'currency',
      'partner', 'lead', 'user', 'company', 'description'],
    mapFields: {
      opportunityType: 'opportunity_type',
      salesStageSelect: 'sales_stage_select',
      nextStep: 'next_step',
      expectedCloseDate: 'expected_close_date',
    },
    mapLabels: {
      name: 'Opportunity.name',
      opportunityType: 'Opportunity.opportunityType',
      source: 'Opportunity.source',
      salesStageSelect: 'Opportunity.salesStageSelect',
      nextStep: 'Opportunity.nextStep',
      expectedCloseDate: 'Opportunity.expectedCloseDate',
      probability: 'Opportunity.probability',
      amount: 'Opportunity.amount',
      currency: 'Opportunity.currency',
      partner: 'Opportunity.partner',
      lead: 'Opportunity.lead',
      user: 'Opportunity.user',
      company: 'Opportunity.company',
      description: 'Opportunity.description',
    },
  },
  OpportunityType: {
    model: 'com.axelor.apps.crm.db.OpportunityType',
    fields: ['id', 'name'],
  },
  MetaSelectItem: {
    model: 'com.axelor.meta.db.MetaSelectItem',
    fields: ['value', 'title'],
  },
  Catalog: {
    model: 'com.axelor.apps.crm.db.Catalog',
    fields: ['name', 'pdfFile', 'catalogType', 'image', 'description'],
    mapFields: {
      name: 'name',
      pdfFile: 'pdfFile',
      catalogType: 'catalogType',
      image: 'image',
      description: 'description',
    },
    mapLabels: {
      name: 'Catalog.name',
      pdfFile: 'Catalog.pdfFile',
      description: 'Catalog.description',
      catalogType: 'Catalog.catalogType',
      image: 'Catalog.image',
    },
    responseMapper: (data, rest) => {
      if (!data.id) return data;
      return Object.assign({}, data, {
        pictureURL: `${rest.baseURL}ws/rest/com.axelor.apps.crm.db.Catalog/${data.id}/image/download?v=${data.version}&parentId=${data.id}&parentModel=com.axelor.apps.crm.db.Catalog&image=true`,
      });
    }
  },
  CatalogType: {
    model: 'com.axelor.apps.crm.db.CatalogType',
    fields: ['name'],
    mapFields: {
      name: 'name',
    },
  },
  Lead: {
    model: 'com.axelor.apps.crm.db.Lead',
    fields: ['name', 'firstName', 'titleSelect', 'enterpriseName', 'jobTitle','fullName',
      'industrySector', 'statusSelect', 'source', 'mobilePhone', 'fixedPhone',
      'emailAddress', 'emailAddress.address', 'primaryAddress', 'primaryCity', 'primaryCountry', 'primaryPostalCode', 'primaryState', 'description', 'user', 'team', 'eventList'],
    mapFields: {
      firstName: 'first_name',
      fullName: 'full_name',
      titleSelect: 'title_select',
      enterpriseName: 'company',
      jobTitle: 'job_title',
      industrySector: 'industry_sector',
      statusSelect: 'status_select',
      mobilePhone: 'mobile_phone',
      fixedPhone: 'fixed_phone',
      emailAddress: 'email_address',
      'emailAddress.address': 'email_address.address',
      primaryAddress: 'primary_address',
      primaryCountry: 'primary_country',
      primaryCity: 'primary_city',
      primaryPostalCode: 'primary_postal_code',
      primaryState: 'primary_state',
      eventList: 'event_list',
    },
    mapLabels: {
      name: 'Lead.name',
      firstName: 'Lead.firstName',
      titleSelect: 'Lead.titleSelect',
      enterpriseName: 'Lead.company',
      jobTitle: 'Lead.jobTitle',
      industrySector: 'Lead.industrySector',
      statusSelect: 'Lead.statusSelect',
      source: 'Lead.source',
      mobilePhone: 'Lead.mobilePhone',
      fixedPhone: 'Lead.fixedPhone',
      emailAddress: 'Lead.emailAddress',
      primaryAddress: 'Lead.primaryAddress',
      primaryCity: 'Lead.primaryCity',
      primaryCountry: 'Lead.primaryCountry',
      primaryPostalCode: 'Lead.primaryPostalCode',
      primaryState: 'Lead.primaryState',
      description: 'Lead.description',
      user: 'Lead.user',
      team: 'Lead.team',
    },
  },
  Team: {
    model: 'com.axelor.team.db.Team',
    fields: ['id', 'name'],

  },
  Duration: {
    model: 'com.axelor.apps.base.db.Duration',
    fields: ['id', 'name'],
  },
  PaymentCondition: {
    model: 'com.axelor.apps.account.db.PaymentCondition',
    fields: ['id', 'name'],
  },
  PaymentMode: {
    model: 'com.axelor.apps.account.db.PaymentMode',
    fields: ['id', 'name'],
  },
  Unit: {
    model: 'com.axelor.apps.base.db.Unit',
    fields: ['id', 'name'],
  },
  Language: {
    model: 'com.axelor.apps.base.db.Language',
    fields: ['id','code','name'],
  },
  Project:{
    model:"com.axelor.apps.project.db.Project",
    fields:['id','membersUserSet','fullName','name','contactPartner','clientPartner','customerAddress', 'company'],
    mapFields: {
      name:"name",
      fullName:"full_name",
      membersUserSet:"members_user_Set",
      contactPartner:"contact_partner",
      clientPartner:"client_partner",
      customerAddress:"customer_address"
    },
    mapLabels: {
      name:"Project.name",
      fullName:"Project.fullName",
      membersUserSet:"Project.membersUserSet",
      contactPartner:"Project.contactPartner",
      clientPartner:"Project.clientPartner"
    }
  },
  ProjectPlanningTime:{
    model:'com.axelor.apps.project.db.ProjectPlanningTime',
    fields:['date','user', 'startTime', 'endTime', 'task', 'project','description']
  },
  AppProject: {
    model: 'com.axelor.apps.base.db.AppProject',
    fields: ['id', 'code', 'isEnableSignature', 'resourceManagement']
  },
  Responsible:{
    model:'com.axelor.apps.hr.db.Employee',
    fields:['id','name','fullName','contactPartner']
  },
  QualityProcess:{
    model:'com.axelor.apps.quality.db.QualityProcess',
    fields:['code','name','controlPointModelList','optionalControlPointModelList','qualityCorrectiveActionList']
  },
  Wizard:{
    model:'com.axelor.apps.base.db.Wizard'
  },
  ...HR_MODELS
};
