import SaleCustomers from './customer/list';
import ProductsList from './product/list-products';
import SaleContacts from './contact/list';
import OrdersList from './sales/list-orders';
import QuotationsList from './sales/list-quotation';

const ROUTES = [
  { path: 'sale_customers', component: SaleCustomers },
  { path: 'sale_contacts', component: SaleContacts },
  { path: 'sale_products', component: ProductsList },
  { path: 'sale_orders', component: OrdersList },
  { path: 'sale_quotations', component: QuotationsList },
];

export default ROUTES;
