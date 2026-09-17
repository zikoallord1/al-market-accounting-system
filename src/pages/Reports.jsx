import { BarChart3, FileText, Printer, Download } from 'lucide-react';

export default function Reports({ state }) {
  const sales = state.sales.reduce((s,x)=>s+Number(x.total||0),0);
  const purchases = state.purchases.reduce((s,x)=>s+Number(x.total||0),0);
  const receivables = state.sales.filter(x=>x.paymentMethod==='credit').reduce((s,x)=>s+Number(x.remaining||0),0);
  const inventoryValue = state.items.reduce((s,x)=>s+Number(x.stock||0)*Number(x.cost||0),0);
  return <section className="page-card">
    <div className="page-head"><div><h2>التقارير</h2><p>مركز التقارير الموحد للعمليات والأرصدة</p></div><BarChart3 size={28}/></div>
    <div className="report-cards"><div><span>إجمالي المبيعات</span><b>{sales.toFixed(2)}</b></div><div><span>إجمالي المشتريات</span><b>{purchases.toFixed(2)}</b></div><div><span>الذمم المدينة</span><b>{receivables.toFixed(2)}</b></div><div><span>قيمة المخزون</span><b>{inventoryValue.toFixed(2)}</b></div></div>
    <div className="report-list">
      {['تقرير المبيعات','تقرير المشتريات','كشف حساب العملاء','كشف حساب الموردين','حركة المخزون','الحركة المالية','تقرير الأرباح والتكاليف','سجل العمليات والتدقيق'].map(name=><div className="report-row" key={name}><FileText size={19}/><span>{name}</span><div><button className="icon-btn"><Printer size={16}/></button><button className="icon-btn"><Download size={16}/></button></div></div>)}
    </div>
  </section>;
}
