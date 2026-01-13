# Platformа - Платформа обучения и сообщества

Комплексная платформа с модулями обучения, рабочего пространства, сообщества, чатов и видеоконференций.

## 🚀 Быстрый старт (Локально)

### Требования
- Node.js 18+
- PostgreSQL 14+
- npm или yarn

### Установка

1. **Клонировать репозиторий**
```bash
git clone <repository-url>
cd Platformа
```

2. **Настроить Backend**
```bash
cd backend
npm install
cp .env.example .env
# Отредактируйте .env файл
npx prisma generate
npx prisma migrate dev
npm run dev
```

3. **Настроить Frontend**
```bash
cd frontend
npm install
npm run dev
```

## 🌐 Развертывание на Railway

### Подготовка

1. Создайте 3 сервиса на Railway:
   - PostgreSQL (база данных)
   - Backend (Node.js)
   - Frontend (Node.js)

### База данных (PostgreSQL)

1. Создайте новый сервис "PostgreSQL" на Railway
2. Railway автоматически создаст базу данных
3. Скопируйте `DATABASE_URL` из переменных окружения

### Backend

1. **Создайте сервис "Backend"**
2. **Подключите GitHub репозиторий**
3. **Настройте переменные окружения:**
   ```
   DATABASE_URL=<из PostgreSQL сервиса>
   JWT_SECRET=<случайная строка>
   PORT=3001
   OPENAI_API_KEY=<ваш OpenAI ключ>
   NODE_ENV=production
   ```
4. **Настройте Root Directory:** `backend`
5. **Настройте Start Command:** `npm start`
6. **Build Command:** `npm run build`

### Frontend

1. **Создайте сервис "Frontend"**
2. **Подключите GitHub репозиторий**
3. **Настройте переменные окружения:**
   ```
   VITE_API_URL=<URL вашего backend сервиса>
   ```
4. **Настройте Root Directory:** `frontend`
5. **Настройте Start Command:** `npm run preview`
6. **Build Command:** `npm run build`

### Дополнительные настройки

- В `frontend/src/api/client.ts` обновите `baseURL` на URL вашего backend
- В `backend/src/server.ts` обновите CORS origin на URL вашего frontend

## 📁 Структура проекта

```
Platformа/
├── backend/          # Node.js + Express + TypeScript
├── frontend/         # React + TypeScript + Vite
├── database/         # PostgreSQL схемы
└── README.md
```

## 🔧 Технологии

- **Backend:** Node.js, Express, TypeScript, Prisma, PostgreSQL, Socket.IO
- **Frontend:** React, TypeScript, Vite, Socket.IO Client
- **База данных:** PostgreSQL
- **Видеоконференции:** WebRTC

## 📝 Лицензия

MIT
