
const model = 'com.axelor.apps.sale.db.SaleOrder';

const fields = ['clientPartner', 'contactPartner','fullName', 'mainInvoicingAddressStr',
  'deliveryAddressStr', 'saleOrderLineList', 'saleOrderLineTaxList',
  'description', 'internalNote', 'specificNotes', 'creationDate',
  'duration', 'endOfValidityDate', 'deliveryDate', 'exTaxTotal',
  'taxTotal', 'inTaxTotal', 'totalCostPrice', 'totalGrossMargin', 'statusSelect',
  'marginRate', 'salemanUser', 'paymentMode', 'paymentCondition', 'currency', 'company',
  'saleOrderSeq','parent','cancelReason','confirmationDateTime','confirmedByUser'
];

const mapFields = {
  clientPartner: 'client_partner',
  contactPartner: 'contact_partner',
  fullName: 'full_name',
  mainInvoicingAddressStr: 'main_invoicing_address_str',
  deliveryAddressStr: 'delivery_address_str',
  saleOrderLineList: 'sale_order_line_list',
  saleOrderLineTaxList: 'sale_order_line_tax_list',
  internalNote: 'internal_note',
  specificNotes: 'specific_notes',
  creationDate: 'creation_date',
  endOfValidityDate: 'end_of_validity_date',
  deliveryDate: 'delivery_date',
  exTaxTotal: 'ex_tax_total',
  taxTotal: 'tax_total',
  inTaxTotal: 'in_tax_total',
  totalCostPrice: 'total_cost_price',
  totalGrossMargin: 'total_gross_margin',
  marginRate: 'margin_rate',
  salemanUser: 'saleman_user',
  paymentMode: 'payment_mode',
  paymentCondition: 'payment_condition',
  statusSelect: 'status_select',
  saleOrderSeq:'sale_Order_Seq',
  cancelReason:'cancel_reason',
  confirmationDateTime:'confirmation_date_time',
  confirmedByUser:'confirmed_by_user',
};

const mapLabels = {
  clientPartner: 'order.clientPartner',
  contactPartner: 'order.contactPartner',
  mainInvoicingAddressStr: 'order.mainInvoicingAddressStr',
  deliveryAddressStr: 'order.deliveryAddressStr',
  saleOrderLineList: 'order.saleOrderLineList',
  saleOrderLineTaxList: 'order.saleOrderLineTaxList',
  description: 'order.description',
  internalNote: 'order.internalNote',
  specificNotes: 'order.specificNotes',
  creationDate: 'order.creationDate',
  duration: 'order.duration',
  endOfValidityDate: 'order.endOfValidityDate',
  deliveryDate: 'order.deliveryDate',
  exTaxTotal: 'order.exTaxTotal',
  taxTotal: 'order.taxTotal',
  inTaxTotal: 'order.inTaxTotal',
  totalCostPrice: 'order.totalCostPrice',
  totalGrossMargin: 'order.totalGrossMargin',
  marginRate: 'order.marginRate',
  salemanUser: 'order.salemanUser',
  paymentMode: 'order.paymentMode',
  paymentCondition: 'order.paymentCondition',
  currency: 'order.currency',
  company: 'order.company',
  statusSelect: 'order.statusSelect',
  saleOrderSeq:'order.saleOrderSeq',
  cancelReason:'order.cancelReason',
  confirmationDateTime:'order.confirmationDateTime',
  confirmedByUser:'order.confirmedByUser'
};
export default {
  model,
  fields,
  mapFields,
  mapLabels,
};
