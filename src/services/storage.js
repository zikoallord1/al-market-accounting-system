const DB_KEY = 'al-market-accounting-system-v1';

const emptyState = {
  items: [],
  customers: [],
  suppliers: [],
  sales: [],
  purchases: [],
  payments: [],
  expenses: [],
  employees: [],
  stockMovements: [],
  auditLog: [],
  settings: {
    currency: 'YER',
    marketName: 'نظام الماركت المحاسبي'
  }
};

export function loadState() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) return structuredClone(emptyState);
    return { ...structuredClone(emptyState), ...JSON.parse(raw) };
  } catch {
    return structuredClone(emptyState);
  }
}

export function saveState(state) {
  localStorage.setItem(DB_KEY, JSON.stringify(state));
}

export function clearLocalState() {
  localStorage.removeItem(DB_KEY);
}

export function createId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${crypto.randomUUID?.() || Math.random().toString(36).slice(2)}`;
}
