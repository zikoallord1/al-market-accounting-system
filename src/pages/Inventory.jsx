import { useMemo,useState } from 'react';
import { Search,Boxes,ArrowDownToLine,ArrowUpFromLine,AlertTriangle,History } from 'lucide-react';

export default function Inventory({state}){
 const [query,setQuery]=useState('');
 const rows=useMemo(()=>state.items.map(item=>{const movements=state.stockMovements.filter(m=>m.itemId===item.id);const balance=Number(item.stock||0)+movements.reduce((sum,m)=>sum+Number(m.quantity||0),0);const inbound=movements.filter(m=>Number(m.quantity)>0).reduce((s,m)=>s+Number(m.quantity),0);const outbound=Math.abs(movements.filter(m=>Number(m.quantity)<0).reduce((s,m)=>s+Number(m.quantity),0));return {...item,balance,inbound,outbound,movementCount:movements.length}}).filter(x=>`${x.name} ${x.barcode}`.includes(query.trim())),[state,query]);
 const inbound=rows.reduce((s,x)=>s+x.inbound,0),outbound=rows.reduce((s,x)=>s+x.outbound,0),value=rows.reduce((s,x)=>s+x.balance*Number(x.cost||0),0),low=rows.filter(x=>x.balance<=Number(x.minStock??5)).length;
 return <section className="page-card"><div className="page-head"><div><h2>المخزون</h2><p>الرصيد والحركة والتنبيهات مرتبطة بالعمليات المسجلة</p></div><Boxes size={28}/></div>
 <div className="summary-row"><div><ArrowDownToLine/><span>الوارد</span><b>{inbound.toLocaleString('ar-YE')}</b></div><div><ArrowUpFromLine/><span>الصادر</span><b>{outbound.toLocaleString('ar-YE')}</b></div><div><Boxes/><span>قيمة المخزون</span><b>{value.toLocaleString('ar-YE')} ر.ي</b></div><div><AlertTriangle/><span>أصناف منخفضة</span><b>{low}</b></div></div>
 <div className="toolbar"><div className="search-box"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="بحث في المخزون"/></div></div>
 <div className="table-wrap"><table><thead><tr><th>الصنف</th><th>الباركود</th><th>الوحدة</th><th>الرصيد</th><th>الوارد</th><th>الصادر</th><th>التكلفة</th><th>قيمة المخزون</th><th>الحركة</th></tr></thead><tbody>{rows.map(x=><tr key={x.id}><td>{x.name}</td><td>{x.barcode||'—'}</td><td>{x.unit}</td><td>{x.balance.toLocaleString('ar-YE')}</td><td>{x.inbound.toLocaleString('ar-YE')}</td><td>{x.outbound.toLocaleString('ar-YE')}</td><td>{Number(x.cost||0).toLocaleString('ar-YE')}</td><td>{(x.balance*Number(x.cost||0)).toLocaleString('ar-YE')} ر.ي</td><td><History size={16}/> {x.movementCount}</td></tr>)}{!rows.length&&<tr><td colSpan="9" className="empty">لا توجد بيانات مخزون</td></tr>}</tbody></table></div>
 </section>
}
