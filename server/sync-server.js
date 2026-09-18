import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const PORT=Number(process.env.PORT||8787);
const DATA_DIR=process.env.DATA_DIR||path.join(process.cwd(),'server-data');
const DATA_FILE=path.join(DATA_DIR,'sync-events.json');
fs.mkdirSync(DATA_DIR,{recursive:true});
const read=()=>{try{return JSON.parse(fs.readFileSync(DATA_FILE,'utf8'))}catch{return {events:{},order:[]}}};
const write=db=>{const temp=DATA_FILE+'.tmp';fs.writeFileSync(temp,JSON.stringify(db,null,2),'utf8');fs.renameSync(temp,DATA_FILE)};
const json=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Content-Type','Access-Control-Allow-Methods':'GET,POST,OPTIONS'});res.end(JSON.stringify(data))};
const body=req=>new Promise((resolve,reject)=>{let s='';req.on('data',c=>{s+=c;if(s.length>5000000)req.destroy()});req.on('end',()=>{try{resolve(JSON.parse(s||'{}'))}catch(e){reject(e)}});req.on('error',reject)});
const server=http.createServer(async(req,res)=>{
 if(req.method==='OPTIONS')return json(res,204,{});
 try{
  if(req.method==='GET'&&req.url==='/health')return json(res,200,{ok:true,service:'al-market-sync',time:new Date().toISOString()});
  if(req.method==='POST'&&req.url==='/api/sync/events'){
   const envelope=await body(req),event=envelope.event;
   if(!envelope.id||!envelope.deviceId||!event?.id||!event?.type||!event?.payload||typeof event.payload!=='object')return json(res,400,{error:'بيانات المزامنة غير مكتملة'});
   const db=read();db.events=db.events&&typeof db.events==='object'?db.events:{};db.order=Array.isArray(db.order)?db.order:[];const existing=db.events[event.id];
   if(existing)return json(res,200,{accepted:true,idempotent:true,serverEvent:existing});
   const conflicts=db.order.map(id=>db.events[id]).filter(x=>x&&x.event?.type===event.type&&x.event?.payload?.referenceId&&x.event.payload.referenceId===event.payload?.referenceId&&x.deviceId!==envelope.deviceId);
   if(conflicts.length)return json(res,409,{conflict:true,reason:'تم العثور على عملية مرتبطة بنفس المرجع من جهاز آخر',existing:conflicts[0]});
   const record={id:event.id,deviceId:envelope.deviceId,receivedAt:new Date().toISOString(),event};
   db.events[event.id]=record;db.order.push(event.id);write(db);
   return json(res,201,{accepted:true,idempotent:false,serverEvent:record});
  }
  if(req.method==='GET'&&(req.url==='/api/sync/events'||req.url.startsWith('/api/sync/events?'))){const db=read();const u=new URL(req.url,'http://localhost');const after=Math.max(Number(u.searchParams.get('after')||0),0);const events=db.order.slice(after).map(id=>db.events[id]);return json(res,200,{events,nextCursor:after+events.length,total:db.order.length})}
  return json(res,404,{error:'Not found'});
 }catch(e){return json(res,500,{error:e.message||'Server error'})}
});
server.listen(PORT,()=>console.log('AL Market sync server listening on '+PORT));
