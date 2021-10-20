const model = 'com.axelor.apps.base.db.Partner';

const fields = ['partnerTypeSelect', 'name', 'firstName', 'titleSelect', 'picture',
'contactPartnerSet', 'partnerAddressList', 'fixedPhone', 'emailAddress',
'webSite', 'partnerSeq', 'isCustomer', 'isProspect', 'source', 'user', 'partnerCategory',
'industrySector', 'nbrEmployees', 'registrationCode', 'taxNbr', 'description',
'saleTurnover', 'parentPartner', 'language', 'currency', 'emailAddress.address',
'fullName', 'mainPartner', 'companySet', 'team', 'contactAddress', 'mobilePhone', 'jobTitle','isContact'];

const mapFields = {
  partnerTypeSelect: 'partner_type_select',
  firstName: 'first_name',
  titleSelect: 'title_select',
  nbrEmployees: 'nbr_employees',
  contactPartnerSet: 'contact_partner_set',
  partnerAddressList: 'partner_address_list',
  fixedPhone: 'fixed_phone',
  emailAddress: 'email_address',
  webSite: 'web_site',
  partnerSeq: 'partner_seq',
  isCustomer: 'is_customer',
  isProspect: 'is_prospect',
  industrySector: 'industry_sector',
  registrationCode: 'registration_code',
  taxNbr: 'tax_nbr',
  saleTurnover: 'sale_turnover',
  parentPartner: 'parent_partner',
  language: 'language_select',
  'emailAddress.address': 'email_address.address',
  fullName: 'full_name',
  mainPartner: 'main_partner',
  companySet: 'company_set',
  contactAddress: 'contact_address',
  mobilePhone: 'mobile_phone',
  jobTitle: 'job_title',
  partnerCategory: 'partner_category',
  isContact:'is_contact'
};

const mapLabels = {
  name: 'Partner.name',
  firstName: 'Partner.firstName',
  titleSelect: 'Partner.titleSelect',
  contactPartnerSet: 'Partner.contactPartnerSet',
  partnerAddressList: 'Partner.partnerAddressList',
  fixedPhone: 'Partner.fixedPhone',
  emailAddress: 'Partner.emailAddress',
  webSite: 'Partner.webSite',
  partnerSeq: 'Partner.partnerSeq',
  isCustomer: 'Partner.isCustomer',
  isProspect: 'Partner.isProspect',
  source: 'Partner.source',
  user: 'Partner.user',
  industrySector: 'Partner.industrySector',
  nbrEmployees: 'Partner.nbrEmployees',
  registrationCode: 'Partner.registrationCode',
  taxNbr: 'Partner.taxNbr',
  description: 'Partner.description',
  saleTurnover: 'Partner.saleTurnover',
  parentPartner: 'Partner.parentPartner',
  language: 'Partner.languageSelect',
  currency: 'Partner.currency',
  mainPartner: 'Partner.mainPartner',
  mobilePhone: 'Partner.mobilePhone',
  jobTitle: 'Partner.jobTitle',
  contactAddress: 'Partner.contactAddress',
  team: 'Partner.team',
  companySet: 'Partner.companySet',
  partnerCategory: 'Partner.partnerCategory',
  isContact:'Partner.isContact'
};

const responseMapper = (data, rest) => {
  if (!data.picture) return data;
  return Object.assign({}, data, {
    pictureURL: `${rest.baseURL}ws/rest/com.axelor.meta.db.MetaFile/${data.picture.id}/content/download?image=true&v=${data.version}`
  })
};

export default {
  model,
  fields,
  mapFields,
  mapLabels,
  responseMapper,
};
