# SOMI

Приватний mobile-first MVP жіночого health-додатку з єдиним Журналом здоров'я.

## Стек

Vanilla JS, без build tools / фреймворків. 4 файли:

- `index.html` — shell, dialogs (composer, record form, entry detail, cycle day, test UI)
- `styles.css` — premium UI, warm palette, glassmorphism
- `app.js` — уся логіка: state, rendering, forms, navigation, CRUD
- `journalRepository.js` — persistence (localStorage, async API ready for Supabase)

## Запуск

```bash
python3 -m http.server 4173
```

Відкрити http://127.0.0.1:4173. Не відкривати як `file://`.

Cache busting: version query в `index.html` для `app.js` і `styles.css`. При змінах інкрементувати `v=` параметр.

## Архітектура

### Journal-first

Будь-який запис (цикл, інтимне, біль, ліки) зберігається як journal entry і з'являється в спільній хронології.

### Контексти

`base / pregnancy / recovery` — визначаються journal events (`pregnancy_confirmed`, `birth`, `recovery_end`), не ручним перемикачем.

### Repository abstraction

`journalRepository.js` — async API (`listEntries`, `saveEntries`). Зараз localStorage, підготовлений до заміни на Supabase.

### State

Один об'єкт `state` в `app.js`. Рендер — повний перемалювання `app.innerHTML` при кожній зміні.

### Delegated click handling

Єдиний `document.addEventListener("click", handleDelegatedClick)` обробляє всі data-* атрибути.

## Модель запису

```js
{ id, type, title, value, note, date, tags, context, attachment }
```

Типи: `symptom`, `pain`, `bleeding`, `discharge`, `mood`, `sleep`, `energy`, `libido`, `medication`, `note`, `appointment`, `question`, `analysis`, `document`, `cycle_start`, `cycle_end`, `pregnancy_confirmed`, `birth`, `pregnancy_end`, `recovery_end`.

## Навігація

5 табів: Головна / Журнал / Цикли / Інтимне / Профіль.

Profile sub-screens: `main`, `privacy`, `summary`, `vault`.

## Ключові рендер-функції

- `renderHome()`, `renderJournal()`, `renderCycles()`, `renderIntimate()`, `renderProfile()`
- `renderDoctorSummaryScreen()`, `renderPrivacyProfileScreen()`, `renderDocumentsVaultScreen()`
- `renderComposerActions()` — кнопки в sheet "Додати запис"
- `getRecordFormConfig()` — structured forms зі sliders для кожного типу

## Правила розробки

- Мова інтерфейсу: українська
- Mobile-first (max-width: 460px shell)
- Тексти в UI мають бути user-centric, лаконічні (не "маніфест продукту")
- Новий цикл не можна створити поки не закритий попередній
- Календар циклу: квадратні клітинки, сьогодні = золота обводка, in-cycle = теплий beige, start = accent, end = зелений
- FAB "Додати запис" згортається до "+" при scroll
- Composer: Швидко (10 типів) / Медичне (4) / Події (6)
- Doctor summary: хронологія симптомів, тривалість кровотечі в днях, variance/регулярність циклу
- Export: HTML файл з таблицями для друку
- Пошук у журналі: input field, фільтрація по title/value/note

## Що ще не зроблено

- Backend / Supabase
- Auth / onboarding
- Welcome screen для тестерів
- PWA manifest
- Реальний file storage (зараз dataUrl в localStorage)
- Toggle-based privacy settings з persistence
- Tests
