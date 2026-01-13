# Инструкция по запуску Platformа

## Шаг 1: Установка PostgreSQL

Убедитесь, что PostgreSQL установлен и запущен:
```bash
# macOS
brew install postgresql@14
brew services start postgresql@14

# Linux
sudo apt-get install postgresql
sudo systemctl start postgresql

# Windows
# Скачайте с https://www.postgresql.org/download/windows/
```

## Шаг 2: Создание базы данных

```bash
createdb platforma
# или через psql:
psql postgres
CREATE DATABASE platforma;
\q
```

## Шаг 3: Настройка Backend

```bash
cd backend
npm install

# Создайте файл .env
cp .env.example .env
# Отредактируйте .env и укажите свои данные

# Генерация Prisma клиента и миграции
npx prisma generate
npx prisma migrate dev --name init
```

## Шаг 4: Настройка Frontend

```bash
cd frontend
npm install
```

## Шаг 5: Запуск

**Терминал 1 (Backend):**
```bash
cd backend
npm run dev
```

**Терминал 2 (Frontend):**
```bash
cd frontend
npm run dev
```

## Шаг 6: Открыть в браузере

Откройте http://localhost:5173

## Первый пользователь

Зарегистрируйтесь через форму входа - это создаст первого пользователя в системе.

## Добавление контента для обучения

Используйте Prisma Studio:
```bash
cd backend
npm run db:studio
```

Или добавьте через SQL напрямую в таблицу `LearningContent`.
