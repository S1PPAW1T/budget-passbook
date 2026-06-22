import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';

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

export default router;
