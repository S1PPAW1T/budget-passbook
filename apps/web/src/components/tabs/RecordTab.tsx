import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Category } from '@budget-passbook/shared';
import { api } from '../../lib/api';
import { fmtTHB, dateLabel, todayStr } from '../../lib/format';

interface Props {
  month: string;
}

export default function RecordTab({ month }: Props) {
  const qc = useQueryClient();
  const [formType, setFormType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayStr());
  const [categoryId, setCategoryId] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: api.categories.list });
  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions', month],
    queryFn: () => api.transactions.list(month),
  });

  const filteredCats = categories.filter((c: Category) => c.type === (formType === 'income' ? 'INCOME' : 'EXPENSE'));

  const addMutation = useMutation({
    mutationFn: api.transactions.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions', month] });
      qc.invalidateQueries({ queryKey: ['summary', month] });
      setAmount('');
      setNote('');
      setError('');
    },
    onError: (e: Error) => setError(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: api.transactions.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions', month] });
      qc.invalidateQueries({ queryKey: ['summary', month] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0 || !date || !categoryId) { setError('กรุณากรอกข้อมูลให้ครบ'); return; }
    addMutation.mutate({ amount: parseFloat(amount), date, categoryId, note: note || undefined });
  };

  const sorted = [...transactions].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));

  const s: React.CSSProperties = {
    fontFamily: 'IBM Plex Sans Thai, sans-serif',
  };

  return (
    <div style={s}>
      <div style={{ display: 'flex', fontFamily: 'inherit', marginBottom: 14, gap: 8 }}>
        {(['income', 'expense'] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setFormType(t); setCategoryId(''); }}
            style={{
              flex: 1, padding: '10px', textAlign: 'center', borderRadius: 8, cursor: 'pointer',
              fontWeight: 600, fontSize: 14, border: '1.5px solid',
              borderColor: formType === t ? (t === 'income' ? 'var(--income)' : 'var(--expense)') : 'var(--line)',
              color: formType === t ? (t === 'income' ? 'var(--income)' : 'var(--expense)') : 'var(--ink-soft)',
              background: formType === t ? (t === 'income' ? 'var(--income-soft)' : 'var(--expense-soft)') : 'var(--paper)',
            }}
          >
            {t === 'income' ? '＋ รายรับ' : '－ รายจ่าย'}
          </button>
        ))}
      </div>

      {error && (
        <div style={{ background: 'var(--expense-soft)', color: 'var(--expense)', borderRadius: 8, padding: '8px 12px', fontSize: 13, marginBottom: 12 }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--ink-soft)', marginBottom: 5, fontWeight: 500 }}>จำนวนเงิน (บาท)</label>
            <input className="field-input" type="number" step="0.01" min="0" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--ink-soft)', marginBottom: 5, fontWeight: 500 }}>วันที่</label>
            <input className="field-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div style={{ gridColumn: '1/-1' }}>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--ink-soft)', marginBottom: 5, fontWeight: 500 }}>ประเภท</label>
            <select className="field-input" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
              <option value="">-- เลือกประเภท --</option>
              {filteredCats.map((c: Category) => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
          </div>
          <div style={{ gridColumn: '1/-1' }}>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--ink-soft)', marginBottom: 5, fontWeight: 500 }}>หมายเหตุ (ไม่บังคับ)</label>
            <input className="field-input" type="text" placeholder="เช่น ข้าวเที่ยง, ค่า Grab..." value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <button
            type="submit"
            disabled={addMutation.isPending}
            style={{
              gridColumn: '1/-1', padding: 12, border: 'none', borderRadius: 8, cursor: 'pointer',
              background: 'var(--income)', color: '#081208', fontWeight: 700, fontSize: 14,
              fontFamily: 'IBM Plex Sans Thai, sans-serif', letterSpacing: '.3px',
              opacity: addMutation.isPending ? 0.7 : 1,
            }}
          >
            {addMutation.isPending ? 'กำลังบันทึก...' : 'บันทึกลงสมุดบัญชี'}
          </button>
        </div>
      </form>

      <div style={{ marginTop: 24, borderTop: '1px dashed var(--line)', paddingTop: 14 }}>
        {sorted.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--ink-soft)', fontFamily: 'IBM Plex Mono, monospace', fontSize: 13 }}>
            ✦ ยังไม่มีรายการเดือนนี้ ลงมือบันทึกรายการแรกกันเลย ✦
          </div>
        ) : (
          sorted.map((t) => (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '11px 4px', borderBottom: '1px dashed var(--line)' }}>
              <div className={`stamp ${t.category.type === 'INCOME' ? 'income' : 'expense'}`}>
                {t.category.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{t.category.name}</div>
                {t.note && <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 1 }}>{t.note}</div>}
                <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11.5, color: 'var(--ink-soft)', marginTop: 2 }}>{dateLabel(t.date)}</div>
              </div>
              <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontWeight: 600, fontSize: 15, color: t.category.type === 'INCOME' ? 'var(--income)' : 'var(--expense)', whiteSpace: 'nowrap' }}>
                {t.category.type === 'INCOME' ? '+' : '-'}{fmtTHB(t.amount)}
              </div>
              <button
                onClick={() => deleteMutation.mutate(t.id)}
                style={{ background: 'none', border: 'none', color: 'var(--ink-soft)', cursor: 'pointer', fontSize: 16, padding: '4px 6px', opacity: 0.5 }}
                onMouseEnter={(e) => { (e.target as HTMLElement).style.opacity = '1'; (e.target as HTMLElement).style.color = 'var(--expense)'; }}
                onMouseLeave={(e) => { (e.target as HTMLElement).style.opacity = '0.5'; (e.target as HTMLElement).style.color = 'var(--ink-soft)'; }}
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
