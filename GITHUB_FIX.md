# 🔧 Исправление проблемы с доступом к GitHub

## Проблема
Токен не имеет прав на запись в репозиторий `madebymoloday-sudo/Platforma`.

## Решение

### Вариант 1: Обновить права токена (рекомендуется)

1. Откройте: https://github.com/settings/tokens
2. Найдите ваш токен или создайте новый
3. **Убедитесь, что выбраны права:**
   - ✅ `repo` (полный доступ к репозиториям)
   - ✅ `workflow` (если используете GitHub Actions)
4. Сохраните токен
5. Обновите токен в файле: `~/.platforma-secrets/github-token.txt`
6. Выполните: `cd ~/Desktop/Platformа && git push -u origin main`

### Вариант 2: Использовать SSH (альтернатива)

1. Создайте SSH ключ (если нет):
   ```bash
   ssh-keygen -t ed25519 -C "your_email@example.com"
   ```

2. Добавьте публичный ключ на GitHub:
   - Скопируйте: `cat ~/.ssh/id_ed25519.pub`
   - Добавьте на: https://github.com/settings/keys

3. Измените remote:
   ```bash
   cd ~/Desktop/Platformа
   git remote set-url origin git@github.com:madebymoloday-sudo/Platforma.git
   git push -u origin main
   ```

### Вариант 3: Загрузить через GitHub Desktop

1. Откройте GitHub Desktop
2. File → Add Local Repository
3. Выберите `~/Desktop/Platformа`
4. Нажмите "Publish repository"
5. Выберите репозиторий `madebymoloday-sudo/Platforma`

## Проверка

После исправления выполните:
```bash
cd ~/Desktop/Platformа
git push -u origin main
```

Если всё успешно, вы увидите:
```
Enumerating objects: X, done.
Counting objects: 100% (X/X), done.
...
To https://github.com/madebymoloday-sudo/Platforma.git
 * [new branch]      main -> main
```
