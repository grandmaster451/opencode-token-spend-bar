# 📦 Публикация плагина в NPM и GitHub

## Быстрый старт для пользователей

### Установка (30 секунд)

```bash
# Установка глобально (рекомендуется)
npm install -g opencode-token-spend-bar

# Или локально в OpenCode
npm install opencode-token-spend-bar
```

### Подключение к OpenCode

Отредактируй `~/.config/opencode/opencode.json`:

```json
{
  "plugin": [
    "opencode-token-spend-bar"
  ]
}
```

Перезапусти OpenCode - готово! 🎉

---

## 🚀 Для разработчиков: Публикация плагина

### Шаг 1: Создание GitHub репозитория

1. Зайди на [github.com/new](https://github.com/new)
2. Название: `opencode-token-spend-bar`
3. Описание: `Track your AI API costs in real-time inside OpenCode`
4. Сделай публичным
5. **НЕ** инициализируй README (у нас уже есть)
6. Создай репозиторий

### Шаг 2: Загрузка кода

```bash
# Перейди в папку проекта
cd opencode-token-spend-bar

# Добавь remote (замени YOUR_USERNAME на свой)
git remote add origin https://github.com/YOUR_USERNAME/opencode-token-spend-bar.git

# Запушь код
git push -u origin master
```

### Шаг 3: Публикация в NPM

```bash
# Войди в NPM аккаунт (если еще не вошел)
npm login

# Проверь что всё собирается
npm run build
npm test

# Опубликуй
npm publish
```

### Шаг 4: Настройка GitHub Actions

1. Зайди в Settings → Secrets and variables → Actions
2. Добавь `NPM_TOKEN` с токеном от npmjs.com

### Шаг 5: Создание релиза

```bash
# Создай тег
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

GitHub Actions автоматически опубликует в NPM!

---

## 📋 Чек-лист перед публикацией

- [ ] Все тесты проходят (`npm test`)
- [ ] Сборка успешна (`npm run build`)
- [ ] Линтер не ругается (`npm run lint`)
- [ ] Версия в `package.json` обновлена
- [ ] `CHANGELOG.md` актуален
- [ ] `README.md` содержит актуальную документацию
- [ ] GitHub репозиторий создан
- [ ] NPM токен добавлен в GitHub Secrets

---

## 🔧 Технические детали

### package.json

Ключевые поля для публикации:

```json
{
  "name": "opencode-token-spend-bar",
  "version": "1.0.0",
  "description": "Track your AI API costs in real-time inside OpenCode",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": [
    "dist/",
    "examples/",
    "README.md",
    "LICENSE"
  ],
  "repository": {
    "type": "git",
    "url": "git+https://github.com/YOUR_USERNAME/opencode-token-spend-bar.git"
  }
}
```

### Peer Dependencies

Плагин использует peer dependencies от OpenCode:

```json
"peerDependencies": {
  "@opencode-ai/plugin": "^1.3.16",
  "@opencode-ai/sdk": "^1.0.0",
  "solid-js": "^1.8.0"
}
```

Это означает, что OpenCode должен предоставить эти пакеты.

---

## 📂 Структура репозитория

```
opencode-token-spend-bar/
├── .github/
│   ├── workflows/
│   │   └── ci.yml              # CI/CD pipeline
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.yml      # Шаблон бага
│   │   └── feature_request.yml # Шаблон фичи
│   └── pull_request_template.md
├── src/                        # Исходный код
├── test/                       # Тесты
├── dist/                       # Собранный плагин
├── examples/                   # Примеры конфигов
├── CHANGELOG.md                # История изменений
├── CONTRIBUTING.md             # Гайд для контрибьюторов
├── LICENSE                     # MIT лицензия
├── README.md                   # Документация
└── package.json                # Конфиг npm
```

---

## 🔄 Обновление версии

### Semantic Versioning

- **MAJOR** (1.0.0 → 2.0.0): Ломающие изменения
- **MINOR** (1.0.0 → 1.1.0): Новые фичи
- **PATCH** (1.0.0 → 1.0.1): Багфиксы

### Процесс обновления

```bash
# 1. Обнови версию
npm version patch  # или minor, или major

# 2. Обнови CHANGELOG.md

# 3. Сделай коммит
git add .
git commit -m "chore: release v1.0.1"

# 4. Создай тег
git tag -a v1.0.1 -m "Release v1.0.1"

# 5. Запушь
git push origin master --tags
```

GitHub Actions автоматически опубликует новую версию!

---

## 🆘 Troubleshooting

### Ошибка: "You must be logged in"

```bash
npm login
# Введи логин, пароль и email
```

### Ошибка: "Package name already exists"

Пакет с таким именем уже существует. Нужно:
1. Изменить имя в `package.json`
2. Или получить доступ к существующему пакету

### Ошибка: "Cannot publish over previously published version"

```bash
# Обнови версию
npm version patch
npm publish
```

---

## 📝 Полезные ссылки

- [NPM Publishing Guide](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [OpenCode Plugin Documentation](https://opencode.ai/docs/plugins)
- [Semantic Versioning](https://semver.org/)

---

## 💡 Советы

1. **Всегда тестируй перед публикацией**: `npm run qa:full`
2. **Пиши changelog**: Пользователи должны знать что изменилось
3. **Используй теги**: `npm install opencode-token-spend-bar@latest`
4. **Отвечай на issues**: Быстрая обратная связь = довольные пользователи

---

**Готово к публикации!** 🚀

После публикации плагин будет доступен для установки как:
```bash
npm install opencode-token-spend-bar
```