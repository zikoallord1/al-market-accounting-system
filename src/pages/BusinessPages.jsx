import { useMemo, useState } from 'react';
import { Plus, Search, Users, Truck, Wallet, UserRound, Camera, Settings, ShoppingCart, Trash2, ReceiptText } from 'lucide-react';
import { createId } from '../services/storage';
import { applyCustomerPaymentEvent, applyPurchaseEvent, applySupplierPaymentEvent, getCustomerBalance, getSupplierBalance } from '../services/eventEngine';

const money = value => Number(value || 0).toLocaleString('ar-YE') + ' ر.ي';

function PaymentBox({ label, options, value, onChange, onSave, error }) {
  return <div className="panel payment-box"><h3>{label}</h3>{error && <div className="error-note">{error}</div>}
    <div className="form-grid compact">
      <select value={value.partyId} onChange={e=>onChange({...value,partyId:e.target.value})}><option value="">اختر الحساب</option>{options.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select>
      <select value={value.paymentMethod} onChange={e=>onChange({...value,paymentMethod:e.target.value})}><option value="cash">نقد</option><option value="wallet">محفظة إلكترونية</option><option value="transfer">تحويل</option></select>
      <input type="number" min="0" step="any" placeholder="المبلغ" value={value.amount} onChange={e=>onChange({...value,amount:e.target.value})}/>
      <button className="primary-btn" onClick={onSave}><ReceiptText size={18}/> حفظ الحركة</button>
    </div></div>;
}

function TablePage({title,description,icon:Icon,rows,columns,formFields,onAdd,addLabel}) {
  const empty=Object.fromEntries(formFields.map(f=>[f.key,''])); const [form,setForm]=useState(empty); const [query,setQuery]=useState('');
  const filtered=rows.filter(row=>Object.values(row).join(' ').toLowerCase().includes(query.toLowerCase()));
  const save=()=>{if(!formFields.every(f=>!f.required||String(form[f.key]).trim()))return;onAdd({...form,id:createId('row'),createdAt:new Date().toISOString()});setForm(empty)};
  return <section className="page-card"><div className="page-head"><div><h2>{title}</h2><p>{description}</p></div><Icon size={28}/></div>
    <div className="toolbar"><div className="search-box"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="بحث..."/></div></div>
    <div className="form-grid compact">{formFields.map(f=><input key={f.key} type={f.type||'text'} placeholder={f.label} value={form[f.key]} onChange={e=>setForm({...form,[f.key]:e.target.value})}/>)}<button className="primary-btn" onClick={save}><Plus size={18}/>{addLabel}</button></div>
    <div className="table-wrap"><table><thead><tr>{columns.map(c=><th key={c.key}>{c.label}</th>)}</tr></thead><tbody>{filtered.map(row=><tr key={row.id}>{columns.map(c=><td key={c.key}>{row[c.key] ?? '—'}</td>)}</tr>)}{!filtered.length&&<tr><td colSpan={columns.length} className="empty">لا توجد بيانات</td></tr>}</tbody></table></div></section>;
}

export function Customers({state,setState}) {
  const rows=useMemo(()=>state.customers.map(c=>({...c,currentBalance:getCustomerBalance(state,c.id)})),[state]);
  const [payment,setPayment]=useState({partyId:'',amount:'',paymentMethod:'cash'}),[error,setError]=useState('');
  const savePayment=()=>{try{const amount=Number(payment.amount);if(!payment.partyId||amount<=0)throw new Error('اختر العميل وأدخل مبلغاً صحيحاً');const balance=getCustomerBalance(state,payment.partyId);if(amount>balance+0.000001)throw new Error('مبلغ التحصيل أكبر من رصيد العميل');
    const row={id:createId('cpay'),customerId:payment.partyId,amount,paymentMethod:payment.paymentMethod,createdAt:new Date().toISOString(),currency:state.settings.currency};
    setState(applyCustomerPaymentEvent(state,row));setPayment({partyId:'',amount:'',paymentMethod:'cash'});setError('');}catch(e){setError(e.message)}};
  return <><TablePage title="العملاء" description="الحسابات والبيع الآجل والمدفوعات وكشوف الحساب" icon={Users} rows={rows}
    formFields={[{key:'name',label:'اسم العميل',required:true},{key:'phone',label:'رقم الهاتف'},{key:'openingBalance',label:'الرصيد الافتتاحي',type:'number'}]}
    columns={[{key:'name',label:'العميل'},{key:'phone',label:'الهاتف'},{key:'openingBalance',label:'الرصيد الافتتاحي'},{key:'currentBalance',label:'الرصيد الحالي'}]} addLabel="إضافة عميل" onAdd={x=>setState({...state,customers:[...state.customers,{...x,openingBalance:Number(x.openingBalance||0)}]})}/>
    <PaymentBox label="تحصيل من عميل" options={state.customers} value={payment} onChange={setPayment} onSave={savePayment} error={error}/></>;
}

export function Suppliers({state,setState}) {
  const rows=useMemo(()=>state.suppliers.map(s=>({...s,currentBalance:getSupplierBalance(state,s.id)})),[state]);
  const [payment,setPayment]=useState({partyId:'',amount:'',paymentMethod:'cash'}),[error,setError]=useState('');
  const savePayment=()=>{try{const amount=Number(payment.amount);if(!payment.partyId||amount<=0)throw new Error('اختر المورد وأدخل مبلغاً صحيحاً');const balance=getSupplierBalance(state,payment.partyId);if(amount>balance+0.000001)throw new Error('مبلغ السداد أكبر من رصيد المورد');
    const row={id:createId('spay'),supplierId:payment.partyId,amount,paymentMethod:payment.paymentMethod,createdAt:new Date().toISOString(),currency:state.settings.currency};
    setState(applySupplierPaymentEvent(state,row));setPayment({partyId:'',amount:'',paymentMethod:'cash'});setError('');}catch(e){setError(e.message)}};
  return <><TablePage title="الموردون" description="المشتريات والديون والمدفوعات وكشوف الحساب" icon={Truck} rows={rows}
    formFields={[{key:'name',label:'اسم المورد',required:true},{key:'phone',label:'رقم الهاتف'},{key:'openingBalance',label:'الرصيد الافتتاحي',type:'number'}]}
    columns={[{key:'name',label:'المورد'},{key:'phone',label:'الهاتف'},{key:'openingBalance',label:'الرصيد الافتتاحي'},{key:'currentBalance',label:'الرصيد الحالي'}]} addLabel="إضافة مورد" onAdd={x=>setState({...state,suppliers:[...state.suppliers,{...x,openingBalance:Number(x.openingBalance||0)}]})}/>
    <PaymentBox label="سداد لمورد" options={state.suppliers} value={payment} onChange={setPayment} onSave={savePayment} error={error}/></>;
}

export function Employees({state,setState}) { return <TablePage title="الموظفون" description="ملفات الموظفين والرواتب والسلف والاستحقاقات" icon={UserRound} rows={state.employees}
  formFields={[{key:'name',label:'اسم الموظف',required:true},{key:'job',label:'الوظيفة'},{key:'salary',label:'الراتب',type:'number'}]} columns={[{key:'name',label:'الموظف'},{key:'job',label:'الوظيفة'},{key:'salary',label:'الراتب'}]} addLabel="إضافة موظف" onAdd={x=>setState({...state,employees:[...state.employees,x]})}/>; }

function paymentTotal(p){return Object.values(p).reduce((s,v)=>s+Number(v||0),0)}

export function Purchases({state,setState}) {
  const [supplierId,setSupplierId]=useState(''),[itemId,setItemId]=useState(''),[quantity,setQuantity]=useState('1'),[unit,setUnit]=useState('base'),[cost,setCost]=useState(''),[payments,setPayments]=useState({cash:'',wallet:'',credit:'',transfer:''}),[cart,setCart]=useState([]),[error,setError]=useState('');
  const selected=state.items.find(x=>x.id===itemId);const conversionFactor=unit==='secondary'?Number(selected?.conversionFactor||1):1;const cartTotal=cart.reduce((s,x)=>s+x.quantity*x.cost,0);const paid=paymentTotal(payments);
  const addLine=()=>{if(!selected||Number(quantity)<=0||Number(cost)<0){setError('أكمل الصنف والوحدة والكمية والتكلفة');return}setCart([...cart,{id:createId('pline'),itemId:selected.id,name:selected.name,quantity:Number(quantity),unit:unit==='secondary'?selected.secondaryUnit:selected.baseUnit,conversionFactor,cost:Number(cost)}]);setItemId('');setQuantity('1');setCost('');setUnit('base');setError('')};
  const save=()=>{try{if(!supplierId||!cart.length)throw new Error('اختر المورد وأضف صنفاً واحداً على الأقل');if(cartTotal<=0||Math.abs(paid-cartTotal)>0.000001)throw new Error('يجب توزيع كامل إجمالي الفاتورة على طرق الدفع');const normalized=Object.fromEntries(Object.entries(payments).map(([k,v])=>[k,Number(v||0)]));const purchase={id:createId('purchase'),createdAt:new Date().toISOString(),currency:state.settings.currency,supplierId,lines:cart,total:cartTotal,paid,remaining:0,payments:normalized};setState(applyPurchaseEvent(state,purchase));setSupplierId('');setCart([]);setPayments({cash:'',wallet:'',credit:'',transfer:''});setError('')}catch(e){setError(e.message)}};
  return <section className="page-card"><div className="page-head"><div><h2>المشتريات</h2><p>المورد والصنف والوحدة والدُفعة والدفع والمخزون في عملية واحدة</p></div><ShoppingCart size={28}/></div>{error&&<div className="error-note">{error}</div}>
    <div className="form-grid compact"><select value={supplierId} onChange={e=>setSupplierId(e.target.value)}><option value="">اختر المورد</option>{state.suppliers.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select><select value={itemId} onChange={e=>{setItemId(e.target.value);const x=state.items.find(i=>i.id===e.target.value);setCost(x?.cost||'')}}><option value="">اختر الصنف</option>{state.items.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select>
    <select value={unit} onChange={e=>setUnit(e.target.value)} disabled={!selected?.secondaryUnit}><option value="base">{selected?.baseUnit||'الوحدة الأساسية'}</option><option value="secondary">{selected?.secondaryUnit||'الوحدة الثانوية'}</option></select><input type="number" min="0.000001" step="any" placeholder="الكمية" value={quantity} onChange={e=>setQuantity(e.target.value)}/><input type="number" min="0" step="any" placeholder="تكلفة الوحدة" value={cost} onChange={e=>setCost(e.target.value)}/><button className="secondary-btn" onClick={addLine}><Plus size={18}/>إضافة للفاتورة</button></div>
    <div className="table-wrap"><table><thead><tr><th>الصنف</th><th>الوحدة</th><th>الكمية</th><th>التكلفة</th><th>الإجمالي</th><th></th></tr></thead><tbody>{!cart.length?<tr><td colSpan="6" className="empty">لم تتم إضافة أصناف بعد</td></tr>:cart.map(x=><tr key={x.id}><td>{x.name}</td><td>{x.unit}</td><td>{x.quantity}</td><td>{money(x.cost)}</td><td>{money(x.quantity*x.cost)}</td><td><button className="icon-btn" onClick={()=>setCart(cart.filter(y=>y.id!==x.id))}><Trash2 size={16}/></button></td></tr>)}</tbody></table></div>
    <div className="summary-row"><div><span>إجمالي الفاتورة</span><b>{money(cartTotal)}</b></div><div><span>المدفوع</span><b>{money(paid)}</b></div><div><span>المتبقي</span><b>{money(Math.max(cartTotal-paid,0))}</b></div></div>
    <div className="methods purchase-methods"><span>طرق الدفع — يمكن الجمع بينها</span>{[['cash','نقد'],['wallet','محفظة إلكترونية'],['credit','آجل'],['transfer','تحويل']].map(([k,l])=><label className="pay-field" key={k}>{l}<input type="number" min="0" step="any" value={payments[k]} onChange={e=>setPayments({...payments,[k]:e.target.value})}/></label>)}</div><button className="primary-btn" onClick={save}>حفظ فاتورة الشراء</button>
    <div className="table-wrap"><table><thead><tr><th>التاريخ</th><th>المورد</th><th>الإجمالي</th><th>المدفوع</th><th>الآجل</th></tr></thead><tbody>{state.purchases.map(x=><tr key={x.id}><td>{new Date(x.createdAt).toLocaleString('ar-YE')}</td><td>{state.suppliers.find(s=>s.id===x.supplierId)?.name||'—'}</td><td>{money(x.total)}</td><td>{money(x.paid)}</td><td>{money(x.payments?.credit)}</td></tr>)}</tbody></table></div></section>;
}

export function Finance({state}) { const sales=state.sales.reduce((s,x)=>s+Number(x.total||0),0),purchases=state.purchases.reduce((s,x)=>s+Number(x.total||0),0);return <section className="page-card"><div className="page-head"><div><h2>المالية</h2><p>الصناديق والمحافظ والتحويلات والمصروفات والإيرادات</p></div><Wallet size={28}/></div><div className="summary-row"><div><span>المبيعات</span><b>{money(sales)}</b></div><div><span>المشتريات</span><b>{money(purchases)}</b></div></div></section> }
export function Cameras(){return <section className="page-card"><div className="page-head"><div><h2>الكاميرات والمراقبة</h2><p>المراقبة والتسجيل والأرشيف ضمن خيار مستقل داخل النظام</p></div><Camera size={28}/></div><div className="camera-grid">{['الكاميرا 1','الكاميرا 2','الكاميرا 3','الكاميرا 4'].map((x,i)=><div className="camera-card" key={x}><div className="camera-placeholder">{x}<small>{i===0?'متصلة':'غير متصلة'}</small></div><div><button className="secondary-btn">عرض مباشر</button><button className="secondary-btn">الأرشيف</button></div></div>)}</div></section>}
export function SettingsPage({state,setState}){const[name,setName]=useState(state.settings.marketName);const save=()=>setState({...state,settings:{...state.settings,marketName:name||'نظام الماركت المحاسبي'}});return <section className="page-card"><div className="page-head"><div><h2>الإعدادات</h2><p>إعدادات النظام الأساسية والهوية والعملة</p></div><Settings size={28}/></div><div className="settings-grid"><label>اسم النظام<input value={name} onChange={e=>setName(e.target.value)}/></label><label>العملة الأساسية<input value={state.settings.currency} readOnly/></label><div className="setting-note">الاسم المعتمد: نظام الماركت المحاسبي</div><button className="primary-btn" onClick={save}>حفظ الإعدادات</button></div></section>}