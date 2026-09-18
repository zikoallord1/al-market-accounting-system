import { createId } from './storage';

export const ACCOUNTING_STATUS = { OPEN:'Open', CLOSED:'Closed', LOCKED:'Locked' };

export function createJournalEntry({eventId,lines=[],status='DRAFT',currency='YER',description='',occurredAt=new Date().toISOString()}){
  return {id:createId('je'),eventId,occurredAt,currency,description,status,lines:lines.map((line,index)=>({...line,id:createId(`jel${index}`)}))};
}

export function validateJournalEntry(entry){
  const debit=entry.lines.reduce((s,l)=>s+Number(l.debit||0),0);
  const credit=entry.lines.reduce((s,l)=>s+Number(l.credit||0),0);
  return {balanced:Math.abs(debit-credit)<0.000001,debit,credit};
}

export function appendJournalDraft(state,entry){
  const check=validateJournalEntry(entry);
  if(!check.balanced) throw new Error('القيد غير متوازن');
  return {...state,journalEntries:[...(state.journalEntries||[]),entry]};
}
