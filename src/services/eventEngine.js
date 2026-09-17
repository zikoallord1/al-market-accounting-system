import { createId } from './storage';

export function createBusinessEvent(type, payload, actor = 'system') {
  return {
    id: createId('evt'),
    type,
    occurredAt: new Date().toISOString(),
    actor,
    payload
  };
}

export function appendAudit(state, event) {
  return {
    ...state,
    auditLog: [...(state.auditLog || []), event]
  };
}

export function applySalesEvent(state, sale) {
  const event = createBusinessEvent('SALE_CREATED', sale);
  const next = {
    ...state,
    sales: [...state.sales, sale],
    stockMovements: [
      ...state.stockMovements,
      ...(sale.lines || []).map((line) => ({
        id: createId('mov'),
        type: 'SALE',
        itemId: line.itemId,
        quantity: -Number(line.quantity || 0),
        referenceId: sale.id,
        occurredAt: sale.createdAt
      }))
    ]
  };
  return appendAudit(next, event);
}
