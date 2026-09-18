import { exportState } from './storage';

const BACKUP_FORMAT = 'AL-MARKET-ACCOUNTING-BACKUP';
const BACKUP_VERSION = 1;
const STATE_SCHEMA_VERSION = 6;

const requiredArrays = [
  'items','customers','suppliers','sales','purchases','payments',
  'expenses','revenues','employees','stockMovements','stockBatches',
  'supplierTransactions','customerTransactions','auditLog',
  'journalEntries','notifications','financeTransactions','users'
];

function assertStateShape(data){
  if(!data || typeof data!=='object' || Array.isArray(data)){
    throw new Error('ملف النسخة الاحتياطية غير صالح');
  }
  if(Number(data.schemaVersion)!==STATE_SCHEMA_VERSION){
    throw new Error('إصدار بيانات النسخة الاحتياطية غير مدعوم');
  }
  for(const key of requiredArrays){
    if(!Array.isArray(data[key])) throw new Error('بنية النسخة الاحتياطية غير مكتملة: '+key);
  }
  if(!data.settings || typeof data.settings!=='object' || Array.isArray(data.settings)){
    throw new Error('إعدادات النسخة الاحتياطية غير مكتملة');
  }
  if(data.settings.inventoryCostMethod && data.settings.inventoryCostMethod!=='FIFO'){
    throw new Error('طريقة تقييم المخزون في النسخة غير مدعومة');
  }
  return data;
}

async function sha256(text){
  if(!globalThis.crypto?.subtle) throw new Error('لا يمكن التحقق من سلامة النسخة على هذا الجهاز');
  const bytes=new TextEncoder().encode(text);
  const digest=await crypto.subtle.digest('SHA-256',bytes);
  return Array.from(new Uint8Array(digest)).map(x=>x.toString(16).padStart(2,'0')).join('');
}

export function downloadBackup(state){
  const data=assertStateShape({...state,schemaVersion:STATE_SCHEMA_VERSION});
  const payload=JSON.stringify(data);
  sha256(payload).then(checksum=>{
    const backup={
      format:BACKUP_FORMAT,
      version:BACKUP_VERSION,
      createdAt:new Date().toISOString(),
      schemaVersion:STATE_SCHEMA_VERSION,
      checksum,
      data
    };
    const blob=new Blob([JSON.stringify(backup,null,2)],{type:'application/json;charset=utf-8'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url;
    a.download='نظام_الماركت_المحاسبي_نسخة_احتياطية.json';
    a.click();
    URL.revokeObjectURL(url);
  }).catch(error=>alert(error.message));
}

export async function parseBackup(text){
  let parsed;
  try{parsed=JSON.parse(text)}catch{throw new Error('ملف النسخة الاحتياطية ليس JSON صالحًا')}

  if(parsed?.format===BACKUP_FORMAT){
    if(Number(parsed.version)!==BACKUP_VERSION || Number(parsed.schemaVersion)!==STATE_SCHEMA_VERSION){
      throw new Error('إصدار النسخة الاحتياطية غير مدعوم');
    }
    if(typeof parsed.checksum!=='string' || !parsed.data || typeof parsed.data!=='object'){
      throw new Error('بيانات سلامة النسخة الاحتياطية ناقصة');
    }
    const data=assertStateShape(parsed.data);
    const actual=await sha256(JSON.stringify(data));
    if(actual!==parsed.checksum) throw new Error('فشل التحقق من سلامة النسخة الاحتياطية');
    return data;
  }

  return assertStateShape(parsed);
}
