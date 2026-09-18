import { useState } from 'react';
import { Plus, Wallet, Download } from 'lucide-react';
import { createId } from '../services/storage';
import { applyFinanceEvent } from '../services/eventEngine';
import { downloadBackup } from '../services/backup';
import { queueIfOffline } from '../services/offlineSync';

const money = value => Number(value || 0).toLocaleString('ar-YE') + ' ر.ي';

export default function FinanceCenter({ state, setState }) {
  const [type, setType] = useState('expense');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');

  const expenses = state.expenses || [];
  const revenues = state.revenues || [];
  const sales = (state.sales || []).reduce((s, x) => s + Number(x.total || 0), 0);
  const purchases = (state.purchases || []).reduce((s, x) => s + Number(x.total || 0), 0);
  const expenseTotal = expenses.reduce((s, x) => s + Number(x.amount || 0), 0);
  const revenueTotal = revenues.reduce((s, x) => s + Number(x.amount || 0), 0);

  const addTransaction = () => {
    const value = Number(amount);
    if (!description.trim() || !Number.isFinite(value) || value <= 0) return;

    const key = type === 'expense' ? 'expenses' : 'revenues';
    const row = {
      id: createId(type),
      description: description.trim(),
      amount: value,
      createdAt: new Date().toISOString()
    };

    const eventType=type==='expense'?'EXPENSE_CREATED':'REVENUE_CREATED';
    setState(applyFinanceEvent(state,row,eventType));
    queueIfOffline({id:row.id,type:type==='expense'?'EXPENSE_CREATED':'REVENUE_CREATED',payload:row});
    setDescription('');
    setAmount('');
  };

  const transactions = [
    ...expenses.map(x => ({ ...x, type: 'مصروف' })),
    ...revenues.map(x => ({ ...x, type: 'إيراد آخر' }))
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <section className="page-card">
      <div className="page-head">
        <div>
          <h2>المالية</h2>
          <p>مركز موحد للحركة المالية مع إبقاء القيود المحاسبية وفق القواعد المعتمدة</p>
        </div>
        <Wallet size={28} />
      </div>

      <div className="summary-row">
        {[
          ['المبيعات', sales],
          ['المشتريات', purchases],
          ['المصروفات', expenseTotal],
          ['الإيرادات الأخرى', revenueTotal],
          ['صافي الحركة', sales - purchases - expenseTotal + revenueTotal]
        ].map(([name, value]) => (
          <div key={name}>
            <span>{name}</span>
            <b>{money(value)}</b>
          </div>
        ))}
      </div>

      <div className="form-grid compact">
        <select value={type} onChange={e => setType(e.target.value)}>
          <option value="expense">مصروف</option>
          <option value="revenue">إيراد آخر</option>
        </select>
        <input
          placeholder="وصف العملية"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
        <input
          type="number"
          min="0"
          placeholder="المبلغ"
          value={amount}
          onChange={e => setAmount(e.target.value)}
        />
        <button className="primary-btn" onClick={addTransaction}>
          <Plus size={18} /> حفظ العملية
        </button>
      </div>

      <div className="module-grid">
        {['الصناديق الأربعة', 'المحافظ الإلكترونية', 'التحويلات', 'حركة الحسابات'].map(name => (
          <div className="module-tile" key={name}>
            <Wallet size={20} />
            <strong>{name}</strong>
            <span>مركز إدارة موحد</span>
          </div>
        ))}
        <button className="module-tile" onClick={() => downloadBackup(state)}>
          <Download size={20} />
          <strong>نسخة احتياطية</strong>
          <span>تصدير كامل البيانات</span>
        </button>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>النوع</th><th>الوصف</th><th>المبلغ</th><th>التاريخ</th></tr>
          </thead>
          <tbody>
            {transactions.map(x => (
              <tr key={x.id}>
                <td>{x.type}</td>
                <td>{x.description}</td>
                <td>{money(x.amount)}</td>
                <td>{new Date(x.createdAt).toLocaleString('ar-YE')}</td>
              </tr>
            ))}
            {!transactions.length && (
              <tr><td colSpan="4" className="empty">لا توجد حركة مالية إضافية</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
