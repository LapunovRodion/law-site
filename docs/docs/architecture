# Архитектура проекта law-site

## 1. Общая идея

Проект — новый сайт юридического факультета на основе headless-архитектуры:

- Strapi 5 выступает как CMS и API.
- Next.js + TypeScript + Tailwind — публичный сайт.
- PostgreSQL — основная база данных.
- Docker и docker-compose используются для развёртывания сервисов.
- На продакшене планируется Nginx как reverse proxy и точка входа с HTTPS.

## 2. Компоненты

### Frontend (`/frontend`)

- Next.js (React) + TypeScript.
- Tailwind CSS для стилизации.
- Получает данные из Strapi по REST API (возможен переход на GraphQL при необходимости).
- Использует переменную окружения `NEXT_PUBLIC_STRAPI_URL` для указания базового URL API.

### Backend / CMS (`/backend`)

- Strapi 5 (Node.js, TypeScript).
- Подключён к PostgreSQL (через переменные окружения).
- Хранит модели контента:
  - News
  - Events
  - Departments
  - Staff
  - Documents
- Отдаёт публичные эндпоинты (find / findOne) для фронтенда.

### База данных

- PostgreSQL в отдельном контейнере.
- Рабочая БД: `lawdb`.
- Пользователь: `lawuser`.
- Пароль: `strongpass` (локальное значение, на проде будет изменено).

### Инфраструктура (`/stack`)

- docker-compose.yml для локального развёртывания PostgreSQL и дальнейшего общего стека.
- В перспективе:
  - сервисы для frontend, backend, nginx;
  - общая сеть между контейнерами;
  - отдельные volume для данных БД и статических файлов.

## 3. Схема работы локально

1. Поднимается контейнер PostgreSQL через docker-compose (каталог `/stack`).
2. Strapi (`/backend`) подключается к PostgreSQL и поднимает админку на `http://localhost:1337/admin`.
3. Next.js (`/frontend`) поднимает dev-сервер на `http://localhost:3000` и ходит за данными в Strapi по REST API.

## 4. Продакшен (план)

Целевая схема:

- Nginx:
  - принимает HTTP/HTTPS-трафик;
  - проксирует запросы на:
    - frontend-контейнер (Next.js build/SSR или статический экспорт);
    - backend-контейнер (Strapi API).
- Strapi (backend):
  - крутится в Docker-контейнере;
  - подключён к продовой PostgreSQL (отдельный volume, регулярные бэкапы).
- Frontend:
  - либо как отдельный контейнер с Next.js (production build);
  - либо как статически сгенерированный фронт, отдаваемый Nginx.
- База данных:
  - отдельный контейнер PostgreSQL;
  - доступ ограничен только внутренней сетью Docker.

Детали деплоя (конкретный docker-compose, конфигурации Nginx, настройка HTTPS) будут оформлены в отдельном документе `docs/deploy.md` по мере реализации.
