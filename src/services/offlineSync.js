const QUEUE_KEY='al-market-accounting-system-offline-queue-v1';
const DEVICE_KEY='al-market-accounting-system-device-v1';
const SYNC_KEY='al-market-accounting-system-sync-v1';

export function getDeviceId(){let id=localStorage.getItem(DEVICE_KEY);if(!id){id='device_'+Date.now()+'_'+Math.random().toString(36).slice(2);localStorage.setItem(DEVICE_KEY,id)}return id}
export function readOfflineQueue(){try{return JSON.parse(localStorage.getItem(QUEUE_KEY)||'[]')}catch{return[]}}
export function queueOperation(operation){const q=readOfflineQueue();if(q.some(x=>x.id===operation.id))return q;const next=[...q,{...operation,deviceId:getDeviceId(),queuedAt:operation.queuedAt||new Date().toISOString(),status:'pending'}];localStorage.setItem(QUEUE_KEY,JSON.stringify(next));return next}
export function markSynced(id){const next=readOfflineQueue().filter(x=>x.id!==id);localStorage.setItem(QUEUE_KEY,JSON.stringify(next));return next}
export function markConflict(id,reason){const next=readOfflineQueue().map(x=>x.id===id?{...x,status:'conflict',reason}:x);localStorage.setItem(QUEUE_KEY,JSON.stringify(next));return next}
export function clearOfflineQueue(){localStorage.removeItem(QUEUE_KEY)}
export function getConnectivity(){return typeof navigator==='undefined'?true:navigator.onLine}
export function queueIfOffline(operation){return getConnectivity()?false:(queueOperation(operation),true)}
export function createSyncEnvelope(event){return {id:event.id,deviceId:getDeviceId(),createdAt:new Date().toISOString(),event}}
export function readSyncState(){try{return JSON.parse(localStorage.getItem(SYNC_KEY)||'{}')}catch{return{}}}
export function writeSyncState(patch){const next={...readSyncState(),...patch,updatedAt:new Date().toISOString()};localStorage.setItem(SYNC_KEY,JSON.stringify(next));return next}
export function getSyncStatus(){const q=readOfflineQueue();const s=readSyncState();return {online:getConnectivity(),pending:q.filter(x=>x.status==='pending').length,conflicts:q.filter(x=>x.status==='conflict').length,deviceId:getDeviceId(),lastSyncAt:s.lastSyncAt||null,syncing:Boolean(s.syncing)}}

export async function processOfflineQueue({send,onConflict}={}) {
  if(!getConnectivity()) return {processed:0,pending:readOfflineQueue().length,offline:true};
  const queue=readOfflineQueue();let processed=0;
  writeSyncState({syncing:true});
  try{
    for(const operation of queue.filter(x=>x.status==='pending')){
      try{
        if(typeof send!=='function') break;
        const result=await send(createSyncEnvelope(operation));
        if(result?.conflict){markConflict(operation.id,result.reason||'تعارض يحتاج مراجعة');if(onConflict)onConflict(operation,result);continue}
        markSynced(operation.id);processed++;
      }catch(error){
        if(error?.conflict||error?.code==='CONFLICT'){markConflict(operation.id,error.message||'تعارض يحتاج مراجعة');if(onConflict)onConflict(operation,error);continue}
        break;
      }
    }
    writeSyncState({syncing:false,lastSyncAt:new Date().toISOString()});
  }catch(error){writeSyncState({syncing:false});throw error}
  return {processed,pending:readOfflineQueue().length,offline:false};
}
