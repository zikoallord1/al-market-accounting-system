import { useMemo, useState } from 'react';
import { Plus, Search, Package, Pencil, Trash2 } from 'lucide-react';
import { createId } from '../services/storage';

export default function Items({ state, setState }) {
  const [query, setQuery] = useState('');
  const [form, setForm] = useState({ name: '', barcode: '', unit: 'حبة', cost: '', price: '', stock: '' });
  const filtered = useMemo(() => state.items.filter(x => `${x.name} ${x.barcode}`.includes(query.trim())), [state.items, query]);

  const save = () => {
    if (!form.name.trim()) return;
    const item = { ...form, id: createId('item'), cost: Number(form.cost || 0), price: Number(form.price || 0), stock: Number(form.stock || 0), createdAt: new Date().toISOString() };
    setState({ ...state, items: [...state.items, item] });
    setForm({ name: '', barcode: '', unit: 'حبة', cost: '', price: '', stock: '' });
  };

  const remove = (id) => setState({ ...state, items: state.items.filter(x => x.id !== id) });

  return <section className="page-card">
    <div className="page-head"><div><h2>الأصناف</h2><p>إدارة الأصناف والوحدات والأسعار والمخزون الأولي</p></div><Package size={28}/></div>
    <div className="toolbar"><div className="search-box"><Search size={18}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="بحث بالاسم أو الباركود"/></div></div>
    <div className="form-grid compact">
      <input placeholder="اسم الصنف" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>
      <input placeholder="الباركود" value={form.barcode} onChange={e=>setForm({...form,barcode:e.target.value})}/>
      <input placeholder="الوحدة" value={form.unit} onChange={e=>setForm({...form,unit:e.target.value})}/>
      <input type="number" placeholder="التكلفة" value={form.cost} onChange={e=>setForm({...form,cost:e.target.value})}/>
      <input type="number" placeholder="سعر البيع" value={form.price} onChange={e=>setForm({...form,price:e.target.value})}/>
      <input type="number" placeholder="الرصيد الأولي" value={form.stock} onChange={e=>setForm({...form,stock:e.target.value})}/>
      <button className="primary-btn" onClick={save}><Plus size={18}/> إضافة صنف</button>
    </div>
    <div className="table-wrap"><table><thead><tr><th>الصنف</th><th>الباركود</th><th>الوحدة</th><th>التكلفة</th><th>البيع</th><th>الرصيد</th><th>إجراءات</th></tr></thead><tbody>
      {filtered.map(x=><tr key={x.id}><td>{x.name}</td><td>{x.barcode || '—'}</td><td>{x.unit}</td><td>{x.cost}</td><td>{x.price}</td><td>{x.stock}</td><td><button className="icon-btn" title="تعديل"><Pencil size={16}/></button><button className="icon-btn danger" title="حذف" onClick={()=>remove(x.id)}><Trash2 size={16}/></button></td></tr>)}
      {!filtered.length && <tr><td colSpan="7" className="empty">لا توجد أصناف مسجلة</td></tr>}
    </tbody></table></div>
  </section>;
}
