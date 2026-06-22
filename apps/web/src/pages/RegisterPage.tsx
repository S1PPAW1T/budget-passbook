import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RegisterSchema, type RegisterInput } from '@budget-passbook/shared';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export default function RegisterPage() {
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema),
  });

  const onSubmit = async (data: RegisterInput) => {
    setServerError('');
    try {
      const res = await api.auth.register(data);
      login(res.token, res.user);
      navigate('/');
    } catch (e: unknown) {
      setServerError(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper)', padding: '20px' }}>
      <div style={{ position: 'fixed', top: 16, right: 16 }}>
        <button
          onClick={toggleTheme}
          style={{
            background: 'var(--surface)', border: '1px solid var(--line)',
            borderRadius: 8, padding: '6px 12px', cursor: 'pointer', color: 'var(--ink)', fontSize: 14,
          }}
        >
          {theme === 'dark' ? '☀️ สว่าง' : '🌙 มืด'}
        </button>
      </div>

      <div className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontFamily: 'Fraunces, serif', fontSize: 24, fontWeight: 700, color: 'var(--ink)' }}>
            📒 สมุดบัญชี
          </div>
          <div style={{ fontFamily: 'Fraunces, serif', fontSize: 16, fontWeight: 600, color: 'var(--income)', marginTop: 4 }}>
            เก็บสะสม
          </div>
          <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 8 }}>
            สร้างบัญชีเพื่อเริ่มบันทึกการเงิน
          </div>
        </div>

        {serverError && (
          <div style={{ background: 'var(--expense-soft)', border: '1px solid var(--expense)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: 'var(--expense)' }}>
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--ink-soft)', marginBottom: 5, fontWeight: 500 }}>ชื่อ</label>
            <input {...register('displayName')} className="field-input" placeholder="ชื่อของคุณ" />
            {errors.displayName && <p style={{ fontSize: 12, color: 'var(--expense)', marginTop: 4 }}>{errors.displayName.message}</p>}
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--ink-soft)', marginBottom: 5, fontWeight: 500 }}>อีเมล</label>
            <input {...register('email')} type="email" className="field-input" placeholder="your@email.com" />
            {errors.email && <p style={{ fontSize: 12, color: 'var(--expense)', marginTop: 4 }}>{errors.email.message}</p>}
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--ink-soft)', marginBottom: 5, fontWeight: 500 }}>รหัสผ่าน (อย่างน้อย 8 ตัวอักษร)</label>
            <input {...register('password')} type="password" className="field-input" placeholder="••••••••" />
            {errors.password && <p style={{ fontSize: 12, color: 'var(--expense)', marginTop: 4 }}>{errors.password.message}</p>}
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              width: '100%', padding: '12px', border: 'none', borderRadius: 8, cursor: 'pointer',
              background: 'var(--income)', color: '#fff', fontWeight: 700, fontSize: 15,
              fontFamily: 'IBM Plex Sans Thai, sans-serif', opacity: isSubmitting ? 0.7 : 1,
            }}
          >
            {isSubmitting ? 'กำลังสมัคร...' : 'สมัครสมาชิก'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--ink-soft)' }}>
          มีบัญชีแล้ว?{' '}
          <Link to="/login" style={{ color: 'var(--income)', fontWeight: 600, textDecoration: 'none' }}>
            เข้าสู่ระบบ
          </Link>
        </p>
      </div>
    </div>
  );
}
