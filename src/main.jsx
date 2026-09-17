import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ShoppingCart, Package, Boxes, Users, Truck, Wallet, UserRound, BarChart3, Camera, Settings, Search, Bell, Clock3 } from 'lucide-react';
import './styles.css';
import { loadState, saveState, createId } from './services/storage';
import { applySalesEvent } from './services/eventEngine';
import Items from './pages/Items';
import Inventory from './pages/Inventory';
import Reports from './pages/Reports';
import { Customers, Suppliers, Employees, Finance, Purchases, Cameras, SettingsPage } from './pages/BusinessPages';

const modules = [
  ['المبيعات', ShoppingCart], ['المشتريات', Truck], ['الأصناف', Package], ['المخزون', Boxes],
  ['العملاء', Users], ['الموردون', Truck], ['المالية', Wallet], ['الموظفون', UserRound],
  ['التقارير', BarChart3], ['الكاميرات والمراقبة', Camera], ['الإعدادات', Settings]
];

function App() {
  const [active, setActive] = useState('المبيعات');
  const [state, setState] = useState(loadState);
  useEffect(() => saveState(state), [state]);

  return <div className="app">
    <header className="topbar"><div className="brand"><div className="logo">م</div><div><strong>نظام الماركت المحاسبي</strong><small>نظام موحد للمبيعات والمالية والمخزون</small></div></div><div className="top-actions"><span><Clock3 size={16}/> {new Date().toLocaleDateString('ar-YE')}</span><button title="التنبيهات"><Bell size={19}/></button></div></header>
    <div className="ticker"><b>التنبيهات:</b><span>نظام الماركت المحاسبي يعمل بنمط موحد لإدارة العمليات</span><span>كل عملية تحفظ مرة واحدة وتنعكس على المخزون والأرصدة والتقارير</span></div>
    <main className="layout"><section className="workspace">{renderPage(active,state,setState)}</section><nav className="sidebar">{modules.map(([name,Icon])=><button key={name} className={active===name?'nav active':'nav'} onClick={()=>setActive(name)}><Icon size={19}/><span>{name}</span></button>)}</nav></main>
    <footer>تنفيذ وتصميم المهندس زكريا الحاج &nbsp; | &nbsp; لطلب البرنامج أو برامج أخرى التواصل بالرقم 772233564</footer>
  </div>;
}

function renderPage(active,state,setState) {
  switch(active) {
    case 'المبيعات': return <Sales state={state} setState={setState}/>;
    case 'المشتريات': return <Purchases state={state} setState={setState}/>;
    case 'الأصناف': return <Items state={state} setState={setState}/>;
    case 'المخزون': return <Inventory state={state}/>;
    case 'العملاء': return <Customers state={state} setState={setState}/>;
    case 'الموردون': return <Suppliers state={state} setState={setState}/>;
    case 'المالية': return <Finance state={state}/>;
    case 'الموظفون': return <Employees state={state} setState={setState}/>;
    case 'التقارير': return <Reports state={state}/>;
    case 'الكاميرات والمراقبة': return <Cameras/>;
    case 'الإعدادات': return <SettingsPage state={state} setState={setState}/>;
    default: return null;
  }
}

function Sales({state,setState}) {
  const [query,setQuery]=useState(''); const [cart,setCart]=useState([]); const [paid,setPaid]=useState(''); const [method,setMethod]=useState('cash');
  const matches=state.items.filter(x=>`${x.name} ${x.barcode}`.includes(query.trim())).slice(0,8);
  const add=(item)=>{const found=cart.find(x=>x.itemId===item.id);setCart(found?cart.map(x=>x.itemId===item.id?{...x,quantity:x.quantity+1}:x):[...cart,{itemId:item.id,name:item.name,quantity:1,price:Number(item.price||0)}]);setQuery('')};
  const total=cart.reduce((s,x)=>s+x.quantity*x.price,0); const remaining=Math.max(total-Number(paid||0),0);
  const save=()=>{if(!cart.length||!total)return;const sale={id:createId('sale'),createdAt:new Date().toISOString(),lines:cart,total,paid:Number(paid||0),remaining,paymentMethod:method};setState(applySalesEvent(state,sale));setCart([]);setPaid('')};
  return <div className="sales"><div className="page-title"><div><h1>المبيعات</h1><p>إنشاء الفاتورة وإتمام العملية من شاشة واحدة</p></div><div className="status">متصل</div></div><div className="sales-grid"><div className="cart-panel panel"><div className="search"><Search size={19}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="ابحث عن صنف بالاسم أو الباركود..."/><button onClick={()=>matches[0]&&add(matches[0])}>إضافة</button></div>{query&&matches.length>0&&<div className="suggestions">{matches.map(x=><button key={x.id} onClick={()=>add(x)}><span>{x.name}</span><span>{x.price} ر.ي</span></button>)}</div>}<div className="table-head"><span>الصنف</span><span>الكمية</span><span>السعر</span><span>الإجمالي</span></div><div className="rows">{cart.length===0?<div className="empty">لم تتم إضافة أصناف بعد</div>:cart.map((item,i)=><div className="row" key={item.itemId}><span>{item.name}</span><input type="number" min="1" value={item.quantity} onChange={e=>setCart(cart.map((x,j)=>j===i?{...x,quantity:Number(e.target.value)||1}:x))}/><input type="number" min="0" value={item.price} onChange={e=>setCart(cart.map((x,j)=>j===i?{...x,price:Number(e.target.value)||0}:x))}/><span>{(item.quantity*item.price).toLocaleString('ar-YE')}</span></div>)}</div></div><aside className="payment panel"><div className="amount"><small>الإجمالي</small><strong>{total.toLocaleString('ar-YE')} <em>ر.ي</em></strong></div><label>المدفوع<input type="number" value={paid} onChange={e=>setPaid(e.target.value)} placeholder="0"/></label><div className="amount remaining"><small>المتبقي</small><strong>{remaining.toLocaleString('ar-YE')} <em>ر.ي</em></strong></div><div className="methods"><span>طريقة الدفع</span>{[['cash','نقد'],['wallet','محفظة إلكترونية'],['credit','آجل'],['transfer','تحويل']].map(([v,l])=><button className={method===v?'selected':''} key={v} onClick={()=>setMethod(v)}>{l}</button>)}</div><button className="save" onClick={save}>حفظ الفاتورة</button></aside></div></div>;
}

createRoot(document.getElementById('root')).render(<App/>);
