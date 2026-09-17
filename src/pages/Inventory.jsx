import { useMemo, useState } from 'react';
import { Search, Boxes, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';

export default function Inventory({ state }) {
  const [query, setQuery] = useState('');
  const rows = useMemo(() => state.items.map(item => {
    const movement = state.stockMovements.filter(m => m.itemId === item.id).reduce((sum,m)=>sum+Number(m.quantity||0),0);
    return { ...item, balance: Number(item.stock||0)+movement };
  }).filter(x => `${x.name} ${x.barcode}`.includes(query.trim())), [state, query]);
  const inbound = state.stockMovements.filter(x=>x.quantity>0).reduce((s,x)=>s+x.quantity,0);
  const outbound = Math.abs(state.stockMovements.filter(x=>x.quantity<0).reduce((s,x)=>s+x.quantity,0));

  return <section className="page-card">
    <div className="page-head"><div><h2>المخزون</h2><p>الأرصدة وحركة الأصناف من العمليات المسجلة</p></div><Boxes size={28}/></div>
    <div className="summary-row"><div><ArrowDownToLine/><span>الوارد</span><b>{inbound}</b></div><div><ArrowUpFromLine/><span>الصادر</span><b>{outbound}</b></div><div><Boxes/><span>الأصناف</span><b>{state.items.length}</b></div></div>
    <div className="toolbar"><div className="search-box"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="بحث في المخزون"/></div></div>
    <div className="table-wrap"><table><thead><tr><th>الصنف</th><th>الباركود</th><th>الوحدة</th><th>الرصيد</th><th>التكلفة</th><th>قيمة المخزون</th></tr></thead><tbody>
      {rows.map(x=><tr key={x.id}><td>{x.name}</td><td>{x.barcode||'—'}</td><td>{x.unit}</td><td>{x.balance}</td><td>{x.cost}</td><td>{(x.balance*x.cost).toFixed(2)}</td></tr>)}
      {!rows.length&&<tr><td colSpan="6" className="empty">لا توجد بيانات مخزون</td></tr>}
    </tbody></table></div>
  </section>;
}
