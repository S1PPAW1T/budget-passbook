import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import type { SummaryMonth } from '@budget-passbook/shared';
import { api } from '../lib/api';
import { fmtTHB, monthLabel, shiftMonth, currentMonth } from '../lib/format';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import RecordTab from '../components/tabs/RecordTab';
import BudgetTab from '../components/tabs/BudgetTab';
import SummaryTab from '../components/tabs/SummaryTab';

type TabId = 'record' | 'budget' | 'summary';

const TABS: { id: TabId; label: string }[] = [
  { id: 'record', label: 'บันทึกรายการ' },
  { id: 'budget', label: 'งบประมาณ' },
  { id: 'summary', label: 'สรุปภาพรวม' },
];

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [viewMonth, setViewMonth] = useState(currentMonth);
  const [activeTab, setActiveTab] = useState<TabId>('record');
  const [showChangePw, setShowChangePw] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);

  const changePwMutation = useMutation({
    mutationFn: () => api.auth.changePassword({ currentPassword: currentPw, newPassword: newPw }),
    onSuccess: () => {
      setPwSuccess(true);
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
      setTimeout(() => { setShowChangePw(false); setPwSuccess(false); }, 1500);
    },
  });

  useEffect(() => {
    const BASE = (import.meta.env.VITE_API_URL ?? '') + '/api';
    const ping = () => fetch(`${BASE}/health`).catch(() => {});
    const id = setInterval(ping, 1000 * 60 * 10);
    return () => clearInterval(id);
  }, []);

  const { data: summary } = useQuery<SummaryMonth>({
    queryKey: ['summary', viewMonth],
    queryFn: () => api.summary.month(viewMonth),
  });

  const { data: totalSavings } = useQuery({
    queryKey: ['summary', 'total'],
    queryFn: () => api.summary.total(),
  });

  const totalIn = summary?.totalIncome ?? 0;
  const totalOut = summary?.totalExpense ?? 0;
  const net = summary?.net ?? 0;
  const accumulated = totalSavings?.net ?? 0;

  return (
    <div style={{ maxWidth: 880, margin: '0 auto', paddingBottom: 48 }}>
      {/* ── Cover ── */}
      <div className="pb-cover">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: 22, letterSpacing: '.3px' }}>
              สมุดบัญชี เก็บสะสม
            </div>
            <div style={{ fontSize: 12, opacity: 0.75, marginTop: 2, letterSpacing: '.5px' }}>
              PERSONAL LEDGER · บันทึกรายรับรายจ่ายส่วนตัว · {user?.displayName}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Month nav */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'IBM Plex Mono, monospace', fontSize: 13 }}>
              <button
                onClick={() => setViewMonth((m) => shiftMonth(m, -1))}
                style={{ background: 'rgba(255,255,255,.08)', border: '1px solid var(--line)', color: 'var(--ink)', width: 28, height: 28, borderRadius: '50%', cursor: 'pointer', fontSize: 14 }}
                aria-label="เดือนก่อนหน้า"
              >‹</button>
              <span>{monthLabel(viewMonth)}</span>
              <button
                onClick={() => setViewMonth((m) => shiftMonth(m, 1))}
                style={{ background: 'rgba(255,255,255,.08)', border: '1px solid var(--line)', color: 'var(--ink)', width: 28, height: 28, borderRadius: '50%', cursor: 'pointer', fontSize: 14 }}
                aria-label="เดือนถัดไป"
              >›</button>
            </div>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'สลับธีมสว่าง' : 'สลับธีมมืด'}
              style={{ background: 'rgba(255,255,255,.08)', border: '1px solid var(--line)', color: 'var(--ink)', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', fontSize: 15 }}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>

            {/* Change password */}
            <button
              onClick={() => setShowChangePw(true)}
              title="เปลี่ยนรหัสผ่าน"
              style={{ background: 'rgba(255,255,255,.08)', border: '1px solid var(--line)', color: 'var(--ink-soft)', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', fontSize: 15 }}
            >
              🔑
            </button>

            {/* Logout */}
            <button
              onClick={logout}
              title="ออกจากระบบ"
              style={{ background: 'rgba(255,255,255,.08)', border: '1px solid var(--line)', color: 'var(--ink-soft)', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', fontSize: 15 }}
            >
              ↩
            </button>
          </div>
        </div>

        {/* Balance */}
        <div style={{ marginTop: 22, display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, opacity: 0.8 }}>เงินเก็บเดือนนี้</span>
          <span style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 40, letterSpacing: '.5px', color: net < 0 ? 'var(--expense)' : 'var(--ink)' }}>
            {net < 0 ? '-' : ''}{fmtTHB(Math.abs(net))}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 22, marginTop: 14, fontFamily: 'IBM Plex Mono, monospace', fontSize: 13 }}>
          <span style={{ color: 'var(--income)' }}>▲ รับ {fmtTHB(totalIn)}</span>
          <span style={{ color: 'var(--expense)' }}>▼ จ่าย {fmtTHB(totalOut)}</span>
        </div>
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,.12)', display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, opacity: 0.7 }}>เงินเก็บสะสมทั้งหมด</span>
          <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontWeight: 700, fontSize: 22, letterSpacing: '.5px', color: accumulated < 0 ? 'var(--expense)' : 'var(--gold)' }}>
            {accumulated < 0 ? '-' : ''}{fmtTHB(Math.abs(accumulated))}
          </span>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: 6, padding: '18px 20px 0' }}>
        {TABS.map((tab, i) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              fontFamily: 'IBM Plex Sans Thai, sans-serif',
              fontWeight: 600,
              fontSize: 14,
              padding: '9px 16px',
              borderRadius: i === 0 ? (activeTab === tab.id ? '10px 10px 0 0' : '10px 10px 0 0') : '10px 10px 0 0',
              cursor: 'pointer',
              color: activeTab === tab.id ? 'var(--ink)' : 'var(--ink-soft)',
              border: '1px solid',
              borderColor: activeTab === tab.id ? 'var(--line)' : 'transparent',
              borderBottom: activeTab === tab.id ? 'none' : '1px solid transparent',
              background: activeTab === tab.id ? 'var(--surface)' : 'transparent',
              position: 'relative',
              bottom: -1,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Panel ── */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--line)',
        borderRadius: activeTab === 'record' ? '0 12px 12px 12px' : '12px',
        margin: '0 20px',
        padding: 22,
        position: 'relative',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--gold)', display: 'inline-block' }} />
          <span style={{ fontFamily: 'Fraunces, serif', fontSize: 17, fontWeight: 600 }}>
            {activeTab === 'record' && 'เพิ่มรายการใหม่'}
            {activeTab === 'budget' && 'ใช้จ่ายตามประเภท (งบประมาณรายจ่ายต่อเดือน)'}
            {activeTab === 'summary' && 'สรุปรายรับ-รายจ่าย เดือนนี้'}
          </span>
        </div>

        {activeTab === 'record' && <RecordTab month={viewMonth} />}
        {activeTab === 'budget' && <BudgetTab month={viewMonth} />}
        {activeTab === 'summary' && <SummaryTab month={viewMonth} />}
      </div>

      {/* Change password modal */}
      {showChangePw && (
        <div
          onClick={() => { setShowChangePw(false); setCurrentPw(''); setNewPw(''); setConfirmPw(''); changePwMutation.reset(); setPwSuccess(false); }}
          style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 16, padding: '28px 28px 22px', maxWidth: 360, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,.35)' }}
          >
            <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: 18, marginBottom: 20 }}>เปลี่ยนรหัสผ่าน</div>

            {pwSuccess ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--income)', fontWeight: 600, fontSize: 15 }}>
                ✓ เปลี่ยนรหัสผ่านสำเร็จ
              </div>
            ) : (
              <>
                {[
                  { label: 'รหัสผ่านปัจจุบัน', value: currentPw, set: setCurrentPw },
                  { label: 'รหัสผ่านใหม่ (อย่างน้อย 8 ตัว)', value: newPw, set: setNewPw },
                  { label: 'ยืนยันรหัสผ่านใหม่', value: confirmPw, set: setConfirmPw },
                ].map(({ label, value, set }) => (
                  <div key={label} style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginBottom: 5 }}>{label}</div>
                    <input
                      type="password"
                      value={value}
                      onChange={(e) => set(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--line)', borderRadius: 8, background: 'var(--surface)', color: 'var(--ink)', fontSize: 14, boxSizing: 'border-box' }}
                    />
                  </div>
                ))}

                {confirmPw && newPw !== confirmPw && (
                  <div style={{ color: 'var(--expense)', fontSize: 12, marginBottom: 10 }}>รหัสผ่านใหม่ไม่ตรงกัน</div>
                )}
                {changePwMutation.isError && (
                  <div style={{ color: 'var(--expense)', fontSize: 12, marginBottom: 10 }}>
                    {(changePwMutation.error as Error).message}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                  <button
                    onClick={() => { setShowChangePw(false); setCurrentPw(''); setNewPw(''); setConfirmPw(''); changePwMutation.reset(); }}
                    style={{ flex: 1, padding: '9px 0', border: '1px solid var(--line)', borderRadius: 8, background: 'none', color: 'var(--ink-soft)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={() => { if (newPw === confirmPw && currentPw && newPw.length >= 8) changePwMutation.mutate(); }}
                    disabled={!currentPw || !newPw || newPw !== confirmPw || newPw.length < 8 || changePwMutation.isPending}
                    style={{ flex: 1, padding: '9px 0', border: 'none', borderRadius: 8, background: 'var(--ink)', color: 'var(--bg)', cursor: 'pointer', fontSize: 13, fontWeight: 600, opacity: (!currentPw || !newPw || newPw !== confirmPw || newPw.length < 8 || changePwMutation.isPending) ? 0.5 : 1 }}
                  >
                    {changePwMutation.isPending ? 'กำลังบันทึก...' : 'บันทึก'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
