# exnex
Веб-платформа объявлений (marketplace), аналог Avito. 
Простой сервис размещения объявлений с веб-интерфейсом и REST API.
Реализует публикацию объявлений, поиск, фильтрацию, категории, пользовательские профили и базовую инфраструктуру для сделок.


## Функциональность

### Реализовано
- Регистрация с валидацией email и пароля
- Вход с проверкой пароля
- Хеширование паролей (bcrypt)
- JWT токены для авторизации
- Защищенные маршруты
- Отладочный веб-интерфейс для взаимодействия
- Добавление/удаление объявлений в избранное
- Просмотр избранного пользователя
- Валидация уникальности (нельзя добавить дважды)
- REST API для мобильных приложений
- Пагинация объявлений

### Технологии
- **Backend:** Node.js + Express
- **База данных:** PostgreSQL
- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **API:** RESTful

## Установка и запуск

### 1. Предварительные требования
- [Node.js](https://nodejs.org/) (v18+)
- [PostgreSQL](https://www.postgresql.org/) (v15+)
- [Git](https://git-scm.com/)

### 2. Клонирование репозитория
```bash
git clone <https://github.com/Marladon/exnex>
cd exnex-backend
```

### 3. Настройка базы данных
- Установите PostgreSQL и создайте базу данных: ```CREATE DATABASE exnex_db;```
- Настройте подключение в файле db.js:
```bash
const pool = new Pool({
  user: 'your_username',
  password: 'your_password',
  host: 'localhost',
  database: 'exnex_db',
  port: 5432,
});
```
- Установка зависимостей 
```bash
npm install
npm install express pg
npm install bcrypt jsonwebtoken multer
npm install socket.io
```
- Инициализация базы данных
```bash
-- Выполните SQL из файла init.sql в pgAdmin
-- Или запустите: node init-db.js
```
- Запуск сервера ```node server.js```
**Сервер запустится на http://localhost:3000**

## API Endpoints

### Аутентификация
- ```POST /api/auth/register``` - Регистрация
- ```POST /api/auth/login``` - Вход

### Объявления
- ```GET /api/ads``` - Список объявлений
- ```POST /api/ads``` - Создание объявления
- ```GET /api/ads/:id``` - Получение объявления

### Категории
- ```GET /api/categories``` - Все категории
- ```GET /api/categories/tree``` - Иерархия категорий

### Избранное
- ```POST /api/favorites/:ad_id``` - Добавить в избранное
- ```DELETE /api/favorites/:ad_id``` - Удалить из избранного
- ```GET /api/favorites``` - Получить избранное пользователя
- ```GET /api/favorites/check/:ad_id``` - Проверить статус

### Веб-интерфейс
После запуска откройте http://localhost:3000

- Вход - войдите в учетную запись
- Регистрация - создайте аккаунт
- Создание объявления - заполните форму
- Просмотр - все объявления на главной
- Избранное - добавьте\удалите объявление из списка