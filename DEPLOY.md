# 🚀 Деплой на GitHub Pages

## Автоматический деплой (рекомендуется)

### Шаг 1: Создайте репозиторий на GitHub

1. Зайдите на [github.com](https://github.com)
2. Нажмите **"New repository"**
3. Назовите репозиторий (например, `kozyr`)
4. Выберите **Public** (для GitHub Pages)
5. Нажмите **"Create repository"**

### Шаг 2: Загрузите код

```bash
# Инициализируйте git в папке проекта
git init

# Добавьте все файлы
git add .

# Сделайте первый коммит
git commit -m "Initial commit"

# Добавьте удалённый репозиторий
git branch -M main
git remote add origin https://github.com/<ваш-username>/<название-репозитория>.git

# Запушьте код
git push -u origin main
```

### Шаг 3: Настройте GitHub Pages

1. Перейдите в ваш репозиторий на GitHub
2. Откройте **Settings** (Настройки)
3. В левом меню найдите **Pages**
4. В разделе **Source** выберите **GitHub Actions**
5. Сохраните настройки

### Шаг 4: Дождитесь деплоя

GitHub Actions автоматически:
- Соберёт проект при каждом пуше в `main`
- Задеплоит на GitHub Pages
- Покажет статус в разделе **Actions**

### Шаг 5: Откройте игру

Через 1-2 минуты после деплоя игра будет доступна по адресу:

```
https://<ваш-username>.github.io/<название-репозитория>/
```

Например: `https://ivanov.github.io/kozyr/`

## Ручной деплой (альтернатива)

Если не хотите использовать GitHub Actions:

```bash
# Соберите проект для GitHub Pages
npm run build:gh

# Создайте ветку gh-pages
git checkout -b gh-pages

# Добавьте только папку dist
git add -f dist/

# Сделайте коммит
git commit -m "Deploy to GitHub Pages"

# Запушьте ветку
git push origin gh-pages --force

# Вернитесь в main
git checkout main
```

Затем в настройках GitHub Pages:
1. **Source** → **Deploy from a branch**
2. **Branch** → выберите `gh-pages` и папку `/ (root)`
3. **Save**

## Обновление сайта

Просто запушьте изменения в `main`:

```bash
git add .
git commit -m "Update"
git push
```

GitHub Actions автоматически пересоберёт и задеплоит сайт.

## Кастомный домен (опционально)

Если хотите использовать свой домен:

1. В **Settings → Pages** введите домен (например, `kozyr.example.com`)
2. Добавьте CNAME-запись у вашего регистратора:
   ```
   Type: CNAME
   Host: kozyr
   Value: <ваш-username>.github.io
   ```
3. Создайте файл `CNAME` в корне репозитория с содержимым:
   ```
   kozyr.example.com
   ```

## Устранение неполадок

### Сайт не открывается

- Подождите 2-3 минуты после деплоя
- Проверьте, что в **Settings → Pages** выбран правильный источник
- Убедитесь, что GitHub Actions завершился успешно (зелёная галочка)

### 404 ошибка

- Проверьте, что репозиторий **публичный**
- Убедитесь, что в настройках Pages выбран **GitHub Actions** или правильная ветка
- Проверьте URL: должен быть `https://<username>.github.io/<repo>/`

### Белый экран

- Откройте консоль браузера (F12) и проверьте ошибки
- Убедитесь, что `base` в `vite.config.js` установлен правильно
- Для репозитория `kozyr` должно быть `base: '/kozyr/'`

### Карты не загружаются

- Проверьте, что папка `public/` загружена в репозиторий
- Убедитесь, что пути к изображениям относительные

## Локальная проверка перед деплоем

```bash
# Соберите проект
npm run build:gh

# Запустите локальный сервер для проверки
npx vite preview --port 9000

# Откройте http://localhost:9000/<название-репозитория>/
```

Если всё работает локально — деплой пройдёт успешно.

## Полезные ссылки

- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [Vite Static Deploy Guide](https://vitejs.dev/guide/static-deploy.html)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

---

**Готово!** Теперь ваша игра доступна всему миру 🌍
