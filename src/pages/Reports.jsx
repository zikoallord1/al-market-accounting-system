import { useMemo, useState } from 'react';
import { BarChart3, FileText, Printer, Download, RefreshCw } from 'lucide-react';

const money=v=>Number(v||0).toLocaleString('ar-YE')+' ر.ي';
const dayStart=d=>{const x=new Date(d);x.setHours(0,0,0,0);return x};
export default function Reports({state}){
  const [from,setFrom]=useState(''),[to,setTo]=useState(''),[query,setQuery]=useState('');
  const inRange=(d)=>{const x=new Date(d);if(from&&x<dayStart(from))return false;if(to){const end=dayStart(to);end.setHours(23,59,59,999);if(x>end)return false}return true};
  const sales=useMemo(()=>state.sales.filter(x=>inRange(x.createdAt)),[state.sales,from,to]);
  const purchases=useMemo(()=>state.purchases.filter(x=>inRange(x.createdAt)),[state.purchases,from,to]);
  const totals={sales:sales.reduce((s,x)=>s+Number(x.total||0),0),purchases:purchases.reduce((s,x)=>s+Number(x.total||0),0),collected:sales.reduce((s,x)=>s+Number(x.paid||0),0),receivables:sales.reduce((s,x)=>s+Number(x.payments?.credit||0),0),inventory:state.items.reduce((s,x)=>s+Number(x.stock||0)*Number(x.cost||0),0)};
  const reports=['تقرير المبيعات','تقرير المشتريات','كشف حساب العملاء','كشف حساب الموردين','حركة المخزون','الحركة المالية','تقرير الأرباح والتكاليف','سجل العمليات والتدقيق'].filter(x=>x.includes(query.trim()));
  const exportCSV=(name,rows)=>{const csv=rows.map(r=>r.map(v=>`"${String(v??'').replaceAll('"','""')}"`).join(',')).join('\n');const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name+'.csv';a.click();URL.revokeObjectURL(a.href)};
  const exportReport=()=>exportCSV('تقرير_المبيعات',[['التاريخ','الإجمالي','المدفوع','الآجل'],...sales.map(x=>[new Date(x.createdAt).toLocaleString('ar-YE'),x.total,x.paid,x.payments?.credit||0])]);
  return <section className="page-card"><div className="page-head"><div><h2>التقارير</h2><p>مركز التقارير الموحد للعمليات والأرصدة</p></div><BarChart3 size={28}/></div>
    <div className="report-toolbar"><label>من<input type="date" value={from} onChange={e=>setFrom(e.target.value)}/></label><label>إلى<input type="date" value={to} onChange={e=>setTo(e.target.value)}/></label><div className="search-box"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="بحث داخل التقارير..."/></div><button className="secondary-btn" onClick={()=>{setFrom('');setTo('');setQuery('')}}><RefreshCw size={16}/>إعادة</button></div>
    <div className="report-cards">{[['إجمالي المبيعات',totals.sales],['المشتريات',totals.purchases],['المحصّل',totals.collected],['الذمم الآجلة',totals.receivables],['قيمة المخزون',totals.inventory],['صافي الحركة',totals.sales-totals.purchases]].map(([name,value])=><div key={name}><span>{name}</span><b>{money(value)}</b></div>)}</div>
    <div className="report-list">{reports.map(name=><div className="report-row" key={name}><FileText size={19}/><span>{name}</span><div><button className="icon-btn" title="طباعة" onClick={()=>window.print()}><Printer size={16}/></button><button className="icon-btn" title="تصدير المبيعات CSV" onClick={exportReport}><Download size={16}/></button></div></div>)}</div>
  </section>
}
