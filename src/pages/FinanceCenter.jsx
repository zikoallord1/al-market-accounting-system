import { useState } from 'react';
import { Plus, Wallet, Download } from 'lucide-react';
import { createId } from '../services/storage';
import { downloadBackup } from '../services/backup';

export default function FinanceCenter({state,setState}){
 const [type,setType]=useState('expense');
 const [description,setDescription]=useState('');
 const [amount,setAmount]=useState('');
 const expenses=state.expenses||[], revenues=state.revenues||[];
 const sales=state.sales.reduce((s,x)=>s+Number(x.total||0),0);
 const purchases=state.purchases.reduce((s,x)=>s+Number(x.total||0),0);
 const expenseTotal=expenses.reduce((s,x)=>s+Number(x.amount||0),0);
 const revenueTotal=revenues.reduce((s,x)=>s+Number(x.amount||0),0);
 const addTransaction=()=>{if(!description.trim()||Number(amount)<=0)return;const key=type==='expense'?'expenses':'revenues';const row={id:createId(type),description:description.trim(),amount:Number(amount),createdAt:new Date().toISOString()};setState({...state,[key]:[...(state[key]||[]),row],financeTransactions:[...(state.financeTransactions||[]),{...row,type}]});setDescription('');setAmount('')};
 return <section className='page-card'><div className='page-head'><div><h2>المالية</h2><p>مركز موحد للحركة المالية مع إبقاء القيود المحاسبية وفق القواعد المعتمدة</p></div><Wallet size={28}/></div>
 <div className='summary-row'>{[['المبيعات',sales],['المشتريات',purchases],['المصروفات',expenseTotal],['الإيرادات الأخرى',revenueTotal],['صافي الحركة',sales-purchases-expenseTotal+revenueTotal]].map(([n,v])=><div key={n}><span>{n}</span><b>{v.toLocaleString('ar-YE')} ر.ي</b></div>)}</div>
 <div className='form-grid compact'><select value={type} onChange={e=>setType(e.target.value)}><option value='expense'>مصروف</option><option value='revenue'>إيراد آخر</option></select><input placeholder='وصف العملية' value={description} onChange={e=>setDescription(e.target.value)}/><input type='number' min='0' placeholder='المبلغ' value={amount} onChange={e=>setAmount(e.target.value)}/><button className='primary-btn' onClick={addTransaction}><Plus size={18}/>حفظ العملية</button></div>
 <div className='module-grid'>{['الصناديق الأربعة','المحافظ الإلكترونية','التحويلات','حركة الحسابات'].map(x=><div className='module-tile' key={x}><Wallet size={20}/><strong>{x}</strong><span>مركز إدارة موحد</span></div>)}<button className='module-tile' onClick={()=>downloadBackup(state)}><Download size={20}/><strong>نسخة احتياطية</strong><span>تصدير كامل البيانات</span></button></div>
 <div className='table-wrap'><table><thead><tr><th>النوع</th><th>الوصف</th><th>المبلغ</th><th>التاريخ</th></tr></thead><tbody>{[...expenses.map(x=>({...x,type:'مصروف'})),...revenues.map(x=>({...x,type:'إيراد آخر'}))].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).map(x=><tr key={x.id}><td>{x.type}</td><td>{x.description}</td><td>{Number(x.amount).toLocaleString('ar-YE')} ر.ي</td><td>{new Date(x.createdAt).toLocaleString('ar-YE')}</td></tr>)}</tbody></table></div>
 </section>;
}