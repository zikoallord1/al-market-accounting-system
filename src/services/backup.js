import { exportState } from './storage';

export function downloadBackup(state){
  const blob=new Blob([exportState(state)],{type:'application/json;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;
  a.download='نظام_الماركت_المحاسبي_نسخة_احتياطية.json';
  a.click();
  URL.revokeObjectURL(url);
}

export function parseBackup(text){
  const data=JSON.parse(text);
  if(!data || typeof data!=='object' || !Array.isArray(data.items) || !Array.isArray(data.sales)){
    throw new Error('ملف النسخة الاحتياطية غير صالح');
  }
  return data;
}
