import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/trend', async (req: AuthRequest, res) => {
  try {
    const months = Math.min(parseInt((req.query.months as string) || '12', 10), 36);
    const results = [];

    const now = new Date();
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const ym = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);

      const rows = await prisma.transaction.groupBy({
        by: ['categoryId'],
        where: { userId: req.userId, date: { gte: start, lte: end } },
        _sum: { amount: true },
      });

      const categories = await prisma.category.findMany({
        where: { id: { in: rows.map((r) => r.categoryId) } },
        select: { id: true, type: true },
      });

      const catTypeMap = new Map(categories.map((c) => [c.id, c.type]));
      let income = 0;
      let expense = 0;
      for (const row of rows) {
        const type = catTypeMap.get(row.categoryId);
        const amt = Number(row._sum.amount ?? 0);
        if (type === 'INCOME') income += amt;
        else if (type === 'EXPENSE') expense += amt;
      }
      results.push({ month: ym, income, expense, net: income - expense });
    }

    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

router.get('/', async (req: AuthRequest, res) => {
  try {
    const { month } = req.query as { month?: string };
    const targetMonth = month || new Date().toISOString().slice(0, 7);
    const [y, m] = targetMonth.split('-').map(Number);
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 0);

    const transactions = await prisma.transaction.findMany({
      where: { userId: req.userId, date: { gte: start, lte: end } },
      include: { category: true },
    });

    const incomeMap = new Map<string, { category: typeof transactions[0]['category']; total: number }>();
    const expenseMap = new Map<string, { category: typeof transactions[0]['category']; total: number }>();
    let totalIncome = 0;
    let totalExpense = 0;

    for (const t of transactions) {
      const amt = Number(t.amount);
      if (t.category.type === 'INCOME') {
        totalIncome += amt;
        const existing = incomeMap.get(t.categoryId);
        if (existing) existing.total += amt;
        else incomeMap.set(t.categoryId, { category: t.category, total: amt });
      } else {
        totalExpense += amt;
        const existing = expenseMap.get(t.categoryId);
        if (existing) existing.total += amt;
        else expenseMap.set(t.categoryId, { category: t.category, total: amt });
      }
    }

    res.json({
      totalIncome,
      totalExpense,
      net: totalIncome - totalExpense,
      incomeByCategory: [...incomeMap.entries()].map(([categoryId, v]) => ({ categoryId, ...v })),
      expenseByCategory: [...expenseMap.entries()].map(([categoryId, v]) => ({ categoryId, ...v })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

export default router;
