import { Router } from 'express';
import { TransactionCreateSchema, TransactionUpdateSchema } from '@budget-passbook/shared';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

router.use(requireAuth);

const categorySelect = {
  id: true, userId: true, type: true, name: true, icon: true, sortOrder: true,
};

function parseMonth(month?: string): { gte: Date; lte: Date } | undefined {
  if (!month) return undefined;
  const [y, m] = month.split('-').map(Number);
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 0); // last day of month
  return { gte: start, lte: end };
}

router.get('/', async (req: AuthRequest, res) => {
  try {
    const { month } = req.query as { month?: string };
    const dateFilter = parseMonth(month);
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: req.userId,
        ...(dateFilter ? { date: dateFilter } : {}),
      },
      include: { category: { select: categorySelect } },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });
    res.json(
      transactions.map((t) => ({
        ...t,
        amount: Number(t.amount),
        date: t.date.toISOString().slice(0, 10),
      }))
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

router.post('/', validate(TransactionCreateSchema), async (req: AuthRequest, res) => {
  try {
    const { categoryId, amount, date, note } = req.body;
    const category = await prisma.category.findFirst({
      where: { id: categoryId, OR: [{ userId: null }, { userId: req.userId }] },
    });
    if (!category) {
      res.status(400).json({ error: 'ไม่พบหมวดหมู่' });
      return;
    }
    const tx = await prisma.transaction.create({
      data: { userId: req.userId!, categoryId, amount, date: new Date(date), note },
      include: { category: { select: categorySelect } },
    });
    res.status(201).json({ ...tx, amount: Number(tx.amount), date: tx.date.toISOString().slice(0, 10) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

router.put('/:id', validate(TransactionUpdateSchema), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.transaction.findFirst({ where: { id, userId: req.userId } });
    if (!existing) {
      res.status(404).json({ error: 'ไม่พบรายการ' });
      return;
    }
    const data: Record<string, unknown> = {};
    if (req.body.categoryId !== undefined) data.categoryId = req.body.categoryId;
    if (req.body.amount !== undefined) data.amount = req.body.amount;
    if (req.body.date !== undefined) data.date = new Date(req.body.date);
    if (req.body.note !== undefined) data.note = req.body.note;

    const tx = await prisma.transaction.update({
      where: { id },
      data,
      include: { category: { select: categorySelect } },
    });
    res.json({ ...tx, amount: Number(tx.amount), date: tx.date.toISOString().slice(0, 10) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.transaction.findFirst({ where: { id, userId: req.userId } });
    if (!existing) {
      res.status(404).json({ error: 'ไม่พบรายการ' });
      return;
    }
    await prisma.transaction.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

export default router;
