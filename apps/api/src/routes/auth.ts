import { Router } from 'express';
import bcrypt from 'bcrypt';
import { RegisterSchema, LoginSchema, ChangePasswordSchema } from '@budget-passbook/shared';
import { prisma } from '../lib/prisma';
import { signToken } from '../lib/jwt';
import { validate } from '../middleware/validate';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/register', validate(RegisterSchema), async (req, res) => {
  try {
    const { email, password, displayName } = req.body;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: 'อีเมลนี้ถูกใช้งานแล้ว' });
      return;
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, passwordHash, displayName },
      select: { id: true, email: true, displayName: true, createdAt: true },
    });
    const token = signToken({ userId: user.id });
    res.status(201).json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่' });
  }
});

router.post('/login', validate(LoginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
      return;
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
      return;
    }
    const token = signToken({ userId: user.id });
    res.json({
      token,
      user: { id: user.id, email: user.email, displayName: user.displayName, createdAt: user.createdAt },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่' });
  }
});

router.get('/me', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, email: true, displayName: true, createdAt: true },
    });
    if (!user) {
      res.status(404).json({ error: 'ไม่พบผู้ใช้' });
      return;
    }
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

router.put('/password', requireAuth, validate(ChangePasswordSchema), async (req: AuthRequest, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) {
      res.status(404).json({ error: 'ไม่พบผู้ใช้' });
      return;
    }
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' });
      return;
    }
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: req.userId }, data: { passwordHash } });
    res.json({ message: 'เปลี่ยนรหัสผ่านสำเร็จ' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

export default router;
