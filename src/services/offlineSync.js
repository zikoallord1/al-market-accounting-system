const QUEUE_KEY='al-market-accounting-system-offline-queue-v1';
export function readOfflineQueue(){try{return JSON.parse(localStorage.getItem(QUEUE_KEY)||'[]')}catch{return[]}}
export function queueOperation(operation){const q=readOfflineQueue();if(q.some(x=>x.id===operation.id))return q;const next=[...q,{...operation,queuedAt:operation.queuedAt||new Date().toISOString(),status:'pending'}];localStorage.setItem(QUEUE_KEY,JSON.stringify(next));return next}
export function markSynced(id){const next=readOfflineQueue().filter(x=>x.id!==id);localStorage.setItem(QUEUE_KEY,JSON.stringify(next));return next}
export function clearOfflineQueue(){localStorage.removeItem(QUEUE_KEY)}
export function getConnectivity(){return typeof navigator==='undefined'?true:navigator.onLine}
