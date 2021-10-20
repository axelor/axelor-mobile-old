import EventList from './crm-events/EventList';
import OpportunityList from './crm-opportunity/OpportunityList';
import LeadList from './crm-leads/LeadList';
import ProspectList from './crm-prospects/ProspectList';
import CatalogList from './crm-catalog/CatalogList';
import CustomersPage from './customers';
import ContactsPage from './contacts';

const ROUTES = [
  { path: 'crm_events', component: EventList },
  { path: 'crm_leads', component: LeadList },
  { path: 'crm_prospect', component: ProspectList },
  { path: 'crm_catalog', component: CatalogList },
  { path: 'crm_opportunity', component: OpportunityList },
  { path: 'crm_customers', component: CustomersPage },
  { path: 'crm_contacts', component: ContactsPage },
];

export default ROUTES;
