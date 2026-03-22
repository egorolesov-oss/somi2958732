# SOMI

SOMI зараз це mobile-first web MVP-прототип жіночого health product, зібраний як локальний статичний застосунок без build step.

Головна ідея продукту:

- не окремий period tracker
- не generic wellness app
- не AI-чат
- а один приватний простір для жіночого здоров'я, де все зводиться в єдиний `Журнал здоров'я`

Усі модулі працюють навколо цієї ідеї:

- `Головна` показує актуальний today-context
- `Журнал` є головною хронологією
- `Цикли` читаються з тих самих journal entries
- `Інтимне` не живе окремо, а спирається на спільну історію
- `Профіль` містить `Приватність` і `Підсумок для лікаря`

## Поточний статус

Це вже не просто статичний mockup, а інтерактивний локальний prototype з реальним локальним state, формами, редагуванням і persistence через `localStorage`.

У поточному стані вже працює:

- mobile-first shell з premium UI
- нижня навігація `Головна / Журнал / Цикли / Інтимне / Профіль`
- `+ Додати запис`
- реальні create / edit / delete flows для journal entries
- локальне збереження між перезавантаженнями
- `Журнал` як timeline
- `Цикли` з календарем, day-card і зв'язком із журналом
- `Інтимне` як окремий контекстний модуль
- `Підсумок для лікаря` як окремий profile-screen
- `Приватність` як окремий profile-screen
- тестовий UI-режим

## Продуктова рамка MVP

SOMI тримається на кількох правилах:

- один безперервний запис історії тіла замість набору розрізнених фіч
- journal-first architecture
- mobile-first interaction model
- приватність як core UX, а не додаткова опція
- контексти `base / pregnancy / recovery` визначаються journal events

У MVP свідомо не входять:

- AI chat
- community / social
- baby tracking
- великий контентний хаб
- медичні висновки або діагностичні твердження

## Технологічний формат

Проєкт спеціально тримається максимально простим:

- `index.html` — основна розмітка, app shell, dialogs
- `styles.css` — увесь visual system і mobile-first layout
- `app.js` — увесь UI state, rendering, forms, flows, navigation, local logic
- `journalRepository.js` — persistence abstraction для журналу

Build tool, bundler або framework зараз не використовуються.

Це дає:

- дуже швидку локальну ітерацію над UI
- простий запуск через локальний HTTP server
- мінімум інфраструктури на етапі product discovery

## Структура файлів

```text
SOMI/
├── README.md
├── SOMI_MVP.md
├── index.html
├── styles.css
├── app.js
├── journalRepository.js
├── SOMI_LOGO.png
└── assets/
    ├── SOMI_LOGO_cropped.png
    └── somi-logo.svg
```

## Запуск локально

З кореня проєкту:

```bash
python3 -m http.server 4173
```

Після цього відкрити:

```text
http://127.0.0.1:4173
```

Можна також відкрити:

```text
http://localhost:4173
```

Важливо:

- застосунок не варто відкривати просто як `file://`
- потрібен саме локальний HTTP server
- у `index.html` використовується version query для `app.js`, щоб Safari не тримав старий кеш

## Архітектурна ідея

### 1. Journal-first

Будь-який запис, незалежно від точки входу, повинен:

- зберегтись як journal entry
- з'явитись у спільній хронології
- за потреби вплинути на модулі `Цикли`, `Інтимне`, `Home`, `Doctor summary`

### 2. Один data model, кілька контекстів

Контексти:

- `base`
- `pregnancy`
- `recovery`

Вони не є окремими застосунками, а просто режимами тієї самої системи.

### 3. Repository abstraction

Persistence уже винесений у `journalRepository.js`.

Зараз він працює через:

- `localStorage`
- ключ `somi.journal.entries.v1`

Але API вже зроблений асинхронним:

- `listEntries(...)`
- `saveEntries(...)`

Це зроблено спеціально, щоб далі можна було замінити local implementation на Supabase repository без повного переписування UI.

## Модель запису

Поточний normalized journal entry:

```js
{
  id: string,
  type: string,
  title: string,
  value: string,
  note: string,
  date: string,
  tags: string[],
  context: string
}
```

Нормалізація зараз гарантує:

- string ids
- string dates
- array tags
- legacy scale conversion `x/5 -> x/10`

