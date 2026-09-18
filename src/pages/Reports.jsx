import { BarChart3, FileText, Printer, Download } from 'lucide-react';

export default function Reports({ state }) {
  const sales = state.sales.reduce((s,x)=>s+Number(x.total||0),0);
  const purchases = state.purchases.reduce((s,x)=>s+Number(x.total||0),0);
  const receivables = state.sales.reduce((s,x)=>s+Number(x.payments?.credit||0),0);
  const collected = state.sales.reduce((s,x)=>s+Number(x.paid||0),0);
  const inventoryValue = state.items.reduce((s,x)=>s+Number(x.stock||0)*Number(x.cost||0),0);
  const cards=[['إجمالي المبيعات',sales],['المشتريات',purchases],['المحصّل',collected],['الذمم الآجلة',receivables],['قيمة المخزون',inventoryValue],['صافي الحركة',sales-purchases]];
  return <section className="page-card">
    <div className="page-head"><div><h2>التقارير</h2><p>مركز التقارير الموحد للعمليات والأرصدة</p></div><BarChart3 size={28}/></div>
    <div className="report-cards">{cards.map(([name,value])=><div key={name}><span>{name}</span><b>{Number(value).toLocaleString('ar-YE')} ر.ي</b></div>)}</div>
    <div className="report-list">{['تقرير المبيعات','تقرير المشتريات','كشف حساب العملاء','كشف حساب الموردين','حركة المخزون','الحركة المالية','تقرير الأرباح والتكاليف','سجل العمليات والتدقيق'].map(name=><div className="report-row" key={name}><FileText size={19}/><span>{name}</span><div><button className="icon-btn" title="طباعة"><Printer size={16}/></button><button className="icon-btn" title="تصدير"><Download size={16}/></button></div></div>)}</div>
  </section>;
}
