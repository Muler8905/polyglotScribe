# Prisma + MySQL (Local Development)

## 1) Prerequisites

- Node.js installed
- MySQL running locally
- A MySQL database created (example: `polyglot_scribe`)

## 2) Configure environment

Create `backend/.env` (or update it) and set:

```env
DATABASE_URL=mysql://USER:PASSWORD@localhost:3306/polyglot_scribe
```

## 3) Install dependencies

```bash
cd backend
npm install
```

## 4) Create tables + seed default plans

```bash
npm run db:migrate
npm run db:seed
```

## 5) Start the backend

```bash
npm run dev
```

Health check:

```bash
curl http://localhost:5000/health
```

## Optional: Prisma Studio

```bash
cd backend
npx prisma studio
```

