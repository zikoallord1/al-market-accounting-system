const DB_KEY = 'al-market-accounting-system-v1';
const emptyState = {
  schemaVersion: 2,
  items: [], customers: [], suppliers: [], sales: [], purchases: [], payments: [], expenses: [],
  employees: [], stockMovements: [], auditLog: [], journalEntries: [], notifications: [],
  settings: { currency: 'YER', marketName: 'نظام الماركت المحاسبي', locale: 'ar-YE', fiscalStatus: 'Open' }
};
export function loadState(){try{const raw=localStorage.getItem(DB_KEY);if(!raw)return structuredClone(emptyState);const saved=JSON.parse(raw);return {...structuredClone(emptyState),...saved,schemaVersion:2,settings:{...emptyState.settings,...(saved.settings||{})}}}catch{return structuredClone(emptyState)}}
export function saveState(state){localStorage.setItem(DB_KEY,JSON.stringify({...state,schemaVersion:2}))}
export function clearLocalState(){localStorage.removeItem(DB_KEY)}
export function exportState(state){return JSON.stringify({...state,schemaVersion:2},null,2)}
export function createId(prefix='id'){return `${prefix}_${Date.now()}_${crypto.randomUUID?.()||Math.random().toString(36).slice(2)}`}
