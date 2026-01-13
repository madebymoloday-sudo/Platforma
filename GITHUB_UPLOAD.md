# 📤 Инструкция по загрузке на GitHub

## Вариант 1: Через GitHub CLI (если установлен)

```bash
cd ~/Desktop/Platformа
gh repo create Platformа --public --source=. --remote=origin --push
```

## Вариант 2: Через веб-интерфейс GitHub

1. Откройте [GitHub](https://github.com/new)
2. Создайте новый репозиторий:
   - Название: `Platformа` (или любое другое)
   - Видимость: Public или Private
   - НЕ добавляйте README, .gitignore или лицензию (они уже есть)
3. Нажмите "Create repository"

4. Затем выполните в терминале:
```bash
cd ~/Desktop/Platformа
git remote add origin https://github.com/YOUR_USERNAME/Platformа.git
git branch -M main
git push -u origin main
```

Замените `YOUR_USERNAME` на ваш GitHub username.

## Вариант 3: Через GitHub Desktop

1. Откройте GitHub Desktop
2. File → Add Local Repository
3. Выберите папку `~/Desktop/Platformа`
4. Нажмите "Publish repository"
5. Выберите название и видимость
6. Нажмите "Publish repository"

## После загрузки

Репозиторий будет доступен по адресу:
`https://github.com/YOUR_USERNAME/Platformа`

Используйте этот URL для подключения в Railway.
