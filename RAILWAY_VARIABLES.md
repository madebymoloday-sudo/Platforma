# 🔧 Railway Variables - Точные значения

## ✅ Ваши URL:

- **Backend:** `backend-production-30bf.up.railway.app`
- **Frontend:** `frontend-production-559d.up.railway.app`

---

## 📋 Backend Variables

Откройте **Backend** сервис → **Variables** и добавьте/обновите:

```
DATABASE_URL=<из PostgreSQL сервиса>
JWT_SECRET=6b5085b347af39ebd1d7ccdff45faa7051ca5ba07aeb747d4cc928dad0e30698
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://frontend-production-559d.up.railway.app
OPENAI_API_KEY=<ваш ключ, если есть>
```

---

## 📋 Frontend Variables

Откройте **Frontend** сервис → **Variables** и добавьте/обновите:

```
VITE_API_URL=https://backend-production-30bf.up.railway.app/api
VITE_SOCKET_URL=https://backend-production-30bf.up.railway.app
```

---

## ✅ После настройки:

1. Railway автоматически пересоберёт оба сервиса
2. Дождитесь завершения деплоя (зелёные галочки)
3. Откройте Frontend URL: https://frontend-production-559d.up.railway.app
4. Зарегистрируйте первого пользователя
5. Всё готово! 🎉

---

## 🔍 Проверка работы:

- Frontend должен открываться без ошибок
- При регистрации/входе не должно быть ошибок 502/404
- В консоли браузера не должно быть ошибок подключения к API
