const DB_KEY = 'al-market-accounting-system-v1';

const emptyState = {
  schemaVersion: 4,
  items: [], customers: [], suppliers: [], sales: [], purchases: [], payments: [],
  expenses: [], revenues: [], employees: [], stockMovements: [], stockBatches: [],
  auditLog: [], journalEntries: [], notifications: [], financeTransactions: [],
  settings: {
    currency: 'YER',
    marketName: 'نظام الماركت المحاسبي',
    locale: 'ar-YE',
    fiscalStatus: 'Open',
    inventoryCostMethod: 'FIFO'
  }
};

export function loadState() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) return structuredClone(emptyState);
    const saved = JSON.parse(raw);
    const items = (saved.items || []).map(item => ({
      ...item,
      openingStock: Number(item.openingStock ?? item.stock ?? 0),
      stock: Number(item.stock ?? item.openingStock ?? 0),
      baseUnit: item.baseUnit || item.unit || 'حبة',
      secondaryUnit: item.secondaryUnit || '',
      conversionFactor: Number(item.conversionFactor || 1),
      minStock: Number(item.minStock ?? 5)
    }));
    return {
      ...structuredClone(emptyState),
      ...saved,
      schemaVersion: 4,
      items,
      settings: { ...emptyState.settings, ...(saved.settings || {}) }
    };
  } catch {
    return structuredClone(emptyState);
  }
}

export function saveState(state) {
  localStorage.setItem(DB_KEY, JSON.stringify({ ...state, schemaVersion: 4 }));
}

export function clearLocalState() {
  localStorage.removeItem(DB_KEY);
}

export function exportState(state) {
  return JSON.stringify({ ...state, schemaVersion: 4 }, null, 2);
}

export function createId(prefix = 'id') {
  return prefix + '_' + Date.now() + '_' + (crypto.randomUUID?.() || Math.random().toString(36).slice(2));
}
