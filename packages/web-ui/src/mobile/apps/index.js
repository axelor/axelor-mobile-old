import CRMApp from './crm';
import SaleApp from './sale';
import TimesheetApp from './timesheet';
import ExpenseApp from './expense';
import LeaveApp from './leave';
import TaskApp from './task';
import QualityApp from './quality';
import StockApp from './stock';
import ProductionApp from './production';

export const apps = [
  CRMApp,
  SaleApp,
  TimesheetApp,
  ExpenseApp,
  LeaveApp,
  TaskApp,
  QualityApp,
  StockApp,
  ProductionApp
];

export const WEB_APP_CONGIG_KEY = 'web.ui.configs';
export const WEB_APP_ACTIVE_KEY = 'web.ui.app';
export const WEB_APPS_KEY = 'web.ui.apps';

const flatten = list => list.reduce(
  (a, b) => a.concat(Array.isArray(b) ? flatten(b) : b), []
);

export function setActiveApp(appIndex = 0) {
  localStorage.setItem(WEB_APP_ACTIVE_KEY, appIndex);
}

export function getActiveApp() {
  return localStorage.getItem(WEB_APP_ACTIVE_KEY) || 0;
}

export function setAppConfigs(configs) {
  localStorage.setItem(WEB_APP_CONGIG_KEY, JSON.stringify(configs));
}

export function setApps(appList) {
  setActiveApp(0);
  localStorage.setItem(WEB_APPS_KEY, JSON.stringify(appList));
}

export function getApps() {
  return JSON.parse(localStorage.getItem(WEB_APPS_KEY) || '["crm", "sale", "expense", "timesheet", "leave", "task","quality","stock"]');
}

export default function() {
  let getDefaultConfig = () => apps.map(app => {
    const pages = (app.menu || []).map(item => {
      let values = [item];
      if (typeof item === 'object' && item.items && Array.isArray(item.items)) {
        values = item.items;
      }
      return values.filter(x => x.config !== false).map(x => x.name);
    });
    return flatten(pages);
  });

  const existApps = JSON.parse(localStorage.getItem(WEB_APP_CONGIG_KEY) || '[]');

  if (existApps.length !== apps.length) {
    localStorage.setItem(WEB_APP_CONGIG_KEY, JSON.stringify(getDefaultConfig()));
  }
  return {
    data: apps,
    configs: JSON.parse(localStorage.getItem(WEB_APP_CONGIG_KEY)),
  };
}
