import { createId } from './storage';

export function createBusinessEvent(type,payload,actor='system'){
  return {id:createId('evt'),type,occurredAt:new Date().toISOString(),actor,payload};
}
export function appendAudit(state,event){return {...state,auditLog:[...(state.auditLog||[]),event]};}
const alreadyApplied=(state,referenceId)=>state.auditLog?.some(e=>e.payload?.id===referenceId);
export function applySalesEvent(state,sale){
  if(alreadyApplied(state,sale.id))return state;
  const event=createBusinessEvent('SALE_CREATED',sale);
  const movements=(sale.lines||[]).map(line=>({id:createId('mov'),type:'SALE',itemId:line.itemId,quantity:-Number(line.quantity||0),referenceId:sale.id,unitCost:Number(line.cost||0),occurredAt:sale.createdAt}));
  return appendAudit({...state,sales:[...state.sales,sale],stockMovements:[...state.stockMovements,...movements]},event);
}
export function applyPurchaseEvent(state,purchase){
  if(alreadyApplied(state,purchase.id))return state;
  const event=createBusinessEvent('PURCHASE_CREATED',purchase);
  const movements=(purchase.lines||[]).map(line=>({id:createId('mov'),type:'PURCHASE',itemId:line.itemId,quantity:Number(line.quantity||0),referenceId:purchase.id,unitCost:Number(line.cost||0),occurredAt:purchase.createdAt}));
  return appendAudit({...state,purchases:[...state.purchases,purchase],stockMovements:[...state.stockMovements,...movements]},event);
}