ID зараз створюється через:

- `crypto.randomUUID()` якщо доступно
- fallback на локальний generated id

## Екрани

### Головна

`Home` уже не дублює `+ Додати запис`.

Зараз екран побудований навколо:

- hero зі статусом контексту
- `Сьогодні`
- `Потребує уваги`
- `Зріз за 30 днів`
- `Для лікаря`

Частина цих блоків уже читає реальні дані:

- записи за сьогодні
- cycle context
- symptom-like entries
- doctor-like entries

### Журнал

`Журнал` — це головна timeline-хронологія продукту.

Що вже є:

- повна дата і час у картках
- vertical timeline line
- іконка типу запису біля кожної картки
- pastel-coded cards за типом запису
- фільтри
- detail bottom sheet
- редагування
- видалення

Типи записів, які вже використовуються в системі:

- `symptom`
- `pain`
- `bleeding`
- `mood`
- `sleep`
- `note`
- `appointment`
- `question`
- `analysis`
- `document`
- `cycle_start`
- `cycle_end`
- `pregnancy_confirmed`
- `birth`
- `pregnancy_end`
- `recovery_end`

### Цикли

`Цикли` вже не є статичним блоком.

Що там працює:

- календар місяця
- навігація між місяцями
- позначення `start / bleeding / pain / end`
- видимий період циклу
- day card по кліку на день
- швидкі дії для обраної дати
- історія циклів
- overview metrics

Логіка циклу зараз читається із journal entries:

- `cycle_start`
- `cycle_end`
- `bleeding`
- `pain`

### Інтимне

`Інтимне` — це окремий screen, але не окреме джерело істини.

Що вже є:

- hero і метрики
- quick actions
- сигнали й патерни
- останні записи
- блок під doctor summary

Нові записи з цього модуля отримують правильні `intimate` tags.

### Профіль

У `Профіль` уже винесені:

- `Приватність і безпека`
- `Підсумок для лікаря`
- `Тест UI`

#### Privacy screen

Зараз це окремий screen у `Профіль`.

Що в ньому вже є:

- статус захисту
- доступ і екран
- сповіщення
- дані і контроль

Зараз це demo-state UX, але screen уже існує як повноцінна частина продукту.

#### Doctor summary screen

`Підсумок для лікаря` вже не toast.

Зараз це окремий profile-screen, який показує:

- готовність до візиту
- цикл
- останній symptom-like signal
- останній медичний крок
- повторюваність інтимних сигналів
- останні symptom entries
- матеріали до візиту

Це поки ще preview, а не фінальний export flow, але вже справжній екран з live-даними.

## Add record flow

У застосунку є два пов'язані шари:

### 1. Composer `Додати запис`

Це компактний modal/sheet із групами:

- `Швидко`
- `Медичне`
- `Події`

Кнопки:

- однакового розміру
- з іконкою та текстом
- вирівняні по лівому краю

Під час відкриття composer:

- блокується scroll фонового екрана

### 2. Record form

Після вибору action відкривається форма запису.

У формах зараз уже є structured input patterns:

- `Біль`
- `Кровотеча`
- `Симптом`
- `Настрій`
- `Сон`
- `Початок циклу`
- `Завершення циклу`
- частково `Інтимне`

## Structured forms

### Загальний принцип

Форма має спільне ядро, а контекст модуля тільки додає специфічні поля.

Наприклад:

- `Біль` лишається `Біль`
- `Симптом` лишається `Симптом`

Контекст:

- `Журнал`
- `Цикли`
- `Інтимне`

не створює іншу сутність, а лише додає правильний тег і додаткові поля.

### Slider-логіка

Ключові шкальні записи переведені на `1-10` slider:

- `Біль`
- `Кровотеча`
- `Симптом`
- `Настрій`
- `Сон` як quality scale

Важливо:

- у slider не використовуються універсальні однакові лейбли
- кожна картка має власний 10-рівневий словник значень

Приклади:

- `Настрій` має власну емоційну шкалу
- `Біль` має власну шкалу інтенсивності
- `Кровотеча` має власну шкалу потоку
- `Сон` має власну шкалу якості сну

### Порядок полів

Форми були свідомо перебудовані:

- перше головне структуроване поле
- другим іде `Короткий опис`
- далі інші допоміжні поля

Це стосується structured forms, де є extra-fields.

