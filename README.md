# สมุดบัญชี เก็บสะสม — Personal Ledger

แอปจดบันทึกรายรับ-รายจ่ายส่วนตัว ดีไซน์สไตล์สมุดบัญชีธนาคารกระดาษ

## Tech Stack

- **Frontend** React 18 + TypeScript + Vite + Tailwind CSS + TanStack Query + Recharts
- **Backend** Node.js + TypeScript + Express + Prisma
- **Database** PostgreSQL (Docker Compose สำหรับ local dev)

## วิธีรัน (Local Development)

### 1. ติดตั้ง Prerequisites

- [Node.js 20+](https://nodejs.org/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- npm 8+ (มาพร้อม Node.js)

### 2. Clone และติดตั้ง dependencies

```bash
git clone <repo>
cd budget-passbook
npm install
```

### 3. ตั้งค่า Environment Variables

```bash
cp .env.example apps/api/.env
# แก้ไข JWT_SECRET ให้เป็นค่า random ที่ปลอดภัย
```

### 4. เริ่ม Database

```bash
docker compose up -d
```

### 5. รัน Database Migration และ Seed

```bash
npm run db:migrate
npm run db:seed
```

### 6. เปิดแอป

```bash
npm run dev
```

เปิดเบราว์เซอร์ไปที่ [http://localhost:5173](http://localhost:5173)

- Frontend: http://localhost:5173
- Backend API: http://localhost:4000

## โครงสร้างโปรเจกต์

```
budget-passbook/
├── apps/
│   ├── api/          # Express + Prisma backend
│   └── web/          # React + Vite frontend
├── packages/
│   └── shared/       # Zod schemas + TypeScript types
├── docker-compose.yml
└── .env.example
```

## API Endpoints

| Method | Path | คำอธิบาย |
|--------|------|----------|
| POST | /api/auth/register | สมัครสมาชิก |
| POST | /api/auth/login | เข้าสู่ระบบ |
| GET | /api/auth/me | ข้อมูล user ปัจจุบัน |
| GET | /api/categories | รายการหมวดหมู่ |
| GET | /api/transactions?month=YYYY-MM | รายการธุรกรรม |
| POST | /api/transactions | เพิ่มรายการ |
| PUT | /api/transactions/:id | แก้ไขรายการ |
| DELETE | /api/transactions/:id | ลบรายการ |
| GET | /api/budgets?month=YYYY-MM | งบประมาณ + ยอดใช้จริง |
| PUT | /api/budgets/:categoryId | ตั้งงบประมาณ |
| GET | /api/summary?month=YYYY-MM | สรุปยอดรายเดือน |
| GET | /api/summary/trend?months=12 | ย้อนหลัง N เดือน |
