import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/total', async (req: AuthRequest, res) => {
  try {
    const grouped = await prisma.transaction.groupBy({
      by: ['categoryId'],
      where: { userId: req.userId },
      _sum: { amount: true },
    });
    const categories = await prisma.category.findMany({
      where: { id: { in: grouped.map((r) => r.categoryId) } },
      select: { id: true, type: true },
    });
    const typeMap = new Map(categories.map((c) => [c.id, c.type]));
    let totalIncome = 0;
    let totalExpense = 0;
    for (const r of grouped) {
      const amt = Number(r._sum.amount ?? 0);
      if (typeMap.get(r.categoryId) === 'INCOME') totalIncome += amt;
      else totalExpense += amt;
    }
    res.json({ totalIncome, totalExpense, net: totalIncome - totalExpense });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

router.get('/trend', async (req: AuthRequest, res) => {
  try {
    const months = Math.min(parseInt((req.query.months as string) || '12', 10), 36);
    const now = new Date();

    const monthLabels: string[] = [];
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthLabels.push(d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'));
    }

    const rangeStart = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);
    const rangeEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const transactions = await prisma.transaction.findMany({
      where: { userId: req.userId, date: { gte: rangeStart, lte: rangeEnd } },
      select: { amount: true, date: true, category: { select: { type: true } } },
    });

    const monthMap = new Map<string, { income: number; expense: number }>();
    for (const label of monthLabels) monthMap.set(label, { income: 0, expense: 0 });

    for (const t of transactions) {
      const d = new Date(t.date);
      const ym = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
      const entry = monthMap.get(ym);
      if (!entry) continue;
      const amt = Number(t.amount);
      if (t.category.type === 'INCOME') entry.income += amt;
      else entry.expense += amt;
    }

    const results = monthLabels.map((month) => {
      const { income, expense } = monthMap.get(month)!;
      return { month, income, expense, net: income - expense };
    });

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
