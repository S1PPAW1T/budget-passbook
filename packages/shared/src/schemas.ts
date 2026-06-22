import { z } from 'zod';

export const RegisterSchema = z.object({
  email: z.string().email('อีเมลไม่ถูกต้อง'),
  password: z.string().min(8, 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร'),
  displayName: z.string().min(1, 'กรุณาระบุชื่อ').max(100),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const TransactionCreateSchema = z.object({
  categoryId: z.string().min(1),
  amount: z.number().positive('จำนวนเงินต้องมากกว่า 0'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'รูปแบบวันที่ต้องเป็น YYYY-MM-DD'),
  note: z.string().max(500).optional(),
});

export const TransactionUpdateSchema = TransactionCreateSchema.partial();

export const BudgetUpsertSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, 'รูปแบบเดือนต้องเป็น YYYY-MM'),
  amount: z.number().min(0),
});

export const MonthQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type TransactionCreateInput = z.infer<typeof TransactionCreateSchema>;
export type TransactionUpdateInput = z.infer<typeof TransactionUpdateSchema>;
export type BudgetUpsertInput = z.infer<typeof BudgetUpsertSchema>;
