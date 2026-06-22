import { Router } from 'express';
import { CategoryCreateSchema } from '@budget-passbook/shared';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

router.use(requireAuth);

router.get('/', async (req: AuthRequest, res) => {
  try {
    const categories = await prisma.category.findMany({
      where: { OR: [{ userId: null }, { userId: req.userId }] },
      orderBy: [{ type: 'asc' }, { sortOrder: 'asc' }],
    });
    res.json(categories);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

router.post('/', validate(CategoryCreateSchema), async (req: AuthRequest, res) => {
  try {
    const { type, name, icon } = req.body;
    const category = await prisma.category.create({
      data: { userId: req.userId!, type, name, icon, sortOrder: 100 },
    });
    res.status(201).json(category);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const category = await prisma.category.findFirst({
      where: { id, userId: req.userId },
    });
    if (!category) {
      res.status(404).json({ error: 'ไม่พบหมวดหมู่หรือไม่มีสิทธิ์ลบ' });
      return;
    }
    const txCount = await prisma.transaction.count({ where: { categoryId: id } });
    if (txCount > 0) {
      res.status(400).json({ error: 'ไม่สามารถลบได้เพราะมีรายการที่ใช้หมวดหมู่นี้อยู่' });
      return;
    }
    await prisma.budget.deleteMany({ where: { categoryId: id } });
    await prisma.category.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

export default router;
