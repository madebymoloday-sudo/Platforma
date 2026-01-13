#!/bin/bash
# Скрипт для загрузки кода на GitHub

GITHUB_TOKEN=$(cat ~/.platforma-secrets/github-token.txt)
USERNAME=$(curl -s -H "Authorization: token ${GITHUB_TOKEN}" -H "Accept: application/vnd.github.v3+json" https://api.github.com/user | python3 -c "import sys, json; print(json.load(sys.stdin)['login'])")

echo "🔗 Подключение к репозиторию: ${USERNAME}/platforma"

cd ~/Desktop/Platformа

# Настройка remote
git remote set-url origin https://${GITHUB_TOKEN}@github.com/${USERNAME}/platforma.git

# Переименование ветки
git branch -M main

# Загрузка кода
echo "📤 Загрузка кода..."
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Код успешно загружен!"
    echo "🔗 https://github.com/${USERNAME}/platforma"
else
    echo ""
    echo "❌ Ошибка загрузки"
    echo "Убедитесь, что репозиторий 'platforma' создан на GitHub"
fi