### Sleep form

`Сон` уже працює як окрема структурована форма:

- тривалість
- якість
- пробудження
- короткий опис
- нотатка

### Edit flow

`Редагувати` відкриває ті самі форми, що й `create`.

Працює:

- prefill існуючих значень
- оновлення запису без створення дубліката
- повторне збереження в local state + persistence

## Persistence

Поточне джерело збереження:

- `window.localStorage`

Поточний ключ:

```text
somi.journal.entries.v1
```

Що зберігається:

- journal entries

Що важливо:

- записи не зникають після reload
- create / edit / delete впливають на persistent state
- legacy `x/5` scales при читанні нормалізуються до `x/10`

## UI test mode

У `Профіль` є `Тест UI`.

Він потрібен для швидкої перевірки:

- контекстів `auto / pregnancy / recovery`
- `default / rich / empty` data mode
- long text stress test

Це корисно для:

- перевірки переносів
- empty states
- stress test екранів
- візуального аудиту на вузьких viewport

## Event handling

У застосунку вже був окремо відловлений класичний баг із задвоєннями listeners.

Поточний підхід:

- централізований delegated click handling
- окремі top-level listeners тільки там, де це справді потрібно
- додатковий антидубль-захист на рівні додавання action

Це важливо, бо раніше деякі cycle actions могли створювати дублікати записів.

## Що вже реально працює

### CRUD / state

- create entry
- edit entry
- delete entry
- persistence після reload

### Journal

- timeline
- filter chips
- detail sheet

### Cycles

- day selection
- calendar markers
- day card
- month navigation

### Intimate

- quick actions
- pattern-oriented overview

### Profile

- privacy screen
- doctor summary screen
- test UI

## Що ще лишається demo або незавершеним

Попри великий обсяг уже зробленого, це ще не production app.

Наразі ще не завершено:

- справжній backend
- auth / onboarding
- реальний Supabase integration
- file upload pipeline
- реальний export generation
- toggle-based privacy settings з постійним збереженням
- appointments як окрема повна підсистема
- documents vault як окремий завершений модуль
- production-grade accessibility / validation pass
- tests

## Підготовка до Supabase

Проєкт уже трохи підготовлений до переїзду на Supabase:

- persistence винесений в окремий repository
- UI не звертається напряму до `localStorage`
- IDs уже string-based
- модель запису нормалізована
- async API repository уже існує

Що, ймовірно, буде далі при переході:

1. заміна `journalRepository` на Supabase-backed implementation
2. винесення таблиці `journal_entries`
3. auth
4. row-level security
5. documents storage
6. export / doctor summary backend support

## Відомі обмеження

- це SPA без router library
- рендер зараз рядковий, через template strings
- великий шмат логіки живе в одному `app.js`
- немає автоматичних тестів
- немає build pipeline
- частина текстів і flows ще перебуває в активному продуктово-дизайнерському шліфуванні

## Рекомендований наступний крок

Якщо продовжувати розробку від поточного стану, найкращий порядок такий:

1. довести `Doctor summary` до export-ready flow
2. оформити `Documents / records vault`
3. винести репозиторії під Supabase
4. додати auth / onboarding
5. покрити критичні flows тестами

## Коротко про код

### Основні точки входу

- [index.html](/Users/egorolesov/ITPROJECTS/SOMI/index.html)
- [styles.css](/Users/egorolesov/ITPROJECTS/SOMI/styles.css)
- [app.js](/Users/egorolesov/ITPROJECTS/SOMI/app.js)
- [journalRepository.js](/Users/egorolesov/ITPROJECTS/SOMI/journalRepository.js)

### Ключові рендер-функції в `app.js`

- `renderHome()`
- `renderJournal()`
- `renderCycles()`
- `renderIntimate()`
- `renderProfileMain()`
- `renderDoctorSummaryScreen()`
- `renderPrivacyProfileScreen()`

### Ключові UI sheets / dialogs

- `composerSheet`
- `recordFormSheet`
- `entryDetailSheet`
- `cycleDaySheet`
- `testSheet`

## Нотатка

README описує стан проєкту по факту поточної реалізації, а не абстрактний задум із `SOMI_MVP.md`.

Тобто це документ про:

- що вже реально працює
- як це організовано в коді
- як це запускати
- куди це розвивати далі
