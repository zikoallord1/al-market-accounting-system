import { createId } from './storage';

export function createBusinessEvent(type, payload, actor = 'system') {
  return { id: createId('evt'), type, occurredAt: new Date().toISOString(), actor, payload };
}

export function appendAudit(state, event) {
  return { ...state, auditLog: [...(state.auditLog || []), event] };
}

const alreadyApplied = (state, referenceId) =>
  (state.auditLog || []).some(event => event.payload?.id === referenceId);

function baseQuantity(line) {
  return Number(line.quantity || 0) * Number(line.conversionFactor || 1);
}

export function applySalesEvent(state, sale) {
  if (alreadyApplied(state, sale.id)) return state;
  const event = createBusinessEvent('SALE_CREATED', sale);
  const movements = (sale.lines || []).map(line => ({
    id: createId('mov'), type: 'SALE', itemId: line.itemId,
    quantity: -baseQuantity(line), referenceId: sale.id,
    unit: line.unit || 'حبة', unitCost: Number(line.cost || 0),
    occurredAt: sale.createdAt
  }));
  return appendAudit({
    ...state,
    sales: [...(state.sales || []), sale],
    stockMovements: [...(state.stockMovements || []), ...movements]
  }, event);
}

export function applyPurchaseEvent(state, purchase) {
  if (alreadyApplied(state, purchase.id)) return state;
  const event = createBusinessEvent('PURCHASE_CREATED', purchase);
  const movements = (purchase.lines || []).map(line => ({
    id: createId('mov'), type: 'PURCHASE', itemId: line.itemId,
    quantity: baseQuantity(line), referenceId: purchase.id,
    unit: line.unit || 'حبة', unitCost: Number(line.cost || 0),
    batchId: createId('batch'), occurredAt: purchase.createdAt
  }));
  const batches = movements.map((m, i) => ({
    id: m.batchId, itemId: m.itemId, referenceId: purchase.id,
    quantity: m.quantity, remainingQuantity: m.quantity,
    unitCost: m.unitCost, createdAt: purchase.createdAt,
    sourceLine: purchase.lines[i]
  }));
  return appendAudit({
    ...state,
    purchases: [...(state.purchases || []), purchase],
    stockMovements: [...(state.stockMovements || []), ...movements],
    stockBatches: [...(state.stockBatches || []), ...batches]
  }, event);
}

export function getCurrentStock(state, itemId) {
  const item = (state.items || []).find(x => x.id === itemId);
  if (!item) return 0;
  const opening = Number(item.openingStock ?? item.stock ?? 0);
  return opening + (state.stockMovements || [])
    .filter(m => m.itemId === itemId)
    .reduce((sum, m) => sum + Number(m.quantity || 0), 0);
}

export function getFifoBatches(state, itemId) {
  return (state.stockBatches || [])
    .filter(batch => batch.itemId === itemId && Number(batch.remainingQuantity) > 0)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}
