import { createId } from './storage';

export function createBusinessEvent(type, payload, actor = 'system') {
  return { id: createId('evt'), type, occurredAt: new Date().toISOString(), actor, payload };
}
export function appendAudit(state, event) { return { ...state, auditLog: [...(state.auditLog || []), event] }; }
const alreadyApplied = (state, id) => (state.auditLog || []).some(e => e.payload?.id === id);
function baseQuantity(line) { return Number(line.quantity || 0) * Number(line.conversionFactor || 1); }

function openingLayer(item) {
  const qty = Number(item?.openingStock ?? item?.stock ?? 0);
  return qty > 0 ? [{id:`opening_${item.id}`,itemId:item.id,referenceId:'OPENING_STOCK',quantity:qty,remainingQuantity:qty,unitCost:Number(item.cost||0),createdAt:'1970-01-01T00:00:00.000Z',source:'opening'}] : [];
}
export function getFifoBatches(state,itemId) {
  const item=(state.items||[]).find(x=>x.id===itemId);
  return [...openingLayer(item),...(state.stockBatches||[]).filter(b=>b.itemId===itemId&&Number(b.remainingQuantity)>0)].sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt));
}
function consumeFifo(state,lines,saleId) {
  const updated=(state.stockBatches||[]).map(x=>({...x})), consumed=[];
  for(const line of lines||[]) {
    let remaining=baseQuantity(line);
    const item=(state.items||[]).find(x=>x.id===line.itemId);
    for(const layer of getFifoBatches({...state,stockBatches:updated},line.itemId)) {
      if(remaining<=0) break;
      const available=Number(layer.remainingQuantity||0);
      const take=Math.min(remaining,available);
      if(take<=0) continue;
      consumed.push({id:createId('fifo'),saleId,itemId:line.itemId,batchId:layer.id,quantity:take,unitCost:Number(layer.unitCost||0)});
      remaining-=take;
      if(layer.source!=='opening'){const target=updated.find(b=>b.id===layer.id);if(target)target.remainingQuantity=available-take;}
    }
    if(remaining>0){consumed.push({id:createId('fifo'),saleId,itemId:line.itemId,batchId:null,quantity:remaining,unitCost:Number(item?.cost||line.cost||0),unlayered:true});}
  }
  return {updatedBatches:updated,consumed};
}
export function applySalesEvent(state,sale) {
  if(alreadyApplied(state,sale.id)) return state;
  const event=createBusinessEvent('SALE_CREATED',sale);
  const movements=(sale.lines||[]).map(line=>({id:createId('mov'),type:'SALE',itemId:line.itemId,quantity:-baseQuantity(line),referenceId:sale.id,unit:line.unit||'حبة',conversionFactor:Number(line.conversionFactor||1),unitCost:Number(line.cost||0),occurredAt:sale.createdAt}));
  const fifo=consumeFifo(state,sale.lines,sale.id);
  const costOfGoods=fifo.consumed.reduce((s,x)=>s+x.quantity*x.unitCost,0);
  return appendAudit({...state,sales:[...(state.sales||[]),{...sale,fifoConsumption:fifo.consumed,costOfGoods}],stockMovements:[...(state.stockMovements||[]),...movements],stockBatches:fifo.updatedBatches},event);
}
export function applyPurchaseEvent(state,purchase) {
  if(alreadyApplied(state,purchase.id)) return state;
  const event=createBusinessEvent('PURCHASE_CREATED',purchase);
  const movements=(purchase.lines||[]).map(line=>({id:createId('mov'),type:'PURCHASE',itemId:line.itemId,quantity:baseQuantity(line),referenceId:purchase.id,unit:line.unit||'حبة',conversionFactor:Number(line.conversionFactor||1),unitCost:Number(line.cost||0),batchId:createId('batch'),occurredAt:purchase.createdAt}));
  const batches=movements.map((m,i)=>({id:m.batchId,itemId:m.itemId,referenceId:purchase.id,quantity:m.quantity,remainingQuantity:m.quantity,unitCost:m.unitCost,createdAt:purchase.createdAt,sourceLine:purchase.lines[i]}));
  const credit=Number(purchase.payments?.credit||0);
  return appendAudit({...state,purchases:[...(state.purchases||[]),purchase],stockMovements:[...(state.stockMovements||[]),...movements],stockBatches:[...(state.stockBatches||[]),...batches],supplierTransactions:credit>0?[...(state.supplierTransactions||[]),{id:createId('suptrx'),supplierId:purchase.supplierId,referenceId:purchase.id,type:'PURCHASE',debit:credit,credit:0,amount:credit,occurredAt:purchase.createdAt,currency:purchase.currency||'YER'}]:(state.supplierTransactions||[]),financeTransactions:[...(state.financeTransactions||[]),{id:createId('fintrx'),referenceId:purchase.id,type:'PURCHASE',amount:purchase.total,payments:purchase.payments,occurredAt:purchase.createdAt,currency:purchase.currency||'YER'}]},event);
}
export function getCurrentStock(state,itemId) {
  const item=(state.items||[]).find(x=>x.id===itemId); if(!item)return 0;
  return Number(item.openingStock??item.stock??0)+(state.stockMovements||[]).filter(m=>m.itemId===itemId).reduce((s,m)=>s+Number(m.quantity||0),0);
}