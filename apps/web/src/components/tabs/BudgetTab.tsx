import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { BudgetWithSpent } from '@budget-passbook/shared';
import { api } from '../../lib/api';
import { fmtTHB } from '../../lib/format';

interface Props {
  month: string;
}

interface PendingDelete {
  id: string;
  name: string;
  icon: string;
}

export default function BudgetTab({ month }: Props) {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [newIcon, setNewIcon] = useState('📦');
  const [newName, setNewName] = useState('');
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);

  const { data: budgets = [], isLoading } = useQuery({
    queryKey: ['budgets', month],
    queryFn: () => api.budgets.list(month),
  });

  const updateMutation = useMutation({
    mutationFn: ({ categoryId, amount }: { categoryId: string; amount: number }) =>
      api.budgets.upsert(categoryId, { month, amount }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['budgets', month] }),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api.categories.create({ type: 'EXPENSE', name: newName.trim(), icon: newIcon.trim() || '📦' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['budgets', month] });
      setNewName('');
      setNewIcon('📦');
      setShowAdd(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.categories.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['budgets', month] });
      setPendingDelete(null);
    },
    onError: () => setPendingDelete(null),
  });

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: 'var(--ink-soft)', fontFamily: 'IBM Plex Mono, monospace', fontSize: 13 }}>
        กำลังโหลด...
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 16, fontSize: 13, color: 'var(--ink-soft)' }}>
        ตั้งวงเงินรายจ่ายต่อหมวดหมู่สำหรับเดือนนี้ แถบสีจะเปลี่ยนเป็นแดงเมื่อใช้เกินงบ
      </div>

      {budgets.map((b: BudgetWithSpent) => {
        const pct = b.amount > 0 ? Math.min(100, (b.spent / b.amount) * 100) : 0;
        const over = b.amount > 0 && b.spent > b.amount;
        return (
          <div key={b.categoryId} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
            <div style={{ fontSize: 18, width: 30, textAlign: 'center' }}>{b.category.icon}</div>
            <div style={{ flex: '0 0 110px', fontSize: 13.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {b.category.name}
            </div>
            <div className="budget-bar-track">
              <div className={`budget-bar-fill ${over ? 'over' : ''}`} style={{ width: `${pct}%` }} />
            </div>
            <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11.5, color: over ? 'var(--expense)' : 'var(--ink-soft)', width: 150, textAlign: 'right', flexShrink: 0 }}>
              {fmtTHB(b.spent)} / {fmtTHB(b.amount)}
            </div>
            <input
              type="number"
              min="0"
              step="100"
              defaultValue={b.amount}
              onBlur={(e) => {
                const v = parseFloat(e.target.value) || 0;
                if (v !== b.amount) updateMutation.mutate({ categoryId: b.categoryId, amount: v });
              }}
              style={{
                width: 90, padding: '6px 8px', border: '1px solid var(--line)', borderRadius: 6,
                fontFamily: 'IBM Plex Mono, monospace', fontSize: 12.5, textAlign: 'right',
                background: 'var(--surface)', color: 'var(--ink)', flexShrink: 0,
              }}
            />
            <button
              onClick={() => setPendingDelete({ id: b.category.id, name: b.category.name, icon: b.category.icon })}
              title="ลบหมวดหมู่"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--ink-soft)', fontSize: 15, padding: '2px 4px', flexShrink: 0,
              }}
            >
              🗑
            </button>
          </div>
        );
      })}

      <div style={{ marginTop: 16 }}>
        {!showAdd ? (
          <button
            onClick={() => setShowAdd(true)}
            style={{
              background: 'none', border: '1px dashed var(--line)', borderRadius: 8,
              padding: '8px 16px', cursor: 'pointer', color: 'var(--ink-soft)',
              fontSize: 13, width: '100%',
            }}
          >
            + เพิ่มหมวดหมู่รายจ่าย
          </button>
        ) : (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px 0' }}>
            <input
              value={newIcon}
              onChange={(e) => setNewIcon(e.target.value)}
              placeholder="🎯"
              maxLength={4}
              style={{
                width: 52, padding: '6px 8px', border: '1px solid var(--line)', borderRadius: 6,
                background: 'var(--surface)', color: 'var(--ink)', fontSize: 16, textAlign: 'center',
              }}
            />
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="ชื่อหมวดหมู่"
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter' && newName.trim()) createMutation.mutate(); }}
              style={{
                flex: 1, padding: '6px 10px', border: '1px solid var(--line)', borderRadius: 6,
                background: 'var(--surface)', color: 'var(--ink)', fontSize: 13,
              }}
            />
            <button
              onClick={() => { if (newName.trim()) createMutation.mutate(); }}
              disabled={!newName.trim() || createMutation.isPending}
              style={{
                padding: '6px 14px', background: 'var(--ink)', color: 'var(--bg)',
                border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600,
                opacity: !newName.trim() || createMutation.isPending ? 0.5 : 1,
              }}
            >
              เพิ่ม
            </button>
            <button
              onClick={() => { setShowAdd(false); setNewName(''); setNewIcon('📦'); }}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--ink-soft)', fontSize: 13, padding: '6px',
              }}
            >
              ยกเลิก
            </button>
          </div>
        )}
      </div>

      {createMutation.isError && (
        <div style={{ color: 'var(--expense)', fontSize: 12, marginTop: 6 }}>
          {(createMutation.error as Error).message}
        </div>
      )}

      {/* Delete confirm modal */}
      {pendingDelete && (
        <div
          onClick={() => setPendingDelete(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(0,0,0,.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--surface)', border: '1px solid var(--line)',
              borderRadius: 16, padding: '28px 28px 22px', maxWidth: 340, width: '100%',
              boxShadow: '0 20px 60px rgba(0,0,0,.35)',
            }}
          >
            <div style={{ fontSize: 36, textAlign: 'center', marginBottom: 12 }}>
              {pendingDelete.icon}
            </div>
            <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: 17, textAlign: 'center', marginBottom: 8 }}>
              ลบหมวดหมู่
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink-soft)', textAlign: 'center', marginBottom: 24, lineHeight: 1.6 }}>
              ต้องการลบ <strong style={{ color: 'var(--ink)' }}>"{pendingDelete.name}"</strong> ใช่ไหม?
              <br />หากมีรายการผูกอยู่จะลบไม่ได้
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setPendingDelete(null)}
                style={{
                  flex: 1, padding: '9px 0', border: '1px solid var(--line)', borderRadius: 8,
                  background: 'none', color: 'var(--ink-soft)', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                }}
              >
                ยกเลิก
              </button>
              <button
                onClick={() => deleteMutation.mutate(pendingDelete.id)}
                disabled={deleteMutation.isPending}
                style={{
                  flex: 1, padding: '9px 0', border: 'none', borderRadius: 8,
                  background: 'var(--expense)', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                  opacity: deleteMutation.isPending ? 0.6 : 1,
                }}
              >
                {deleteMutation.isPending ? 'กำลังลบ...' : 'ลบ'}
              </button>
            </div>
            {deleteMutation.isError && (
              <div style={{ color: 'var(--expense)', fontSize: 12, marginTop: 10, textAlign: 'center' }}>
                {(deleteMutation.error as Error).message}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
