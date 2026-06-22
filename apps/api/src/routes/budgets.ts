import { Router } from 'express';
import { BudgetUpsertSchema } from '@budget-passbook/shared';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

router.use(requireAuth);

router.get('/', async (req: AuthRequest, res) => {
  try {
    const { month } = req.query as { month?: string };
    const targetMonth = month || new Date().toISOString().slice(0, 7);

    const [budgets, expenseCategories] = await Promise.all([
      prisma.budget.findMany({
        where: { userId: req.userId, month: targetMonth },
        include: { category: true },
      }),
      prisma.category.findMany({
        where: { type: 'EXPENSE', OR: [{ userId: null }, { userId: req.userId }] },
        orderBy: { sortOrder: 'asc' },
      }),
    ]);

    const [y, m] = targetMonth.split('-').map(Number);
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 0);

    const spentRows = await prisma.transaction.groupBy({
      by: ['categoryId'],
      where: {
        userId: req.userId,
        date: { gte: start, lte: end },
        category: { type: 'EXPENSE' },
      },
      _sum: { amount: true },
    });

    const spentMap = new Map(spentRows.map((r) => [r.categoryId, Number(r._sum.amount ?? 0)]));
    const budgetMap = new Map(budgets.map((b) => [b.categoryId, b]));

    const result = expenseCategories.map((cat) => {
      const budget = budgetMap.get(cat.id);
      return {
        categoryId: cat.id,
        category: cat,
        month: targetMonth,
        amount: budget ? Number(budget.amount) : 0,
        spent: spentMap.get(cat.id) ?? 0,
      };
    });

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

router.put('/:categoryId', validate(BudgetUpsertSchema), async (req: AuthRequest, res) => {
  try {
    const { categoryId } = req.params;
    const { month, amount } = req.body;

    const category = await prisma.category.findFirst({
      where: { id: categoryId, OR: [{ userId: null }, { userId: req.userId }] },
    });
    if (!category) {
      res.status(400).json({ error: 'ไม่พบหมวดหมู่' });
      return;
    }

    const budget = await prisma.budget.upsert({
      where: { userId_categoryId_month: { userId: req.userId!, categoryId, month } },
      create: { userId: req.userId!, categoryId, month, amount },
      update: { amount },
      include: { category: true },
    });

    res.json({ ...budget, amount: Number(budget.amount) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

export default router;
