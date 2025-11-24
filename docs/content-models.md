# Модели контента в Strapi

Черновик структуры контента для юридического факультета. Названия коллекций и полей — рабочие, могут уточняться по мере внедрения.

---

## 1. News (Новости)

**Коллекция:** `news`

Предназначена для новостей факультета: объявления, отчёты о мероприятиях, важные события.

**Поля (первичный вариант):**

- `title` (string) — заголовок новости.
- `slug` (UID) — человекочитаемый URL (генерируется из title).
- `summary` (text) — краткое описание / лид.
- `body` (rich text) — основной текст новости.
- `coverImage` (media, single) — обложка / главное фото.
- `gallery` (media, multiple) — дополнительные фото.
- `publishedAt` (datetime) — дата и время публикации.
- `category` (enumeration или отдельная коллекция) — тип новости (например: "Объявление", "Мероприятие", "Научная жизнь").
- `department` (relation) — связь с кафедрой (если новость относится к конкретной кафедре).
- `isFeatured` (boolean) — флаг "вывести на главную" / "важная новость".
- `attachments` (media, multiple) — вложения (PDF, DOC, презентации).

---

## 2. Events (Мероприятия)

**Коллекция:** `events`

Мероприятия, конференции, круглые столы, олимпиады и т.п.

**Поля:**

- `title` (string) — название мероприятия.
- `slug` (UID) — URL.
- `description` (rich text) — подробное описание.
- `startDate` (datetime) — дата и время начала.
- `endDate` (datetime, optional) — дата и время окончания.
- `location` (string) — место проведения (аудитория, адрес, онлайн-платформа).
- `isOnline` (boolean) — офлайн/онлайн.
- `registrationLink` (string, optional) — ссылка для регистрации.
- `department` (relation) — организующая кафедра/подразделение.
- `attachments` (media, multiple) — программа, положение, прочие документы.
- `publishedAt` (datetime) — дата публикации информации о мероприятии.

---

## 3. Departments (Кафедры / Подразделения)

**Коллекция:** `departments`

Кафедры, центры, лаборатории, иные структурные единицы.

**Поля:**

- `name` (string) — название кафедры/подразделения.
- `slug` (UID) — URL.
- `shortName` (string, optional) — краткое название.
- `description` (rich text) — краткая информация.
- `pageBody` (rich text) — основной текст для страницы кафедры (история, структура, направления).
- `email` (string, optional) — контактный e-mail.
- `phone` (string, optional) — контактный телефон.
- `office` (string, optional) — кабинет, адрес.
- `staff` (relation, many) — сотрудники кафедры.
- `order` (integer) — порядок сортировки в списках.

---

## 4. Staff (Сотрудники / Преподаватели)

**Коллекция:** `staff`

Преподаватели, научные сотрудники, администрация факультета.

**Поля:**

- `fullName` (string) — ФИО.
- `slug` (UID) — URL.
- `position` (string) — должность (доцент, профессор, ассистент, заведующий кафедрой и т.д.).
- `degree` (string, optional) — учёная степень (канд. юрид. наук, д-р юрид. наук).
- `rank` (string, optional) — учёное звание (доцент, профессор).
- `department` (relation) — кафедра/подразделение.
- `photo` (media, single) — фотография.
- `bio` (rich text) — краткая биография / информация.
- `researchAreas` (text или JSON) — научные интересы.
- `disciplines` (text) — преподаваемые дисциплины.
- `email` (string, optional) — рабочий e-mail.
- `order` (integer) — порядок сортировки на странице кафедры.

---

## 5. Documents (Документы)

**Коллекция:** `documents`

Нормативные, локальные акты, положения, регламенты, расписания, сборники и т.п.

**Поля:**

- `title` (string) — название документа.
- `slug` (UID) — URL.
- `category` (string или relation) — тип документа (например: "Положение", "Расписание", "Учебный план").
- `description` (text, optional) — краткое описание / комментарий.
- `file` (media, single) — файл (PDF, DOC, XLS и т.п.).
- `publishedAt` (datetime) — дата публикации на сайте.
- `validFrom` (date, optional) — дата введения в действие.
- `validTo` (date, optional) — дата окончания действия (если есть).
- `department` (relation, optional) — если документ привязан к конкретной кафедре.
- `tags` (text или JSON) — ключевые слова для поиска.

---

## 6. Общие замечания

- Технические названия полей делаем по-английски (для API), подписи в админке могут быть русскими.
- UID (`slug`) важен для SEO-дружелюбных URL и хорошо ложится в Next.js роутинг.
- Relations:
  - News → Department (many-to-one)
  - Events → Department (many-to-one)
  - Staff → Department (many-to-one)
  - Documents → Department (optional, many-to-one)

Структура будет уточняться после первых итераций с реальными данными и макетами страниц.
