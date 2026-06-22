import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_CATEGORIES = [
  // รายรับ
  { type: 'INCOME' as const, name: 'เงินเดือน', icon: '💼', sortOrder: 1 },
  { type: 'INCOME' as const, name: 'โบนัส', icon: '🎁', sortOrder: 2 },
  { type: 'INCOME' as const, name: 'รายได้เสริม', icon: '💵', sortOrder: 3 },
  { type: 'INCOME' as const, name: 'ผลตอบแทนลงทุน', icon: '📈', sortOrder: 4 },
  { type: 'INCOME' as const, name: 'อื่นๆ', icon: '✨', sortOrder: 5 },
  // รายจ่าย
  { type: 'EXPENSE' as const, name: 'อาหาร', icon: '🍜', sortOrder: 1 },
  { type: 'EXPENSE' as const, name: 'เดินทาง', icon: '🚗', sortOrder: 2 },
  { type: 'EXPENSE' as const, name: 'ที่อยู่อาศัย', icon: '🏠', sortOrder: 3 },
  { type: 'EXPENSE' as const, name: 'ช้อปปิ้ง', icon: '🛍️', sortOrder: 4 },
  { type: 'EXPENSE' as const, name: 'สาธารณูปโภค', icon: '💡', sortOrder: 5 },
  { type: 'EXPENSE' as const, name: 'สุขภาพ', icon: '🏥', sortOrder: 6 },
  { type: 'EXPENSE' as const, name: 'บันเทิง', icon: '🎬', sortOrder: 7 },
  { type: 'EXPENSE' as const, name: 'การศึกษา', icon: '📚', sortOrder: 8 },
  { type: 'EXPENSE' as const, name: 'ออมเงิน/ลงทุน', icon: '🐖', sortOrder: 9 },
  { type: 'EXPENSE' as const, name: 'อื่นๆ', icon: '🗂️', sortOrder: 10 },
];

async function main() {
  console.log('Seeding default categories...');
  for (const cat of DEFAULT_CATEGORIES) {
    await prisma.category.upsert({
      where: {
        id: `default-${cat.type.toLowerCase()}-${cat.sortOrder}`,
      },
      update: {},
      create: {
        id: `default-${cat.type.toLowerCase()}-${cat.sortOrder}`,
        userId: null,
        ...cat,
      },
    });
  }
  console.log(`Seeded ${DEFAULT_CATEGORIES.length} default categories.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
