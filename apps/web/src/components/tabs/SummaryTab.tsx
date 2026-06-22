import { useQuery } from '@tanstack/react-query';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';
import { api } from '../../lib/api';
import { fmtTHB, monthLabelShort } from '../../lib/format';
import type { SummaryMonth, TrendPoint } from '@budget-passbook/shared';

const PALETTE = ['#46DE82','#2F9E63','#D9B23C','#FF7A59','#5FB8D9','#9C7CD9','#7FA08C','#E0E07A','#4ADE9E','#C97AD9'];
const PALETTE_LIGHT = ['#2F6F4F','#B8860B','#B0463C','#1F3A5C','#1A7A9F','#5A3A9C','#4A7060','#8A8A1A','#1A8A5A','#7A3A9C'];

interface Props { month: string }

function DonutCard({ title, data, palette }: { title: string; data: { name: string; value: number; icon: string }[]; palette: string[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div style={{ border: '1px solid var(--line)', borderRadius: 10, padding: 16, background: 'var(--paper)' }}>
      <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 8 }}>{title}</div>
      {data.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--ink-soft)', fontSize: 13, fontFamily: 'IBM Plex Mono, monospace' }}>ยังไม่มีข้อมูล</div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2}>
                {data.map((_, i) => <Cell key={i} fill={palette[i % palette.length]} stroke="var(--surface)" strokeWidth={2} />)}
              </Pie>
              <Tooltip formatter={(v: number) => fmtTHB(v)} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ marginTop: 8 }}>
            {data.map((d, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, padding: '3px 2px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: palette[i % palette.length], display: 'inline-block', flexShrink: 0 }} />
                  {d.icon} {d.name}
                </span>
                <span style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                  {fmtTHB(d.value)} ({total > 0 ? ((d.value / total) * 100).toFixed(0) : 0}%)
                </span>
              </div>
            ))}
            <div style={{ textAlign: 'center', fontFamily: 'IBM Plex Mono, monospace', fontSize: 12, color: 'var(--ink-soft)', marginTop: 8 }}>
              รวม {fmtTHB(total)}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function SummaryTab({ month }: Props) {
  const { data: summary, isLoading: sLoading } = useQuery<SummaryMonth>({
    queryKey: ['summary', month],
    queryFn: () => api.summary.month(month),
  });
  const { data: trend = [], isLoading: tLoading } = useQuery<TrendPoint[]>({
    queryKey: ['trend'],
    queryFn: () => api.summary.trend(12),
  });

  const isDark = document.documentElement.classList.contains('dark');
  const palette = isDark ? PALETTE : PALETTE_LIGHT;

  const incomeData = (summary?.incomeByCategory ?? []).map((b) => ({
    name: b.category.name, value: b.total, icon: b.category.icon,
  }));
  const expenseData = (summary?.expenseByCategory ?? []).map((b) => ({
    name: b.category.name, value: b.total, icon: b.category.icon,
  }));

  const trendData = trend.map((t) => ({
    month: monthLabelShort(t.month),
    รายรับ: t.income,
    รายจ่าย: t.expense,
    เงินเก็บ: t.net,
  }));

  if (sLoading || tLoading) {
    return <div style={{ textAlign: 'center', padding: 40, color: 'var(--ink-soft)', fontFamily: 'IBM Plex Mono, monospace', fontSize: 13 }}>กำลังโหลด...</div>;
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <DonutCard title="▲ สัดส่วนรายรับ" data={incomeData} palette={palette} />
        <DonutCard title="▼ สัดส่วนรายจ่าย" data={expenseData} palette={palette} />
      </div>

      <div style={{ marginTop: 20, border: '1px solid var(--line)', borderRadius: 10, padding: 16, background: 'var(--paper)' }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--gold)', display: 'inline-block' }} />
          เงินเก็บย้อนหลัง 12 เดือน
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={trendData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--ink-soft)', fontFamily: 'IBM Plex Mono' }} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--ink-soft)', fontFamily: 'IBM Plex Mono' }} tickFormatter={(v) => '฿' + (v / 1000).toFixed(0) + 'k'} />
            <Tooltip formatter={(v: number) => fmtTHB(v)} contentStyle={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 8, fontSize: 12 }} />
            <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="รายรับ" stroke="var(--income)" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="รายจ่าย" stroke="var(--expense)" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="เงินเก็บ" stroke="var(--gold)" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
