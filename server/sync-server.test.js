import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const port=18000+(process.pid%1000);
const dataDir=await fs.mkdtemp(path.join(os.tmpdir(),'al-market-sync-'));
const server=spawn(process.execPath,['server/sync-server.js'],{
  env:{...process.env,PORT:String(port),DATA_DIR:dataDir},
  stdio:['ignore','pipe','pipe']
});
const base='http://127.0.0.1:'+port;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function request(url,options){for(let i=0;i<40;i++){try{return await fetch(url,options)}catch{await sleep(50)}}throw new Error('خادم الاختبار لم يبدأ');}
try{
  const health=await request(base+'/health');
  if(!health.ok)throw new Error('health check failed');
  const invalid=await request(base+'/api/sync/events',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:'env_bad',deviceId:'device_a',event:{id:'evt_bad',type:'SALE_CREATED'}})});
  if(invalid.status!==400)throw new Error('invalid payload was accepted');
  const event={id:'evt_test_1',type:'SALE_CREATED',occurredAt:new Date().toISOString(),actor:'test',payload:{id:'sale_test_1',referenceId:'ref_test_1'}};
  const envelope={id:event.id,deviceId:'device_a',createdAt:new Date().toISOString(),event};
  const first=await request(base+'/api/sync/events',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(envelope)});
  if(first.status!==201)throw new Error('first event was not accepted');
  const repeat=await request(base+'/api/sync/events',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(envelope)});
  const repeatData=await repeat.json();
  if(repeat.status!==200||!repeatData.idempotent)throw new Error('idempotency check failed');
  const conflictEvent={...event,id:'evt_test_2',payload:{...event.payload,id:'sale_test_2'}};
  const conflict=await request(base+'/api/sync/events',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:conflictEvent.id,deviceId:'device_b',createdAt:new Date().toISOString(),event:conflictEvent})});
  if(conflict.status!==409)throw new Error('cross-device conflict was not detected');
  const list=await request(base+'/api/sync/events?after=0');
  const data=await list.json();
  if(!list.ok||data.events.length!==1)throw new Error('event pull check failed');
  console.log('Sync server integration checks passed');
}finally{
  server.kill('SIGTERM');
  await fs.rm(dataDir,{recursive:true,force:true});
}