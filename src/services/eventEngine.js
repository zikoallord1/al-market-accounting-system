import { createId } from './storage';

export function createBusinessEvent(type, payload, actor = 'system') {
  return { id: createId('evt'), type, occurredAt: new Date().toISOString(), actor, payload };
}
export function appendAudit(state, event) {
  return { ...state, auditLog: [...(state.auditLog || []), event] };
}
const alreadyApplied = (state, id) => (state.auditLog || []).some(e => e.payload?.id === id);
const money = value => Number(value || 0);
const baseQuantity = line => money(line.quantity) * money(line.conversionFactor || 1);

function openingLayer(item, state) {
  const qty = money(item?.openingStock ?? item?.stock);
  if (qty <= 0) return null;
  const id = `opening_${item.id}`;
  const consumed = (state.sales || []).reduce((sum, sale) =>
    sum + (sale.fifoConsumption || [])
      .filter(x => x.itemId === item.id && x.batchId === id)
      .reduce((s, x) => s + money(x.quantity), 0), 0);
  const remaining = Math.max(qty - consumed, 0);
  return remaining > 0 ? { id, itemId:item.id, referenceId:'OPENING_STOCK', quantity:qty,
    remainingQuantity:remaining, unitCost:money(item.cost),
    createdAt:'1970-01-01T00:00:00.000Z', source:'opening' } : null;
}

export function getFifoBatches(state, itemId) {
  const item = (state.items || []).find(x => x.id === itemId);
  const opening = openingLayer(item, state);
  return [...(opening ? [opening] : []),
    ...(state.stockBatches || []).filter(b => b.itemId === itemId && money(b.remainingQuantity) > 0)]
    .sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt));
}

function availableFifoQuantity(state, itemId) {
  return getFifoBatches(state, itemId).reduce((sum,b) => sum + money(b.remainingQuantity), 0);
}

function consumeFifo(state, lines, saleId) {
  const updated = (state.stockBatches || []).map(x => ({...x}));
  const consumed = [];
  for (const line of lines || []) {
    const required = baseQuantity(line);
    if (required <= 0) throw new Error('كمية البيع يجب أن تكون أكبر من صفر');
    const available = availableFifoQuantity({...state, stockBatches:updated}, line.itemId);
    if (required > available + 0.000001) {
      const item = (state.items || []).find(x => x.id === line.itemId);
      throw new Error(`الرصيد غير كافٍ للصنف: ${item?.name || line.itemId}`);
    }
    let remaining = required;
    for (const layer of getFifoBatches({...state,stockBatches:updated}, line.itemId)) {
      if (remaining <= 0) break;
      const take = Math.min(remaining, money(layer.remainingQuantity));
      if (take <= 0) continue;
      consumed.push({id:createId('fifo'),saleId,itemId:line.itemId,batchId:layer.id,
        quantity:take,unitCost:money(layer.unitCost)});
      remaining -= take;
      if (layer.source !== 'opening') {
        const target = updated.find(b => b.id === layer.id);
        if (target) target.remainingQuantity = Math.max(money(target.remainingQuantity)-take,0);
      }
    }
  }
  return {updatedBatches:updated,consumed};
}

export function applySalesEvent(state, sale) {
  if (alreadyApplied(state,sale.id)) return state;
  if (!sale.lines?.length) throw new Error('لا يمكن حفظ فاتورة بيع بدون أصناف');
  const total = money(sale.total), paid = money(sale.paid);
  if (Math.abs(total-paid) > 0.000001) throw new Error('إجمالي المدفوع لا يساوي إجمالي الفاتورة');
  if (money(sale.payments?.credit) > 0 && !sale.customerId) throw new Error('البيع الآجل يتطلب اختيار العميل');

  const fifo = consumeFifo(state,sale.lines,sale.id);
  const credit = money(sale.payments?.credit);
  const customerTransactions = credit > 0
    ? [...(state.customerTransactions || []), {id:createId('ctrx'),customerId:sale.customerId,
        referenceId:sale.id,type:'SALE_CREDIT',debit:credit,credit:0,amount:credit,
        occurredAt:sale.createdAt,currency:sale.currency || 'YER'}]
    : (state.customerTransactions || []);
  const event = createBusinessEvent('SALE_CREATED',sale);
  const movements = sale.lines.map(line => ({id:createId('mov'),type:'SALE',itemId:line.itemId,
    quantity:-baseQuantity(line),referenceId:sale.id,unit:line.unit || 'حبة',
    conversionFactor:money(line.conversionFactor || 1),unitCost:money(line.cost),occurredAt:sale.createdAt}));

  return appendAudit({...state,
    sales:[...(state.sales || []),{...sale,fifoConsumption:fifo.consumed,
      costOfGoods:fifo.consumed.reduce((s,x)=>s+x.quantity*x.unitCost,0)}],
    stockMovements:[...(state.stockMovements || []),...movements],
    stockBatches:fifo.updatedBatches, customerTransactions,
    financeTransactions:[...(state.financeTransactions || []),{id:createId('fintrx'),
      referenceId:sale.id,type:'SALE',amount:total,payments:sale.payments,
      occurredAt:sale.createdAt,currency:sale.currency || 'YER'}]
  },event);
}

