import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { BudgetWithSpent } from '@budget-passbook/shared';
import { api } from '../../lib/api';
import { fmtTHB } from '../../lib/format';

interface Props {
  month: string;
}

export default function BudgetTab({ month }: Props) {
  const qc = useQueryClient();

  const { data: budgets = [], isLoading } = useQuery({
    queryKey: ['budgets', month],
    queryFn: () => api.budgets.list(month),
  });

  const updateMutation = useMutation({
    mutationFn: ({ categoryId, amount }: { categoryId: string; amount: number }) =>
      api.budgets.upsert(categoryId, { month, amount }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['budgets', month] }),
  });

  if (isLoading) {
    return <div style={{ textAlign: 'center', padding: 40, color: 'var(--ink-soft)', fontFamily: 'IBM Plex Mono, monospace', fontSize: 13 }}>กำลังโหลด...</div>;
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
          </div>
        );
      })}
    </div>
  );
}
