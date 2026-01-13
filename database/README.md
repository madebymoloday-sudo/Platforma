# База данных Platformа

## Настройка PostgreSQL

1. Установите PostgreSQL, если еще не установлен:
   - macOS: `brew install postgresql@14`
   - Linux: `sudo apt-get install postgresql`
   - Windows: скачайте с официального сайта

2. Создайте базу данных:
```bash
createdb platforma
```

3. Или через psql:
```bash
psql postgres
CREATE DATABASE platforma;
\q
```

4. Обновите DATABASE_URL в `backend/.env`:
```
DATABASE_URL="postgresql://ваш_пользователь:ваш_пароль@localhost:5432/platforma?schema=public"
```

## Миграции

Из папки `backend` выполните:

```bash
npm install
npx prisma generate
npx prisma migrate dev --name init
```

## Prisma Studio

Для просмотра и редактирования данных:
```bash
cd backend
npm run db:studio
```

## Структура базы данных

База данных содержит следующие основные таблицы:
- `User` - пользователи
- `LearningContent` - материалы для обучения
- `LearningProgress` - прогресс изучения
- `WorkspaceItem` - элементы рабочего пространства
- `Report` - отчёты пользователей
- `ReportForm` - настраиваемые формы отчётов
- `Chat` - чаты
- `ChatMessage` - сообщения в чатах
- `Story` - сторисы