export function applyPurchaseEvent(state,purchase) {
  if (alreadyApplied(state,purchase.id)) return state;
  if (!purchase.lines?.length) throw new Error('لا يمكن حفظ فاتورة شراء بدون أصناف');
  const total = money(purchase.total), paid = money(purchase.paid);
  if (Math.abs(total-paid) > 0.000001) throw new Error('إجمالي المدفوع لا يساوي إجمالي الفاتورة');

  const event = createBusinessEvent('PURCHASE_CREATED',purchase);
  const movements = purchase.lines.map(line => ({id:createId('mov'),type:'PURCHASE',itemId:line.itemId,
    quantity:baseQuantity(line),referenceId:purchase.id,unit:line.unit || 'حبة',
    conversionFactor:money(line.conversionFactor || 1),unitCost:money(line.cost),
    batchId:createId('batch'),occurredAt:purchase.createdAt}));
  const batches = movements.map((m,i) => ({id:m.batchId,itemId:m.itemId,referenceId:purchase.id,
    quantity:m.quantity,remainingQuantity:m.quantity,unitCost:m.unitCost,
    createdAt:purchase.createdAt,sourceLine:purchase.lines[i]}));
  const credit = money(purchase.payments?.credit);

  return appendAudit({...state,purchases:[...(state.purchases || []),purchase],
    stockMovements:[...(state.stockMovements || []),...movements],
    stockBatches:[...(state.stockBatches || []),...batches],
    supplierTransactions:credit > 0
      ? [...(state.supplierTransactions || []),{id:createId('suptrx'),supplierId:purchase.supplierId,
          referenceId:purchase.id,type:'PURCHASE_CREDIT',debit:credit,credit:0,amount:credit,
          occurredAt:purchase.createdAt,currency:purchase.currency || 'YER'}]
      : (state.supplierTransactions || []),
    financeTransactions:[...(state.financeTransactions || []),{id:createId('fintrx'),referenceId:purchase.id,
      type:'PURCHASE',amount:total,payments:purchase.payments,occurredAt:purchase.createdAt,
      currency:purchase.currency || 'YER'}]
  },event);
}

export function applyCustomerPaymentEvent(state,payment) {
  if (alreadyApplied(state,payment.id)) return state;
  if (!payment.customerId || money(payment.amount) <= 0) throw new Error('بيانات تحصيل العميل غير مكتملة');
  const event = createBusinessEvent('CUSTOMER_PAYMENT_CREATED',payment);
  return appendAudit({...state,payments:[...(state.payments || []),payment],
    customerTransactions:[...(state.customerTransactions || []),{id:createId('ctrx'),
      customerId:payment.customerId,referenceId:payment.id,type:'CUSTOMER_PAYMENT',
      debit:0,credit:money(payment.amount),amount:money(payment.amount),
      occurredAt:payment.createdAt,currency:payment.currency || 'YER',
      paymentMethod:payment.paymentMethod}],
    financeTransactions:[...(state.financeTransactions || []),{id:createId('fintrx'),
      referenceId:payment.id,type:'CUSTOMER_PAYMENT',amount:money(payment.amount),
      paymentMethod:payment.paymentMethod,occurredAt:payment.createdAt,
      currency:payment.currency || 'YER'}]
  },event);
}

export function applySupplierPaymentEvent(state,payment) {
  if (alreadyApplied(state,payment.id)) return state;
  if (!payment.supplierId || money(payment.amount) <= 0) throw new Error('بيانات سداد المورد غير مكتملة');
  const event = createBusinessEvent('SUPPLIER_PAYMENT_CREATED',payment);
  return appendAudit({...state,payments:[...(state.payments || []),payment],
    supplierTransactions:[...(state.supplierTransactions || []),{id:createId('suptrx'),
      supplierId:payment.supplierId,referenceId:payment.id,type:'SUPPLIER_PAYMENT',
      debit:money(payment.amount),credit:0,amount:money(payment.amount),
      occurredAt:payment.createdAt,currency:payment.currency || 'YER',
      paymentMethod:payment.paymentMethod}],
    financeTransactions:[...(state.financeTransactions || []),{id:createId('fintrx'),
      referenceId:payment.id,type:'SUPPLIER_PAYMENT',amount:money(payment.amount),
      paymentMethod:payment.paymentMethod,occurredAt:payment.createdAt,
      currency:payment.currency || 'YER'}]
  },event);
}

export function getCurrentStock(state,itemId) {
  const item=(state.items || []).find(x => x.id===itemId);
  if (!item) return 0;
  return money(item.openingStock ?? item.stock) +
    (state.stockMovements || []).filter(m => m.itemId===itemId).reduce((s,m)=>s+money(m.quantity),0);
}
export function getCustomerBalance(state,customerId) {
  const opening=money((state.customers || []).find(x=>x.id===customerId)?.openingBalance);
  return opening + (state.customerTransactions || []).filter(x=>x.customerId===customerId)
    .reduce((s,x)=>s+money(x.debit)-money(x.credit),0);
}
export function getSupplierBalance(state,supplierId) {
  const opening=money((state.suppliers || []).find(x=>x.id===supplierId)?.openingBalance);
  return opening + (state.supplierTransactions || []).filter(x=>x.supplierId===supplierId)
    .reduce((s,x)=>s+money(x.debit)-money(x.credit),0);
}
