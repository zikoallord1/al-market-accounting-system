import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ShoppingCart, Package, Boxes, Users, Truck, Wallet, UserRound, BarChart3, Camera, Settings, Search, Bell, Clock3 } from 'lucide-react';
import './styles.css';

const modules = [
  ['المبيعات', ShoppingCart], ['المشتريات', Truck], ['الأصناف', Package], ['المخزون', Boxes],
  ['العملاء', Users], ['الموردون', Truck], ['المالية', Wallet], ['الموظفون', UserRound],
  ['التقارير', BarChart3], ['الكاميرات والمراقبة', Camera], ['الإعدادات', Settings]
];

function App() {
  const [active, setActive] = useState('المبيعات');
  const [query, setQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [paid, setPaid] = useState('');

  const addItem = () => {
    if (!query.trim()) return;
    setCart([...cart, { name: query.trim(), qty: 1, price: 0 }]);
    setQuery('');
  };

  const total = cart.reduce((sum, item) => sum + item.qty * item.price, 0);
  const remaining = Math.max(total - Number(paid || 0), 0);

  return <div className="app">
    <header className="topbar">
      <div className="brand"><div className="logo">م</div><div><strong>نظام الماركت المحاسبي</strong><small>نظام موحد للمبيعات والمالية والمخزون</small></div></div>
      <div className="top-actions"><span><Clock3 size={16}/> {new Date().toLocaleDateString('ar-YE')}</span><button title="التنبيهات"><Bell size={19}/></button></div>
    </header>

    <div className="ticker"><b>التنبيهات:</b><span>مرحباً بك في نظام الماركت المحاسبي</span><span>يمكنك متابعة العمليات والتقارير من التبويبات الرئيسية</span></div>

    <main className="layout">
      <section className="workspace">
        {active === 'المبيعات' ? <Sales query={query} setQuery={setQuery} addItem={addItem} cart={cart} setCart={setCart} total={total} paid={paid} setPaid={setPaid} remaining={remaining}/> : <Module name={active}/>} 
      </section>

      <nav className="sidebar">
        {modules.map(([name, Icon]) => <button key={name} className={active === name ? 'nav active' : 'nav'} onClick={() => setActive(name)}><Icon size={19}/><span>{name}</span></button>)}
      </nav>
    </main>

    <footer>تنفيذ وتصميم المهندس زكريا الحاج &nbsp; | &nbsp; لطلب البرنامج أو برامج أخرى التواصل بالرقم 772233564</footer>
  </div>
}

function Sales({query,setQuery,addItem,cart,setCart,total,paid,setPaid,remaining}) {
  return <div className="sales">
    <div className="page-title"><div><h1>المبيعات</h1><p>إنشاء الفاتورة وإتمام العملية من شاشة واحدة</p></div><div className="status">متصل</div></div>
    <div className="sales-grid">
      <div className="cart-panel panel">
        <div className="search"><Search size={19}/><input value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addItem()} placeholder="ابحث عن صنف بالاسم أو الباركود..."/><button onClick={addItem}>إضافة</button></div>
        <div className="table-head"><span>الصنف</span><span>الكمية</span><span>السعر</span><span>الإجمالي</span></div>
        <div className="rows">{cart.length===0 ? <div className="empty">لم تتم إضافة أصناف بعد</div> : cart.map((item,i)=><div className="row" key={i}><span>{item.name}</span><input type="number" min="1" value={item.qty} onChange={e=>{const c=[...cart];c[i].qty=Number(e.target.value)||1;setCart(c)}}/><input type="number" min="0" value={item.price} onChange={e=>{const c=[...cart];c[i].price=Number(e.target.value)||0;setCart(c)}}/><span>{(item.qty*item.price).toLocaleString('ar-YE')}</span></div>)}</div>
      </div>
      <aside className="payment panel">
        <div className="amount"><small>الإجمالي</small><strong>{total.toLocaleString('ar-YE')} <em>ر.ي</em></strong></div>
        <label>المدفوع<input type="number" value={paid} onChange={e=>setPaid(e.target.value)} placeholder="0"/></label>
        <div className="amount remaining"><small>المتبقي</small><strong>{remaining.toLocaleString('ar-YE')} <em>ر.ي</em></strong></div>
        <div className="methods"><span>طريقة الدفع</span><button>نقد</button><button>محفظة إلكترونية</button><button>آجل</button><button>تحويل</button></div>
        <button className="save">حفظ الفاتورة</button>
      </aside>
    </div>
  </div>
}

function Module({name}) { return <div className="module"><div className="page-title"><div><h1>{name}</h1><p>واجهة موحدة وبسيطة لإدارة {name}</p></div></div><div className="module-card"><h2>{name}</h2><p>تم تجهيز مساحة الوحدة ضمن الهيكل الموحد. سيتم ربط العمليات الفعلية بقاعدة البيانات والحسابات والمخزون والتقارير دون تكرار إدخال البيانات.</p></div></div> }

createRoot(document.getElementById('root')).render(<App/>);
