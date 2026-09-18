const QUEUE_KEY='al-market-accounting-system-offline-queue-v1';
const DEVICE_KEY='al-market-accounting-system-device-v1';
const SYNC_KEY='al-market-accounting-system-sync-v1';
const DEFAULT_SYNC_URL='http://localhost:8787';

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
export function getSyncUrl(){return localStorage.getItem('al-market-accounting-system-sync-url-v1')||DEFAULT_SYNC_URL}
export function setSyncUrl(url){const clean=String(url||'').trim().replace(/\/$/,'');if(!/^https?:\/\//i.test(clean))throw new Error('عنوان خادم المزامنة غير صالح');localStorage.setItem('al-market-accounting-system-sync-url-v1',clean);return clean}
export async function sendToSyncServer(envelope){
 const response=await fetch(getSyncUrl()+'/api/sync/events',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(envelope)});
 let data={};try{data=await response.json()}catch{}
 if(response.status===409||data.conflict)return {conflict:true,reason:data.reason||'تعارض يحتاج مراجعة',server:data.existing};
 if(!response.ok)throw new Error(data.error||('فشل الاتصال بخادم المزامنة: '+response.status));
 return data;
}
export async function checkSyncServer(){const response=await fetch(getSyncUrl()+'/health');if(!response.ok)throw new Error('خادم المزامنة غير متاح');return response.json()}
export async function processOfflineQueue({send=sendToSyncServer,onConflict}={}) {
  if(!getConnectivity()) return {processed:0,pending:readOfflineQueue().filter(x=>x.status==='pending').length,offline:true};
  const queue=readOfflineQueue();let processed=0,failed=0;
  writeSyncState({syncing:true});
  try{
    for(const operation of queue.filter(x=>x.status==='pending')){
      try{
        const result=await send(createSyncEnvelope(operation));
        if(result?.conflict){markConflict(operation.id,result.reason||'تعارض يحتاج مراجعة');if(onConflict)onConflict(operation,result);continue}
        markSynced(operation.id);processed++;
      }catch(error){failed++;writeSyncState({lastError:error.message});break}
    }
    const pending=readOfflineQueue().filter(x=>x.status==='pending').length;
    writeSyncState({syncing:false,lastSyncAt:processed?new Date().toISOString():readSyncState().lastSyncAt||null});
    return {processed,pending,failed,offline:false};
  }catch(error){writeSyncState({syncing:false,lastError:error.message});throw error}
}
