import { useMemo, useState } from 'react';
import { Plus, Search, Package, Pencil } from 'lucide-react';
import { createId } from '../services/storage';

const emptyForm = { name:'', barcode:'', baseUnit:'حبة', secondaryUnit:'', conversionFactor:'1', cost:'', price:'', openingStock:'', minStock:'5' };

export default function Items({ state, setState }) {
  const [query,setQuery]=useState('');
  const [editing,setEditing]=useState(null);
  const [form,setForm]=useState(emptyForm);
  const filtered=useMemo(()=> (state.items||[]).filter(x => ((x.name||'')+' '+(x.barcode||'')).includes(query.trim())),[state.items,query]);

  const reset=()=>{setEditing(null);setForm(emptyForm)};
  const save=()=>{
    if(!form.name.trim()) return;
    const payload={
      name:form.name.trim(), barcode:form.barcode.trim(),
      baseUnit:form.baseUnit.trim()||'حبة', unit:form.baseUnit.trim()||'حبة',
      secondaryUnit:form.secondaryUnit.trim(), conversionFactor:Math.max(Number(form.conversionFactor)||1,1),
      cost:Math.max(Number(form.cost)||0,0), price:Math.max(Number(form.price)||0,0),
      minStock:Math.max(Number(form.minStock)||0,0)
    };
    if(editing){
      // تعديل بيانات الصنف لا يغيّر الرصيد الفعلي؛ الرصيد لا يتحرك إلا عبر
      // عملية مخزنية معتمدة أو الرصيد الافتتاحي عند إنشاء الصنف.
      setState({...state,items:state.items.map(item=>item.id===editing?{...item,...payload,updatedAt:new Date().toISOString()}:item)});
    }else{
      const openingStock=Math.max(Number(form.openingStock)||0,0);
      setState({...state,items:[...state.items,{...payload,id:createId('item'),openingStock,stock:openingStock,createdAt:new Date().toISOString()}]});
    }
    reset();
  };
  const edit=item=>{setEditing(item.id);setForm({
    name:item.name||'',barcode:item.barcode||'',baseUnit:item.baseUnit||item.unit||'حبة',
    secondaryUnit:item.secondaryUnit||'',conversionFactor:item.conversionFactor||1,cost:item.cost||'',
    price:item.price||'',openingStock:item.openingStock??item.stock??'',minStock:item.minStock??5
  })};

  return <section className="page-card">
    <div className="page-head"><div><h2>الأصناف</h2><p>تعريف الصنف ووحداته وأسعاره وحد التنبيه والرصيد الافتتاحي</p></div><Package size={28}/></div>
    <div className="toolbar"><div className="search-box"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="بحث بالاسم أو الباركود"/></div></div>
    <div className="form-grid compact">
      <input placeholder="اسم الصنف" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>
      <input placeholder="الباركود" value={form.barcode} onChange={e=>setForm({...form,barcode:e.target.value})}/>
      <input placeholder="الوحدة الأساسية" value={form.baseUnit} onChange={e=>setForm({...form,baseUnit:e.target.value})}/>
      <input placeholder="الوحدة الثانوية (اختياري)" value={form.secondaryUnit} onChange={e=>setForm({...form,secondaryUnit:e.target.value})}/>
      <input type="number" min="1" placeholder="معامل التحويل" value={form.conversionFactor} onChange={e=>setForm({...form,conversionFactor:e.target.value})}/>
      <input type="number" min="0" placeholder="التكلفة الأساسية" value={form.cost} onChange={e=>setForm({...form,cost:e.target.value})}/>
      <input type="number" min="0" placeholder="سعر البيع الأساسي" value={form.price} onChange={e=>setForm({...form,price:e.target.value})}/>
      <input type="number" min="0" placeholder="الرصيد الافتتاحي بالأساسية" value={form.openingStock} disabled={Boolean(editing)} onChange={e=>setForm({...form,openingStock:e.target.value})}/>
      <input type="number" min="0" placeholder="حد التنبيه" value={form.minStock} onChange={e=>setForm({...form,minStock:e.target.value})}/>
      <button className="primary-btn" onClick={save}><Plus size={18}/>{editing?'حفظ التعديل':'إضافة صنف'}</button>
      {editing&&<button className="secondary-btn" onClick={reset}>إلغاء</button>}
    </div>
    <div className="table-wrap"><table><thead><tr><th>الصنف</th><th>الباركود</th><th>الوحدة الأساسية</th><th>الثانوية</th><th>التحويل</th><th>التكلفة</th><th>البيع</th><th>الرصيد الافتتاحي</th><th>الحد</th><th>إجراء</th></tr></thead>
    <tbody>{filtered.map(x=><tr key={x.id}><td>{x.name}</td><td>{x.barcode||'—'}</td><td>{x.baseUnit||x.unit}</td><td>{x.secondaryUnit||'—'}</td><td>{x.secondaryUnit?'1 '+x.secondaryUnit+' = '+x.conversionFactor+' '+(x.baseUnit||x.unit):'—'}</td><td>{Number(x.cost||0).toLocaleString('ar-YE')}</td><td>{Number(x.price||0).toLocaleString('ar-YE')}</td><td>{Number(x.openingStock??x.stock??0).toLocaleString('ar-YE')}</td><td>{Number(x.minStock??5).toLocaleString('ar-YE')}</td><td><button className="icon-btn" title="تعديل" onClick={()=>edit(x)}><Pencil size={16}/></button></td></tr>)}
    {!filtered.length&&<tr><td colSpan="10" className="empty">لا توجد أصناف مسجلة</td></tr>}</tbody></table></div>
  </section>;
}
