import { createJournalEntryId, journalRepository, normalizeJournalEntry } from "./journalRepository.js";

const DAY_MS = 1000 * 60 * 60 * 24;
const MAX_ATTACHMENT_SIZE_BYTES = 2 * 1024 * 1024;

const tabs = [
  { id: "home", label: "Головна", icon: "home" },
  { id: "journal", label: "Журнал", icon: "journal" },
  { id: "cycles", label: "Цикли", icon: "cycle" },
  { id: "intimate", label: "Інтимне", icon: "intimate" },
  { id: "profile", label: "Профіль", icon: "profile" },
];

const typeLabels = {
  symptom: "Симптом",
  pain: "Біль",
  bleeding: "Кровотеча",
  discharge: "Виділення",
  mood: "Настрій",
  sleep: "Сон",
  energy: "Енергія",
  libido: "Лібідо / секс",
  medication: "Ліки / добавки",
  note: "Нотатка",
  appointment: "Прийом",
  question: "Питання",
  analysis: "Аналіз",
  document: "Документ",
  cycle_start: "Початок циклу",
  cycle_end: "Завершення циклу",
  pregnancy_confirmed: "Підтвердження вагітності",
  birth: "Пологи",
  pregnancy_end: "Завершення вагітності",
  recovery_end: "Завершення відновлення",
};

const contextLabels = {
  base: "Базовий режим",
  pregnancy: "Вагітність",
  recovery: "Відновлення",
};

const iconByType = {
  symptom: "spark",
  pain: "pain",
  bleeding: "drop",
  discharge: "discharge",
  mood: "mood",
  sleep: "sleep",
  energy: "energy",
  libido: "intimate",
  medication: "medication",
  note: "note",
  appointment: "calendar",
  question: "question",
  analysis: "document",
  document: "attachment",
  cycle_start: "cycle",
  cycle_end: "cycle",
  pregnancy_confirmed: "pregnancy",
  birth: "recovery",
  pregnancy_end: "pregnancy",
  recovery_end: "recovery",
};

const actionCatalog = {
  quick: [
    { type: "symptom", title: "Симптом", note: "Швидко зафіксувати нудоту, втому або головний біль", value: "4/10" },
    { type: "pain", title: "Біль", note: "Тазовий біль, спазми або чутливість", value: "6/10" },
    { type: "bleeding", title: "Кровотеча", note: "Легка, середня або рясна інтенсивність", value: "6/10" },
    { type: "mood", title: "Настрій", note: "Відмітити емоційний стан на сьогодні", value: "7/10" },
    { type: "sleep", title: "Сон", note: "Тривалість, якість і пробудження", value: "7.5 год · 8/10" },
    { type: "energy", title: "Енергія", note: "Рівень сил і бадьорості протягом дня", value: "6/10" },
    { type: "discharge", title: "Виділення", note: "Характер, колір і кількість виділень", value: "Нормальні" },
    { type: "libido", title: "Лібідо / секс", note: "Бажання, активність або зміни", value: "Без змін" },
    { type: "medication", title: "Ліки / добавки", note: "Назва, дозування і регулярність", value: "Прийнято" },
    { type: "note", title: "Нотатка", note: "Вільне спостереження про стан тіла", value: "Швидка нотатка" },
  ],
  medical: [
    { type: "appointment", title: "Прийом", note: "Запланувати або додати медичний візит", value: "Заплановано" },
    { type: "question", title: "Питання", note: "Підготувати питання до лікаря", value: "Нове питання" },
    { type: "analysis", title: "Аналіз", note: "Результат аналізу або скринінгу", value: "Додано" },
    { type: "document", title: "Документ", note: "PDF, фото або скан", value: "Прикріплено" },
  ],
  event: [
    { type: "cycle_start", title: "Початок циклу", note: "Додати подію старту циклу", value: "Подія" },
    { type: "cycle_end", title: "Кінець циклу", note: "Закрити активний цикл", value: "Подія" },
    { type: "pregnancy_confirmed", title: "Вагітність", note: "Перемкнути додаток у режим вагітності", value: "Подія" },
    { type: "birth", title: "Пологи", note: "Перемкнути додаток у режим відновлення", value: "Подія" },
    { type: "pregnancy_end", title: "Кінець вагітн.", note: "Завершити контекст вагітності", value: "Подія" },
    { type: "recovery_end", title: "Кінець відновл.", note: "Повернутися в базовий режим", value: "Подія" },
  ],
};

const baseEntries = [
  {
    id: 1,
    type: "cycle_start",
    title: "Цикл почався",
    value: "Зафіксовано день 1",
    note: "Кровотеча почалася зранку.",
    date: "2026-03-14T07:20:00",
    tags: ["cycle", "event"],
    context: "base",
  },
  {
    id: 2,
    type: "bleeding",
    title: "Кровотеча",
    value: "6/10",
    note: "Без різких змін протягом дня.",
    date: "2026-03-14T07:45:00",
    tags: ["cycle"],
    context: "base",
  },
  {
    id: 10,
    type: "bleeding",
    title: "Кровотеча",
    value: "4/10",
    note: "Стало слабше, майже мажуча.",
    date: "2026-03-15T08:30:00",
    tags: ["cycle"],
    context: "base",
  },
  {
    id: 11,
    type: "pain",
    title: "Біль",
    value: "Спазми · 4/10",
    note: "Тягнучий біль внизу живота, легший за вчора.",
    date: "2026-03-15T10:00:00",
    tags: ["cycle", "symptom"],
    context: "base",
  },
  {
    id: 12,
    type: "bleeding",
    title: "Кровотеча",
    value: "2/10",
    note: "Мажучі залишки, майже завершення.",
    date: "2026-03-16T09:15:00",
    tags: ["cycle"],
    context: "base",
  },
  {
    id: 3,
    type: "pain",
    title: "Біль",
    value: "Спазми · 6/10",
    note: "Низ живота, стало легше після відпочинку.",
    date: "2026-03-14T08:15:00",
    tags: ["cycle", "symptom"],
    context: "base",
  },
  {
    id: 4,
    type: "mood",
    title: "Настрій",
    value: "7/10 · Чутливий, але рівний",
    note: "Є втома, але фокус зберігається.",
    date: "2026-03-18T18:10:00",
    tags: ["daily"],
    context: "base",
  },
  {
    id: 5,
    type: "sleep",
    title: "Сон",
    value: "6.5 год · 6/10",
    note: "Пробудження: 2 рази. Було два пробудження за ніч.",
    date: "2026-03-19T07:10:00",
    tags: ["daily"],
    context: "base",
  },
  {
    id: 6,
    type: "symptom",
    title: "Симптом",
    value: "Сухість · 3/10",
    note: "Помітно ввечері.",
    date: "2026-03-20T20:05:00",
    tags: ["intimate", "symptom"],
    context: "base",
  },
  {
    id: 7,
    type: "question",
    title: "Питання до лікаря",
    value: "Чи варто окремо обговорити повторювану сухість?",
    note: "Додати в список до наступного візиту.",
    date: "2026-03-17T16:40:00",
    tags: ["intimate", "doctor"],
    context: "base",
  },
  {
    id: 8,
    type: "appointment",
    title: "Прийом у гінеколога",
    value: "Запис на 29 березня",
    note: "Взяти результати ПАП / HPV і нотатки по симптомах.",
    date: "2026-03-12T12:00:00",
    tags: ["doctor"],
    context: "base",
  },
  {
    id: 9,
    type: "analysis",
    title: "Запис ПАП / HPV",
    value: "Документ збережено",
    note: "Готово до включення у підсумок для лікаря.",
    date: "2026-03-10T09:00:00",
    tags: ["record", "doctor"],
    context: "base",
  },
];

const richDemoEntries = [
  {
    id: 101,
    type: "document",
    title: "УЗД малого таза",
    value: "Скан прикріплено",
    note: "Документ готовий до включення у підсумок і зв'язаний з майбутнім прийомом.",
    date: "2026-03-15T11:20:00",
    tags: ["record", "doctor"],
    context: "base",
  },
  {
    id: 102,
    type: "symptom",
    title: "Нудота",
    value: "Помірна інтенсивність",
    note: "Була в першій половині дня, без блювання, після їжі стало краще.",
    date: "2026-03-14T09:30:00",
    tags: ["symptom"],
    context: "base",
  },
  {
    id: 103,
    type: "note",
    title: "Нотатка про самопочуття",
    value: "Є потреба поспостерігати ще кілька днів",
    note: "Відчуття нестабільної енергії, легка втома та бажання окремо зібрати короткий summary перед наступним візитом.",
    date: "2026-03-13T19:10:00",
    tags: ["daily"],
    context: "base",
  },
  {
    id: 104,
    type: "appointment",
    title: "Контрольний прийом",
    value: "Заплановано на 4 квітня",
    note: "Потрібно взяти з собою останні записи про цикл, сон і інтимний дискомфорт.",
    date: "2026-03-12T15:00:00",
    tags: ["doctor"],
    context: "base",
  },
];

function cloneEntries(entries) {
  return entries.map((entry) => normalizeJournalEntry(entry));
}

const state = {
  activeTab: "home",
  profileScreen: "main",
  activeFilter: "all",
  journalSearch: "",
  toastTimer: null,
  lastActionSignature: null,
  lastActionAt: 0,
  entries: cloneEntries(baseEntries),
  uiTest: {
    context: "auto",
    dataMode: "default",
    longText: false,
  },
  selectedEntryId: null,
  draftActionType: null,
  draftActionMeta: null,
  selectedCycleDate: toLocalDateKey(new Date()),
  cycleMonthCursor: toMonthCursorKey(new Date()),
};

const app = document.querySelector("#app");
const bottomNav = document.querySelector("#bottomNav");
const composerSheet = document.querySelector("#composerSheet");
const testSheet = document.querySelector("#testSheet");
const entryDetailSheet = document.querySelector("#entryDetailSheet");
const cycleDaySheet = document.querySelector("#cycleDaySheet");
const recordFormSheet = document.querySelector("#recordFormSheet");
const openComposerButton = document.querySelector("#openComposer");
const quickActionsRoot = document.querySelector("#quickActions");
const medicalActionsRoot = document.querySelector("#medicalActions");
const eventActionsRoot = document.querySelector("#eventActions");
const demoContextOptionsRoot = document.querySelector("#demoContextOptions");
const demoDataOptionsRoot = document.querySelector("#demoDataOptions");
const demoTextOptionsRoot = document.querySelector("#demoTextOptions");
const resetDemoButton = document.querySelector("#resetDemoButton");
const entryDetailContent = document.querySelector("#entryDetailContent");
const cycleDayContent = document.querySelector("#cycleDayContent");
const recordForm = document.querySelector("#recordForm");
const recordFormTitle = document.querySelector("#recordFormTitle");
const recordFormSubtitle = document.querySelector("#recordFormSubtitle");
const recordValueField = document.querySelector("#recordValueField");
const recordValueLabel = document.querySelector("#recordValueLabel");
const recordValueInput = document.querySelector("#recordValueInput");
const recordDateInput = document.querySelector("#recordDateInput");
const recordExtraFieldsTop = document.querySelector("#recordExtraFieldsTop");
const recordExtraFieldsBottom = document.querySelector("#recordExtraFieldsBottom");
const recordNoteLabel = document.querySelector("#recordNoteLabel");
const recordNoteInput = document.querySelector("#recordNoteInput");
const cancelRecordButton = document.querySelector("#cancelRecordButton");
const closeRecordFormButton = document.querySelector("#closeRecordFormButton");
const saveRecordButton = document.querySelector("#saveRecordButton");
let lockedScrollY = 0;

const icons = {
  home: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M6.5 10.5V20h11V10.5" />
    </svg>
  `,
  journal: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 4.5h9a3 3 0 0 1 3 3V20H8a3 3 0 0 0-3 3V7.5a3 3 0 0 1 3-3Z" />
      <path d="M9 9h7M9 13h7M9 17h5" />
    </svg>
  `,
  cycle: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M17.5 8.5A6.5 6.5 0 1 0 18 16" />
      <path d="M18 5v4h-4" />
    </svg>
  `,
  intimate: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 20s-6.5-3.9-8.4-8.2A4.7 4.7 0 0 1 12 6a4.7 4.7 0 0 1 8.4 5.8C18.5 16.1 12 20 12 20Z" />
    </svg>
  `,
  profile: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </svg>
  `,
  lock: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="5" y="10" width="14" height="10" rx="3" />
      <path d="M8 10V8a4 4 0 1 1 8 0v2" />
    </svg>
  `,
  plus: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  `,
  close: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  `,
  spark: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m12 3 1.9 4.8L19 9.7l-4.3 2.3L12.7 17l-1.9-4.9L6.5 9.7l5.1-1.9L12 3Z" />
    </svg>
  `,
  pain: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m13.5 3-5 9h3L10.5 21l5-9h-3L13.5 3Z" />
    </svg>
  `,
  drop: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3s5 5.4 5 9.4A5 5 0 1 1 7 12.4C7 8.4 12 3 12 3Z" />
    </svg>
  `,
  mood: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8" />
      <path d="M9 10h.01M15 10h.01M8.5 15c1 .8 2.2 1.2 3.5 1.2s2.5-.4 3.5-1.2" />
    </svg>
  `,
  sleep: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M16.5 4.5A7.5 7.5 0 1 0 19 19a8 8 0 0 1-2.5-14.5Z" />
      <path d="M9 6h3l-3 4h3M14 8h2.5L14 11h2.5" />
    </svg>
  `,
  note: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 4.5h10A2.5 2.5 0 0 1 19.5 7v10a2.5 2.5 0 0 1-2.5 2.5H7A2.5 2.5 0 0 1 4.5 17V7A2.5 2.5 0 0 1 7 4.5Z" />
      <path d="M8.5 9h7M8.5 12.5h7M8.5 16h4.5" />
    </svg>
  `,
  calendar: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="5.5" width="16" height="14" rx="3" />
      <path d="M8 3.5v4M16 3.5v4M4 9.5h16" />
    </svg>
  `,
  question: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9.5 9a2.5 2.5 0 1 1 4.1 2c-.9.8-1.6 1.3-1.6 2.5" />
      <path d="M12 17.5h.01" />
      <circle cx="12" cy="12" r="8" />
    </svg>
  `,
  document: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 4.5h6l4 4V19a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6.5a2 2 0 0 1 2-2Z" />
      <path d="M14 4.5V9h4M9 13h6M9 16h4" />
    </svg>
  `,
  attachment: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m9.5 12.5 5.7-5.7a3 3 0 1 1 4.3 4.3l-7.8 7.8a5 5 0 1 1-7.1-7.1l7.1-7.1" />
    </svg>
  `,
  pregnancy: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M10 4.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Z" />
      <path d="M10 10v3.2a4.8 4.8 0 1 0 4 7.3" />
      <path d="M14 8.5c1.6.7 2.8 2.3 2.8 4.4" />
    </svg>
  `,
  recovery: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 12.5c1.2-3.5 3.3-6.1 6.2-7.7 1.1 4.2 3.7 7 7.3 8.2-2 3.5-5.2 5.6-9.6 6.2-1.7-1.5-3-3.7-3.9-6.7Z" />
      <path d="M10 11c1.2.8 2.3 1.2 3.6 1.4" />
    </svg>
  `,
  summary: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 5.5h12A1.5 1.5 0 0 1 19.5 7v10A1.5 1.5 0 0 1 18 18.5H9l-4.5 3V7A1.5 1.5 0 0 1 6 5.5Z" />
      <path d="M8.5 10h7M8.5 13h4.5" />
    </svg>
  `,
  trend: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 16.5 9.5 12l3 3L19 8.5" />
      <path d="M14.5 8.5H19v4.5" />
    </svg>
  `,
  shield: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3.5 19 6v5.8c0 4.1-2.6 7.8-7 8.7-4.4-.9-7-4.6-7-8.7V6l7-2.5Z" />
    </svg>
  `,
  export: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 4.5v10M8.5 8 12 4.5 15.5 8" />
      <path d="M5.5 14.5v3a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-3" />
    </svg>
  `,
  edit: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4.5 19.5 8 18.8l9-9a2.1 2.1 0 1 0-3-3l-9 9-.5 3.7Z" />
      <path d="M12.5 7.5 16.5 11.5" />
    </svg>
  `,
  trash: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5.5 7.5h13" />
      <path d="M9.5 4.5h5l.8 2.5h-6.6l.8-2.5Z" />
      <path d="M8 7.5v10a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-10" />
      <path d="M10.5 10.5v5M13.5 10.5v5" />
    </svg>
  `,
  reminder: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 5a5 5 0 0 1 5 5v2.7l1.4 2.3a1 1 0 0 1-.9 1.5H6.5a1 1 0 0 1-.9-1.5L7 12.7V10a5 5 0 0 1 5-5Z" />
      <path d="M10 18.5a2 2 0 0 0 4 0" />
    </svg>
  `,
  discharge: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3c-2 4-5 6.5-5 10a5 5 0 0 0 10 0c0-3.5-3-6-5-10Z" />
      <path d="M10 14c.5 1.2 1.8 2 3 1.5" />
    </svg>
  `,
  energy: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m5 12 4-8h6l-2 5h5l-8 11 2-8H5Z" />
    </svg>
  `,
  medication: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="6" y="4" width="12" height="6" rx="2" />
      <path d="M8 10v9a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-9" />
      <path d="M12 13v4M10 15h4" />
    </svg>
  `,
  chevronLeft: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m15 18-6-6 6-6" />
    </svg>
  `,
  chevronRight: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m9 18 6-6-6-6" />
    </svg>
  `,
};

function icon(name, extraClass = "") {
  return `<span class="ui-icon ${extraClass}">${icons[name] || ""}</span>`;
}

function setBackgroundScrollLocked(locked) {
  if (locked) {
    if (document.body.classList.contains("modal-scroll-lock")) {
      return;
    }

    lockedScrollY = window.scrollY;
    document.body.classList.add("modal-scroll-lock");
    document.body.style.top = `-${lockedScrollY}px`;
    return;
  }

  if (!document.body.classList.contains("modal-scroll-lock")) {
    return;
  }

  document.body.classList.remove("modal-scroll-lock");
  document.body.style.top = "";
  window.scrollTo(0, lockedScrollY);
}

function syncAddRecordScrollLock() {
  setBackgroundScrollLocked(composerSheet.open || recordFormSheet.open || entryDetailSheet.open || cycleDaySheet.open);
}

function getNowIso() {
  return new Date().toISOString();
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function toDateInstance(value) {
  if (value instanceof Date) {
    return new Date(value);
  }

  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T12:00:00`);
  }

  return new Date(value);
}

function toLocalDateKey(value) {
  const date = toDateInstance(value);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function toMonthCursorKey(value) {
  const date = toDateInstance(value);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-01`;
}

function fromLocalDateKey(key) {
  return new Date(`${key}T12:00:00`);
}

function startOfDay(value) {
  const date = toDateInstance(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(value, amount) {
  const date = toDateInstance(value);
  date.setDate(date.getDate() + amount);
  return date;
}

function addMonths(value, amount) {
  const date = toDateInstance(value);
  date.setDate(1);
  date.setMonth(date.getMonth() + amount);
  date.setHours(12, 0, 0, 0);
  return date;
}

function diffInDays(start, end) {
  return Math.round((startOfDay(end) - startOfDay(start)) / DAY_MS);
}

function toDateParts(iso) {
  return new Intl.DateTimeFormat("uk-UA", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(iso));
}

function toTime(iso) {
  return new Intl.DateTimeFormat("uk-UA", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function toLongDateTime(iso) {
  return new Intl.DateTimeFormat("uk-UA", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function toLongDate(iso) {
  return new Intl.DateTimeFormat("uk-UA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

function toMonthLabel(value) {
  return new Intl.DateTimeFormat("uk-UA", {
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function sortEntries() {
  state.entries.sort((a, b) => new Date(b.date) - new Date(a.date));
}

function getDemoContextEntry() {
  if (state.uiTest.context === "pregnancy") {
    return {
      id: -1001,
      type: "pregnancy_confirmed",
      title: "Вагітність підтверджено",
      value: "Тестовий контекст UI",
      note: "Синтетичний запис для перевірки екранів у режимі вагітності.",
      date: "2026-03-22T11:00:00",
      tags: ["pregnancy", "event"],
      context: "pregnancy",
    };
  }

  if (state.uiTest.context === "recovery") {
    return {
      id: -1002,
      type: "birth",
      title: "Пологи зафіксовано",
      value: "Тестовий контекст UI",
      note: "Синтетичний запис для перевірки екранів у режимі відновлення.",
      date: "2026-03-22T11:05:00",
      tags: ["recovery", "event"],
      context: "recovery",
    };
  }

  return null;
}

function getEntries() {
  if (state.uiTest.dataMode === "empty") {
    return [];
  }

  let entries = cloneEntries(state.entries);

  if (state.uiTest.dataMode === "rich") {
    entries = [...entries, ...cloneEntries(richDemoEntries)];
  }

  if (state.uiTest.longText) {
    entries.unshift({
      id: -2001,
      type: "note",
      title: "Довга тестова нотатка для перевірки типографіки",
      value: "Перевірка переносу рядків, довших лейблів і щільності контенту",
      note: "Це спеціальний демо-запис, який допомагає швидко оцінити, як інтерфейс поводиться з довшими заголовками, насиченими поясненнями, багаторядковими значеннями та вужчим mobile-first простором без онбордингу й auth.",
      date: "2026-03-22T10:40:00",
      tags: ["daily"],
      context: state.uiTest.context === "auto" ? "base" : state.uiTest.context,
    });
  }

  const demoContextEntry = getDemoContextEntry();
  if (demoContextEntry) {
    entries.unshift(demoContextEntry);
  }

  return entries.sort((a, b) => new Date(b.date) - new Date(a.date));
}

function getCurrentContext(entries = getEntries()) {
  if (state.uiTest.context === "pregnancy") {
    return {
      mode: "pregnancy",
      title: "Вагітність",
      description: "Твій журнал зараз у режимі вагітності.",
    };
  }

  if (state.uiTest.context === "recovery") {
    return {
      mode: "recovery",
      title: "Відновлення",
      description: "Фокус на відновленні після пологів.",
    };
  }

  const events = entries
    .filter((entry) =>
      ["pregnancy_confirmed", "birth", "pregnancy_end", "recovery_end"].includes(entry.type),
    )
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  if (!events.length) {
    return {
      mode: "base",
      title: "Цикл",
      description: "Усе під контролем.",
    };
  }

  const latest = events[0].type;

  if (latest === "pregnancy_confirmed") {
    return {
      mode: "pregnancy",
      title: "Вагітність",
      description: "Логування та підсумки адаптовані під вагітність.",
    };
  }

  if (latest === "birth") {
    return {
      mode: "recovery",
      title: "Відновлення",
      description: "Контроль стану та наступні візити.",
    };
  }

  return {
    mode: "base",
    title: "Цикл",
    description: "Усе під контролем.",
  };
}

function getJournalStats() {
  const last30 = getEntries().filter((entry) => {
    const diffMs = new Date(getNowIso()) - new Date(entry.date);
    return diffMs <= 1000 * 60 * 60 * 24 * 30;
  });

  return {
    total: last30.length,
    symptoms: last30.filter((entry) => ["symptom", "pain", "bleeding"].includes(entry.type)).length,
    doctor: last30.filter((entry) => ["appointment", "analysis", "question", "document"].includes(entry.type)).length,
  };
}

function getCycleEntries() {
  return getEntries()
    .filter((entry) => entry.tags.includes("cycle") || ["cycle_start", "cycle_end", "bleeding", "pain"].includes(entry.type))
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

function getActiveCycleStart() {
  const starts = getEntries()
    .filter((entry) => entry.type === "cycle_start")
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  const ends = getEntries()
    .filter((entry) => entry.type === "cycle_end")
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const latestStart = starts[0] || null;
  const latestEnd = ends[0] || null;

  if (!latestStart) {
    return null;
  }

  if (latestEnd && new Date(latestEnd.date) > new Date(latestStart.date)) {
    return null;
  }

  return latestStart;
}

function getCurrentCycleDay(referenceDate = getNowIso()) {
  const cycleStart = getActiveCycleStart();

  if (!cycleStart) {
    return 0;
  }

  const diff = diffInDays(cycleStart.date, referenceDate);
  return diff < 0 ? 0 : Math.max(1, diff + 1);
}

function getIntimateSignals() {
  const intimateEntries = getEntries().filter((entry) => entry.tags.includes("intimate"));
  const latest = intimateEntries[0] || null;
  const last30 = intimateEntries.filter((entry) => {
    const diffMs = new Date(getNowIso()) - new Date(entry.date);
    return diffMs <= 1000 * 60 * 60 * 24 * 30;
  });
  const recurringMap = intimateEntries.reduce((map, entry) => {
    if (!["symptom", "pain", "note"].includes(entry.type)) {
      return map;
    }

    const key = entry.title.trim();
    map.set(key, (map.get(key) || 0) + 1);
    return map;
  }, new Map());

  const recurringItems = Array.from(recurringMap.entries())
    .filter(([, count]) => count > 1)
    .sort((a, b) => b[1] - a[1]);

  const painCount = intimateEntries.filter((entry) => entry.type === "pain").length;
  const doctorQuestions = intimateEntries.filter((entry) => ["question", "appointment", "document", "analysis"].includes(entry.type)).length;
  const latestSymptom = intimateEntries.find((entry) => ["symptom", "pain"].includes(entry.type)) || null;

  return {
    total: intimateEntries.length,
    recurring: intimateEntries.filter((entry) => entry.type === "symptom").length,
    latest,
    entries: intimateEntries,
    last30Count: last30.length,
    painCount,
    doctorQuestions,
    latestSymptom,
    recurringItems,
    recent: intimateEntries.slice(0, 4),
  };
}

function getVaultEntries() {
  const entries = getEntries().filter((entry) => ["analysis", "document"].includes(entry.type));
  const analyses = entries.filter((entry) => entry.type === "analysis");
  const documents = entries.filter((entry) => entry.type === "document");
  const withAttachment = entries.filter((entry) => entry.attachment?.dataUrl).length;

  return {
    all: entries,
    analyses,
    documents,
    total: entries.length,
    withAttachment,
    withoutAttachment: entries.length - withAttachment,
  };
}

function getDoctorSummaryData() {
  const entries = getEntries();
  const last30 = entries.filter((entry) => {
    const diffMs = new Date(getNowIso()) - new Date(entry.date);
    return diffMs <= 1000 * 60 * 60 * 24 * 30;
  });
  const symptomEntries = last30.filter((entry) => ["symptom", "pain", "bleeding", "sleep", "mood"].includes(entry.type));
  const doctorEntries = last30.filter((entry) => isDoctorEntry(entry));
  const appointments = doctorEntries.filter((entry) => entry.type === "appointment");
  const questions = doctorEntries.filter((entry) => entry.type === "question");
  const documents = doctorEntries.filter((entry) => ["analysis", "document"].includes(entry.type));
  const latestSymptom = symptomEntries[0] || null;
  const latestAppointment = appointments[0] || null;
  const cycleDay = getCurrentCycleDay();
  const cycleMetrics = getCycleMetrics();
  const intimateSignals = getIntimateSignals();
  const recurringSignal = intimateSignals.recurringItems[0] || null;

  return {
    symptomEntries,
    doctorEntries,
    appointments,
    questions,
    documents,
    latestSymptom,
    latestAppointment,
    cycleDay,
    cycleMetrics,
    intimateSignals,
    recurringSignal,
  };
}

function groupEntries(entries) {
  return entries.reduce((groups, entry) => {
    const dateKey = toLongDate(entry.date);

    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }

    groups[dateKey].push(entry);
    return groups;
  }, {});
}

function buildCycleSeries() {
  const cycleEntries = getCycleEntries().slice().sort((a, b) => new Date(a.date) - new Date(b.date));
  const starts = cycleEntries.filter((entry) => entry.type === "cycle_start");
  const ends = cycleEntries.filter((entry) => entry.type === "cycle_end");
  const activeStart = getActiveCycleStart();

  return starts
    .map((startEntry, index) => {
      const nextStart = starts[index + 1] || null;
      const endEntry =
        ends.find((entry) => {
          const afterStart = new Date(entry.date) >= new Date(startEntry.date);
          const beforeNextStart = !nextStart || new Date(entry.date) < new Date(nextStart.date);
          return afterStart && beforeNextStart;
        }) || null;

      const windowEnd = nextStart ? new Date(nextStart.date) : null;
      const entries = cycleEntries.filter((entry) => {
        const afterStart = new Date(entry.date) >= new Date(startEntry.date);
        const beforeNextStart = !windowEnd || new Date(entry.date) < windowEnd;
        return afterStart && beforeNextStart;
      });

      return {
        id: String(startEntry.id),
        start: startEntry,
        end: endEntry,
        nextStart,
        active: activeStart ? String(activeStart.id) === String(startEntry.id) : false,
        cycleLengthDays: nextStart ? diffInDays(startEntry.date, nextStart.date) : null,
        periodLengthDays: endEntry ? diffInDays(startEntry.date, endEntry.date) + 1 : null,
        bleedingCount: entries.filter((entry) => entry.type === "bleeding").length,
        painCount: entries.filter((entry) => entry.type === "pain").length,
        entries,
      };
    })
    .sort((a, b) => new Date(b.start.date) - new Date(a.start.date));
}

function getCycleRangeForDate(dateKey, cycleSeries = buildCycleSeries()) {
  const targetDate = startOfDay(fromLocalDateKey(dateKey));
  const today = startOfDay(new Date());

  return (
    cycleSeries.find((series) => {
      const start = startOfDay(series.start.date);
      const endBoundary = series.end
        ? startOfDay(series.end.date)
        : series.nextStart
          ? addDays(startOfDay(series.nextStart.date), -1)
          : today;
      const afterStart = targetDate >= start;
      const beforeBoundary = targetDate <= endBoundary;
      return afterStart && beforeBoundary;
    }) || null
  );
}

function getCycleEntriesForDate(dateKey) {
  return getCycleEntries().filter((entry) => toLocalDateKey(entry.date) === dateKey);
}

function getEntriesForDate(dateKey) {
  return getEntries()
    .filter((entry) => toLocalDateKey(entry.date) === dateKey)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

function getCycleCalendarDays(monthCursor) {
  const monthStart = fromLocalDateKey(monthCursor);
  monthStart.setDate(1);
  const startOffset = (monthStart.getDay() + 6) % 7;
  const gridStart = addDays(monthStart, -startOffset);
  const cycleEntries = getCycleEntries();
  const cycleSeries = buildCycleSeries();

  return Array.from({ length: 35 }, (_, index) => {
    const date = addDays(gridStart, index);
    const dateKey = toLocalDateKey(date);
    const dayEntries = cycleEntries.filter((entry) => toLocalDateKey(entry.date) === dateKey);
    const cycleRange = getCycleRangeForDate(dateKey, cycleSeries);
    const markerTypes = {
      start: dayEntries.some((entry) => entry.type === "cycle_start"),
      end: dayEntries.some((entry) => entry.type === "cycle_end"),
      bleeding: dayEntries.some((entry) => entry.type === "bleeding"),
      pain: dayEntries.some((entry) => entry.type === "pain"),
    };

    return {
      date,
      dateKey,
      inMonth: date.getMonth() === monthStart.getMonth(),
      isToday: dateKey === toLocalDateKey(new Date()),
      isSelected: dateKey === state.selectedCycleDate,
      inCycle: Boolean(cycleRange),
      isCycleStart: cycleRange ? dateKey === toLocalDateKey(cycleRange.start.date) : false,
      isCycleEnd: cycleRange?.end ? dateKey === toLocalDateKey(cycleRange.end.date) : false,
      isActiveCycle: cycleRange?.active || false,
      cycleDay: cycleRange ? diffInDays(cycleRange.start.date, date) + 1 : null,
      markerTypes,
      entryCount: dayEntries.length,
    };
  });
}

function getCycleMetrics() {
  const cycleSeries = buildCycleSeries();
  const activeSeries = cycleSeries.find((series) => series.active) || null;
  const completedLengths = cycleSeries.map((series) => series.cycleLengthDays).filter((value) => Number.isFinite(value));
  const averageCycleLength =
    completedLengths.length > 0
      ? Math.round(completedLengths.reduce((total, value) => total + value, 0) / completedLengths.length)
      : null;
  const bleedingThisCycle = activeSeries ? activeSeries.entries.filter((entry) => entry.type === "bleeding").length : 0;
  const painThisCycle = activeSeries ? activeSeries.entries.filter((entry) => entry.type === "pain").length : 0;
  const earlyPainSignals = cycleSeries.filter(
    (series) =>
      series.entries.filter((entry) => entry.type === "pain" && diffInDays(series.start.date, entry.date) <= 2).length > 0,
  ).length;

  const bleedingDaysThisCycle = activeSeries
    ? new Set(activeSeries.entries.filter((entry) => entry.type === "bleeding").map((entry) => toLocalDateKey(entry.date))).size
    : 0;

  const varianceRange = completedLengths.length >= 2
    ? { min: Math.min(...completedLengths), max: Math.max(...completedLengths) }
    : null;

  const isRegular = varianceRange ? (varianceRange.max - varianceRange.min) <= 5 : null;

  return {
    cycleSeries,
    activeSeries,
    averageCycleLength,
    bleedingThisCycle,
    bleedingDaysThisCycle,
    painThisCycle,
    earlyPainSignals,
    latestStart: cycleSeries[0]?.start || null,
    latestEnd: cycleSeries[0]?.end || null,
    varianceRange,
    isRegular,
    completedCyclesCount: completedLengths.length,
  };
}

function filterEntries() {
  let entries = getEntries();

  if (state.journalSearch) {
    const query = state.journalSearch.toLowerCase();
    entries = entries.filter((entry) =>
      entry.title.toLowerCase().includes(query) ||
      entry.value.toLowerCase().includes(query) ||
      entry.note.toLowerCase().includes(query)
    );
  }

  if (state.activeFilter === "all") {
    return entries;
  }

  return entries.filter((entry) => {
    if (state.activeFilter === "symptoms") {
      return ["symptom", "pain", "bleeding", "sleep", "mood"].includes(entry.type);
    }

    if (state.activeFilter === "intimate") {
      return entry.tags.includes("intimate");
    }

    if (state.activeFilter === "doctor") {
      return ["appointment", "analysis", "question", "document"].includes(entry.type);
    }

    if (state.activeFilter === "events") {
      return entry.tags.includes("event");
    }

    return entry.type === state.activeFilter;
  });
}

function createElement(html) {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = html.trim();
  return wrapper.firstElementChild;
}

function showToast(message) {
  const existing = document.querySelector(".toast");
  if (existing) {
    existing.remove();
  }

  const toast = createElement(`<div class="toast" role="status">${message}</div>`);
  document.body.appendChild(toast);

  window.clearTimeout(state.toastTimer);
  state.toastTimer = window.setTimeout(() => toast.remove(), 2400);
}

async function hydrateEntries() {
  state.entries = await journalRepository.listEntries(baseEntries);
}

async function persistEntries() {
  try {
    state.entries = await journalRepository.saveEntries(state.entries);
  } catch {
    showToast("Не вдалося зберегти записи локально.");
  }
}

function toDateTimeLocalValue(iso) {
  const date = new Date(iso);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toLocalDateTimeIso(dateKey) {
  const selectedDate = fromLocalDateKey(dateKey);
  const now = new Date();
  selectedDate.setHours(now.getHours(), now.getMinutes(), 0, 0);
  return selectedDate.toISOString();
}

function getSelectedCycleDateTimeIso() {
  return toLocalDateTimeIso(state.selectedCycleDate || toLocalDateKey(new Date()));
}

function inferSourceTabFromEntry(entry) {
  if (entry.tags.includes("cycle") || ["cycle_start", "cycle_end", "bleeding"].includes(entry.type)) {
    return "cycles";
  }

  if (entry.tags.includes("intimate")) {
    return "intimate";
  }

  return state.activeTab;
}

function getActionByType(type) {
  return getCatalogAction(type) || {
    type,
    title: typeLabels[type] || type,
    value: "",
    note: "",
  };
}

function findMatchingOption(options = [], text = "") {
  const normalized = String(text || "").toLowerCase();
  return options.find((option) => normalized.includes(option.toLowerCase())) || "";
}

function escapeForRegex(text = "") {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractSentenceValue(text, prefix) {
  const escapedPrefix = escapeForRegex(prefix);
  const match = String(text || "").match(new RegExp(`${escapedPrefix}\\s*([^.]*)`, "i"));
  return match ? match[1].trim() : "";
}

function convertFiveScaleToTenScale(score) {
  return String(Math.max(1, Math.min(10, Math.round((Number(score) / 5) * 10))));
}

function extractIntensityScore(text, fallback = 5) {
  const normalized = String(text || "");
  const score10 = normalized.match(/\b(10|[1-9])\/10\b/i);
  if (score10) {
    return score10[1];
  }

  const score5 = normalized.match(/\b([1-5])\/5\b/i);
  if (score5) {
    return convertFiveScaleToTenScale(score5[1]);
  }

  const semanticMap = [
    ["мажуча", 1],
    ["легка", 3],
    ["помірна", 6],
    ["середня", 5],
    ["сильна", 8],
    ["рясна", 9],
  ];

  const semantic = semanticMap.find(([label]) => normalized.toLowerCase().includes(label));
  return semantic ? String(semantic[1]) : String(fallback);
}

function normalizeLegacyScaleText(text = "") {
  return String(text || "").replace(/\b([1-5])\/5\b/gi, (_, score) => `${convertFiveScaleToTenScale(score)}/10`);
}

function buildStructuredValue(parts = []) {
  return parts
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(" · ");
}

function extractStructuredFreeText(value = "", structuredParts = []) {
  let remainder = normalizeLegacyScaleText(value);

  structuredParts
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .forEach((part) => {
      remainder = remainder.replace(new RegExp(escapeForRegex(part), "ig"), "");
    });

  return remainder
    .replace(/\s*[·,]\s*/g, " · ")
    .replace(/(?:^|\s)·\s*/g, "")
    .replace(/\s*·(?:\s|$)/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function extractBleedingFreeText(value = "", intensity = "") {
  return extractStructuredFreeText(value, [
    intensity ? `${intensity}/10` : "",
    "легка",
    "середня",
    "помірна",
    "сильна",
    "рясна",
    "мажуча",
    "інтенсивність",
  ]);
}

function extractMoodScore(text, fallback = 6) {
  const normalized = String(text || "").toLowerCase();
  const score10 = normalized.match(/\b(10|[1-9])\/10\b/i);
  if (score10) {
    return score10[1];
  }

  const semanticMap = [
    ["дуже важко", 2],
    ["важко", 3],
    ["тривожно", 4],
    ["напружено", 4],
    ["чутливо", 5],
    ["втомлено", 5],
    ["спокійно", 7],
    ["стабільно", 7],
    ["добре", 8],
    ["легко", 8],
    ["чудово", 9],
  ];

  const semantic = semanticMap.find(([label]) => normalized.includes(label));
  return semantic ? String(semantic[1]) : String(fallback);
}

function getRangeSemanticLabel(value, semanticLabels = []) {
  const numeric = Math.max(1, Math.min(10, Number(value) || 1));
  const defaultLabels = [
    "Ледь помітно",
    "Дуже м'яко",
    "М'яко",
    "Слабко",
    "Відчутно",
    "Помітно",
    "Сильно",
    "Дуже сильно",
    "Різко",
    "Максимально",
  ];
  const labels = semanticLabels.length === 10 ? semanticLabels : defaultLabels;
  return labels[numeric - 1];
}

function parseRangeLabels(value = "") {
  return String(value || "")
    .split("|")
    .map((label) => label.trim())
    .filter(Boolean);
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("file_read_error"));
    reader.readAsDataURL(file);
  });
}

async function readAttachmentField(fieldId) {
  const input = recordForm.querySelector(`[data-record-extra="${fieldId}"]`);
  const file = input?.files?.[0];

  if (!file) {
    return null;
  }

  if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
    throw new Error("attachment_too_large");
  }

  const dataUrl = await fileToDataUrl(file);
  return {
    name: file.name,
    type: file.type || "application/octet-stream",
    size: file.size,
    dataUrl,
  };
}

function getSymptomTypeOptions(sourceTab) {
  if (sourceTab === "intimate") {
    return ["Сухість", "Свербіж", "Печіння", "Подразнення", "Незвичні виділення"];
  }

  return ["Головний біль", "Нудота", "Втома", "Запаморочення", "Чутливість", "Інше"];
}

function getDefaultSymptomType(sourceTab) {
  return sourceTab === "intimate" ? "Сухість" : "Втома";
}

function getPainTypeOptions(sourceTab) {
  if (sourceTab === "intimate") {
    return ["Печіння", "Тягнучий біль", "Різкий біль", "Тиск / дискомфорт", "Чутливість"];
  }

  return ["Спазми", "Тягнучий біль", "Різкий біль", "Тиск / важкість", "Пульсуючий біль"];
}

function getDefaultPainType(sourceTab) {
  return sourceTab === "intimate" ? "Тиск / дискомфорт" : "Спазми";
}

function getSleepDurationOptions() {
  return [
    "3.0 год",
    "3.5 год",
    "4.0 год",
    "4.5 год",
    "5.0 год",
    "5.5 год",
    "6.0 год",
    "6.5 год",
    "7.0 год",
    "7.5 год",
    "8.0 год",
    "8.5 год",
    "9.0 год",
    "9.5 год",
    "10.0 год",
    "10.5 год",
    "11.0 год",
    "11.5 год",
    "12.0 год",
  ];
}

function extractSleepDuration(text, fallback = "7.5 год") {
  const match = String(text || "").match(/\b(\d{1,2}(?:[.,]\d)?)\s*год(?:ин|ини)?\b/i);
  if (!match) {
    return fallback;
  }

  return `${match[1].replace(",", ".")} год`;
}

function extractSleepQualityScore(text, fallback = 7) {
  const normalized = String(text || "").toLowerCase();
  const score10 = normalized.match(/\b(10|[1-9])\/10\b/i);
  if (score10) {
    return score10[1];
  }

  const semanticMap = [
    ["дуже погано", 2],
    ["погано", 3],
    ["переривчасто", 4],
    ["важко заснути", 4],
    ["нормально", 6],
    ["спокійно", 7],
    ["добре", 8],
    ["глибоко", 9],
    ["відновлювально", 9],
  ];

  const semantic = semanticMap.find(([label]) => normalized.includes(label));
  return semantic ? String(semantic[1]) : String(fallback);
}

function extractSleepFreeText(value = "", duration = "", quality = "") {
  let remainder = normalizeLegacyScaleText(value);
  remainder = remainder.replace(/\b\d{1,2}(?:[.,]\d)?\s*год(?:ин|ини)?\b/gi, "");
  return extractStructuredFreeText(remainder, [duration, quality]);
}

function getRecordFormConfig(action, sourceTab) {
  const defaults = {
    subtitle: "Гнучка форма для швидкого, але змістовного запису.",
    valueLabel: "Значення",
    valuePlaceholder: action.value || "Коротке значення",
    valueRequired: true,
    noteLabel: "Нотатка",
    notePlaceholder: action.note || "Коротка нотатка про стан або подію",
    extraFields: [],
  };

  if (action.type === "bleeding") {
    const extraFields = [
      {
        id: "bleeding_intensity",
        label: "Рівень",
        kind: "range",
        required: true,
        min: 1,
        max: 10,
        defaultValue: 5,
        minLabel: "Легко",
        maxLabel: "Рясно",
        semanticLabels: [
          "Ледь помітно",
          "Дуже легко",
          "Легко",
          "Спокійно",
          "Помітно",
          "Середньо",
          "Відчутно",
          "Сильно",
          "Дуже рясно",
          "Максимально рясно",
        ],
      },
    ];

    if (sourceTab === "cycles") {
      extraFields.push({
        id: "bleeding_day_phase",
        label: "Коли помітно найбільше",
        kind: "select",
        options: ["Зранку", "Вдень", "Увечері", "Всю добу"],
        defaultValue: "Всю добу",
      });
    }

    return {
      subtitle:
        sourceTab === "cycles"
          ? "Зафіксуй кровотечу в тій самій базовій формі, але з цикл-специфічним контекстом дня."
          : "Одна базова форма кровотечі для журналу й модуля циклів зі шкалою 1-10.",
      valueLabel: "Короткий опис",
      valuePlaceholder: "Наприклад: Згустки зранку або різке посилення ввечері",
      valueRequired: false,
      noteLabel: "Що ще важливо",
      notePlaceholder: "Колір, згустки, відчуття, зміни протягом дня",
      extraFields,
    };
  }

  if (action.type === "pain") {
    const baseSubtitle =
      sourceTab === "intimate"
        ? "Зафіксуй інтимний біль або дискомфорт у тій самій структурі, що й будь-який інший біль у додатку."
        : sourceTab === "cycles"
          ? "Зафіксуй біль у тій самій базовій формі, але з цикл-специфічними деталями."
          : "Одна базова форма болю для журналу, циклів та інтимного модуля.";

    const extraFields = [
      {
        id: "pain_type",
        label: "Характер болю",
        kind: "select",
        required: true,
        options: getPainTypeOptions(sourceTab),
        defaultValue: getDefaultPainType(sourceTab),
      },
      {
        id: "pain_level",
        label: "Інтенсивність",
        kind: "range",
        required: true,
        min: 1,
        max: 10,
        defaultValue: sourceTab === "cycles" ? 6 : 4,
        minLabel: "М’яко",
        maxLabel: "Сильно",
        semanticLabels: [
          "Ледь відчутно",
          "Дуже слабо",
          "Слабо",
          "Відчутно",
          "Неприємно",
          "Болісно",
          "Сильно",
          "Дуже сильно",
          "Виснажливо",
          "Нестерпно",
        ],
      },
      {
        id: "pain_repeat",
        label: "Частота",
        kind: "select",
        options: ["Разово", "Іноді", "Повторюється"],
        defaultValue: "Іноді",
      },
    ];

    if (sourceTab === "cycles") {
      extraFields.push({
        id: "pain_zone",
        label: "Локалізація",
        kind: "select",
        options: ["Низ живота", "Поперек", "З обох боків", "Не визначено"],
        defaultValue: "Низ живота",
      });
    }

    if (sourceTab === "intimate") {
      extraFields.push({
        id: "pain_context",
        label: "Контекст",
        kind: "select",
        required: true,
        options: ["Під час близькості", "Після близькості", "Поза близькістю", "Тазовий дискомфорт"],
        defaultValue: "Під час близькості",
      });
    }

    return {
      subtitle: baseSubtitle,
      valueLabel: "Короткий опис",
      valuePlaceholder: sourceTab === "intimate" ? "Наприклад: Дискомфорт під час близькості" : "Наприклад: Спазми внизу живота",
      valueRequired: false,
      noteLabel: "Деталі",
      notePlaceholder: "Що полегшує, де саме болить, як довго триває",
      extraFields,
    };
  }

  if (sourceTab === "cycles" && action.type === "cycle_start") {
    return {
      subtitle: "Старт циклу визначає день 1 і запускає логіку календаря.",
      valueLabel: "Короткий опис",
      valuePlaceholder: "Наприклад: День 1, почалось зранку",
      valueRequired: false,
      noteLabel: "Нотатка",
      notePlaceholder: "Що варто запам’ятати про старт цього циклу",
      extraFields: [
        {
          id: "cycle_start_phase",
          label: "Коли почався",
          kind: "select",
          required: true,
          options: ["Зранку", "Вдень", "Увечері", "Вночі"],
          defaultValue: "Зранку",
        },
        {
          id: "cycle_start_flow",
          label: "Стартовий потік",
          kind: "select",
          options: ["Легкий", "Середній", "Рясний", "Мажучий"],
          defaultValue: "Середній",
        },
      ],
    };
  }

  if (sourceTab === "cycles" && action.type === "cycle_end") {
    return {
      subtitle: "Завершення циклу закриває активний інтервал і готує календар до наступного старту.",
      valueLabel: "Короткий опис",
      valuePlaceholder: "Наприклад: Виділення завершились",
      valueRequired: false,
      noteLabel: "Нотатка",
      notePlaceholder: "Як завершувався цикл і чи були особливості",
      extraFields: [
        {
          id: "cycle_end_state",
          label: "Як завершився цикл",
          kind: "select",
          required: true,
          options: ["Поступово", "Різко", "Мажучий хвіст", "Неоднорідно"],
          defaultValue: "Поступово",
        },
      ],
    };
  }

  if (action.type === "mood") {
    return {
      subtitle: "Зафіксуй загальний стан настрою через шкалу 1-10 і короткий опис відчуття.",
      valueLabel: "Короткий опис",
      valuePlaceholder: "Наприклад: Чутливо, але стабільно",
      valueRequired: false,
      noteLabel: "Що вплинуло",
      notePlaceholder: "Що підтримало стан або що сьогодні було тригером",
      extraFields: [
        {
          id: "mood_level",
          label: "Рівень настрою",
          kind: "range",
          required: true,
          min: 1,
          max: 10,
          defaultValue: 7,
          minLabel: "Важко",
          maxLabel: "Добре",
          semanticLabels: [
            "Дуже важко",
            "Важко",
            "Крихко",
            "Нестабільно",
            "Терпимо",
            "Спокійно",
            "Гарно",
            "Добре",
            "Надихаюче",
            "Неймовірно",
          ],
        },
      ],
    };
  }

  if (action.type === "sleep") {
    return {
      subtitle: "Зафіксуй тривалість, якість сну і пробудження в одній структурованій формі.",
      valueLabel: "Короткий опис",
      valuePlaceholder: "Наприклад: Заснула пізно, але сон був глибоким",
      valueRequired: false,
      noteLabel: "Що ще важливо",
      notePlaceholder: "Засинання, нічні пробудження, сни або ранкове самопочуття",
      extraFields: [
        {
          id: "sleep_duration",
          label: "Тривалість",
          kind: "select",
          required: true,
          options: getSleepDurationOptions(),
          defaultValue: "7.5 год",
        },
        {
          id: "sleep_quality",
          label: "Якість сну",
          kind: "range",
          required: true,
          min: 1,
          max: 10,
          defaultValue: 7,
          minLabel: "Важко",
          maxLabel: "Відновлює",
          semanticLabels: [
            "Виснажливо",
            "Дуже важко",
            "Неспокійно",
            "Уривчасто",
            "Так собі",
            "Терпимо",
            "Спокійно",
            "Добре",
            "Відновлює",
            "Глибоко відновлює",
          ],
        },
        {
          id: "sleep_awakenings",
          label: "Пробудження",
          kind: "select",
          options: ["Без пробуджень", "1 раз", "2 рази", "3+ рази"],
          defaultValue: "Без пробуджень",
        },
      ],
    };
  }

  if (action.type === "energy") {
    return {
      subtitle: "Зафіксуй рівень енергії та бадьорості на цю частину дня.",
      valueLabel: "Короткий опис",
      valuePlaceholder: "Наприклад: Після обіду різко впала",
      valueRequired: false,
      noteLabel: "Що вплинуло",
      notePlaceholder: "Сон, їжа, стрес, фізична активність",
      extraFields: [
        {
          id: "energy_level",
          label: "Рівень енергії",
          kind: "range",
          required: true,
          min: 1,
          max: 10,
          defaultValue: 6,
          minLabel: "Виснаження",
          maxLabel: "Бадьорість",
          semanticLabels: [
            "Повне виснаження",
            "Дуже мало сил",
            "Важко",
            "Мляво",
            "Так собі",
            "Нормально",
            "Добре",
            "Бадьоро",
            "Енергійно",
            "На максимумі",
          ],
        },
      ],
    };
  }

  if (action.type === "discharge") {
    return {
      subtitle: "Зафіксуй характер виділень для спостереження за змінами.",
      valueLabel: "Короткий опис",
      valuePlaceholder: "Наприклад: Прозорі, без запаху",
      valueRequired: false,
      noteLabel: "Деталі",
      notePlaceholder: "Колір, запах, консистенція, об'єм або зміни",
      extraFields: [
        {
          id: "discharge_type",
          label: "Характер",
          kind: "select",
          required: true,
          options: ["Прозорі", "Білуваті", "Жовтуваті", "Коричневі", "Кров'яні", "Зеленуваті", "Незвичні"],
          defaultValue: "Прозорі",
        },
        {
          id: "discharge_amount",
          label: "Кількість",
          kind: "select",
          required: true,
          options: ["Мінімально", "Помірно", "Багато", "Дуже багато"],
          defaultValue: "Помірно",
        },
        {
          id: "discharge_smell",
          label: "Запах",
          kind: "select",
          options: ["Без запаху", "Легкий", "Різкий", "Неприємний"],
          defaultValue: "Без запаху",
        },
      ],
    };
  }

  if (action.type === "libido") {
    return {
      subtitle: "Зафіксуй зміни бажання або інтимну активність.",
      valueLabel: "Короткий опис",
      valuePlaceholder: "Наприклад: Підвищене бажання або відсутність інтересу",
      valueRequired: false,
      noteLabel: "Деталі",
      notePlaceholder: "Що вплинуло, як змінилось, чи була активність",
      extraFields: [
        {
          id: "libido_level",
          label: "Рівень бажання",
          kind: "range",
          required: true,
          min: 1,
          max: 10,
          defaultValue: 5,
          minLabel: "Відсутнє",
          maxLabel: "Високе",
          semanticLabels: [
            "Повністю відсутнє",
            "Дуже низьке",
            "Низьке",
            "Знижене",
            "Нейтрально",
            "Помірне",
            "Помітне",
            "Виразне",
            "Високе",
            "Дуже високе",
          ],
        },
        {
          id: "libido_activity",
          label: "Активність",
          kind: "select",
          options: ["Не було", "Була близькість", "Самозадоволення", "Лише бажання"],
          defaultValue: "Лише бажання",
        },
      ],
    };
  }

  if (action.type === "medication") {
    return {
      subtitle: "Зафіксуй прийом ліків або добавок із дозуванням.",
      valueLabel: "Назва препарату",
      valuePlaceholder: "Наприклад: Залізо, Вітамін D, КОК",
      valueRequired: true,
      noteLabel: "Додаткові деталі",
      notePlaceholder: "Побічні ефекти, самопочуття після прийому",
      extraFields: [
        {
          id: "medication_dose",
          label: "Дозування",
          kind: "select",
          required: true,
          options: ["Стандартна доза", "Половина дози", "Подвійна доза", "Інше"],
          defaultValue: "Стандартна доза",
        },
        {
          id: "medication_frequency",
          label: "Регулярність",
          kind: "select",
          required: true,
          options: ["Щодня", "Двічі на день", "За потребою", "Курс завершено"],
          defaultValue: "Щодня",
        },
      ],
    };
  }

  if (action.type === "symptom") {
    return {
      subtitle:
        sourceTab === "intimate"
          ? "Базова форма симптому працює і тут, просто з інтимно-специфічними варіантами симптому."
          : "Одна базова форма симптому для журналу та модулів із контекстним тегуванням.",
      extraFieldsFirst: true,
      valueLabel: "Короткий опис",
      valuePlaceholder: sourceTab === "intimate" ? "Наприклад: Сухість увечері" : "Наприклад: Втома після обіду",
      valueRequired: false,
      noteLabel: "Що саме відчувається",
      notePlaceholder: "Коли з’явилось, що могло спровокувати, чи було вже раніше",
      extraFields: [
        {
          id: "symptom_type",
          label: "Симптом",
          kind: "select",
          required: true,
          options: getSymptomTypeOptions(sourceTab),
          defaultValue: getDefaultSymptomType(sourceTab),
        },
        {
          id: "symptom_intensity",
          label: "Інтенсивність",
          kind: "range",
          required: true,
          min: 1,
          max: 10,
          defaultValue: 4,
          minLabel: "Ледь помітно",
          maxLabel: "Дуже сильно",
          semanticLabels: [
            "Ледь помітно",
            "Дуже м'яко",
            "М'яко",
            "Слабко",
            "Відчутно",
            "Помітно",
            "Сильно",
            "Дуже сильно",
            "Різко",
            "Максимально",
          ],
        },
        {
          id: "symptom_repeat",
          label: "Це повторюється?",
          kind: "select",
          options: ["Вперше", "Іноді", "Повторюється регулярно"],
          defaultValue: "Іноді",
        },
      ],
    };
  }

  if (sourceTab === "intimate" && action.type === "note") {
    return {
      subtitle: "Приватна нотатка для речей, які ще не хочеться зводити до сухої категорії.",
      valueLabel: "Тема нотатки",
      valuePlaceholder: "Наприклад: Відчуття після близькості",
      valueRequired: true,
      noteLabel: "Сама нотатка",
      notePlaceholder: "Опиши спостереження своїми словами",
      extraFields: [
        {
          id: "intimate_note_mood",
          label: "Тональність",
          kind: "select",
          options: ["Спокійне спостереження", "Є занепокоєння", "Треба обговорити з лікарем"],
          defaultValue: "Спокійне спостереження",
        },
      ],
    };
  }

  if (sourceTab === "intimate" && action.type === "question") {
    return {
      subtitle: "Питання краще збирати тут одразу в готовій формі для майбутнього візиту.",
      valueLabel: "Суть питання",
      valuePlaceholder: "Наприклад: Чи нормально, що сухість повторюється?",
      valueRequired: true,
      noteLabel: "Що додати для контексту",
      notePlaceholder: "Коли це повторюється, які є супутні симптоми",
      extraFields: [
        {
          id: "intimate_question_topic",
          label: "Тема",
          kind: "select",
          required: true,
          options: ["Сухість", "Біль", "Виділення", "Лібідо", "Інше"],
          defaultValue: "Сухість",
        },
        {
          id: "intimate_question_priority",
          label: "Терміновість",
          kind: "select",
          options: ["Запитати при нагоді", "Обговорити на наступному візиті", "Не відкладати"],
          defaultValue: "Обговорити на наступному візиті",
        },
      ],
    };
  }

  if (action.type === "analysis") {
    return {
      subtitle: "Додай результат аналізу як запис із реальним вкладенням файлу.",
      valueLabel: "Назва аналізу",
      valuePlaceholder: "Наприклад: ПАП / HPV",
      valueRequired: false,
      noteLabel: "Що важливо",
      notePlaceholder: "Короткий висновок, дата отримання або що варто згадати на візиті",
      extraFields: [
        {
          id: "attachment_file",
          label: "Файл аналізу",
          kind: "file",
          required: true,
          accept: ".pdf,image/*,.doc,.docx",
          hint: "PDF, фото, скан або документ до 2 МБ",
        },
      ],
    };
  }

  if (action.type === "document") {
    return {
      subtitle: "Прикріпи PDF, фото або скан, щоб документ жив у журналі й потрапляв у підсумок для лікаря.",
      valueLabel: "Назва документа",
      valuePlaceholder: "Наприклад: УЗД малого таза",
      valueRequired: false,
      noteLabel: "Що це за документ",
      notePlaceholder: "Що саме додано і чому це важливо",
      extraFields: [
        {
          id: "attachment_file",
          label: "Вкладення",
          kind: "file",
          required: true,
          accept: ".pdf,image/*,.doc,.docx",
          hint: "PDF, фото, скан або документ до 2 МБ",
        },
      ],
    };
  }

  return defaults;
}

function getRecordFormPrefill(action, sourceTab, entry = null) {
  const empty = {
    value: action.value || "",
    note: action.note || "",
    extraValues: {},
  };

  if (!entry) {
    return empty;
  }

  const prefill = {
    value: entry.value || "",
    note: entry.note || "",
    extraValues: {},
  };

  if (action.type === "bleeding") {
    prefill.extraValues.bleeding_intensity = extractIntensityScore(entry.value, 5);
    if (sourceTab === "cycles") {
      prefill.extraValues.bleeding_day_phase =
        findMatchingOption(["Зранку", "Вдень", "Увечері", "Всю добу"], entry.note) || "Всю добу";
      prefill.note = entry.note.replace(/Найбільше помітно\s*[^.]*\.?\s*/i, "").trim();
    }
    prefill.value = extractBleedingFreeText(entry.value, prefill.extraValues.bleeding_intensity);
  }

  if (sourceTab === "cycles" && action.type === "pain") {
    prefill.extraValues.pain_type =
      findMatchingOption(getPainTypeOptions(sourceTab), entry.value) || getDefaultPainType(sourceTab);
    prefill.extraValues.pain_level = extractIntensityScore(entry.value, 6);
    prefill.extraValues.pain_repeat = extractSentenceValue(entry.note, "Частота:") || "Іноді";
    prefill.extraValues.pain_zone = extractSentenceValue(entry.note, "Локалізація:") || "Низ живота";
    prefill.value = extractStructuredFreeText(entry.value, [
      prefill.extraValues.pain_type,
      `${prefill.extraValues.pain_level}/10`,
    ]);
    prefill.note = entry.note.replace(/Локалізація:\s*[^.]*\.?\s*/i, "").trim();
    prefill.note = prefill.note.replace(/Частота:\s*[^.]*\.?\s*/i, "").trim();
  }

  if (action.type === "pain" && sourceTab !== "cycles" && sourceTab !== "intimate") {
    prefill.extraValues.pain_type =
      findMatchingOption(getPainTypeOptions(sourceTab), entry.value) || getDefaultPainType(sourceTab);
    prefill.extraValues.pain_level = extractIntensityScore(entry.value, 4);
    prefill.extraValues.pain_repeat = extractSentenceValue(entry.note, "Частота:") || "Іноді";
    prefill.value = extractStructuredFreeText(entry.value, [
      prefill.extraValues.pain_type,
      `${prefill.extraValues.pain_level}/10`,
    ]);
    prefill.note = entry.note.replace(/Частота:\s*[^.]*\.?\s*/i, "").trim();
  }

  if (sourceTab === "cycles" && action.type === "cycle_start") {
    prefill.extraValues.cycle_start_phase =
      findMatchingOption(["Зранку", "Вдень", "Увечері", "Вночі"], entry.note) || "Зранку";
    prefill.extraValues.cycle_start_flow =
      findMatchingOption(["Легкий", "Середній", "Рясний", "Мажучий"], entry.value) || "Середній";
    prefill.note = entry.note.replace(/Почався\s*[^.]*\.?\s*/i, "").trim();
  }

  if (sourceTab === "cycles" && action.type === "cycle_end") {
    prefill.extraValues.cycle_end_state =
      findMatchingOption(["Поступово", "Різко", "Мажучий хвіст", "Неоднорідно"], entry.note) || "Поступово";
    prefill.note = entry.note.replace(/Завершення:\s*[^.]*\.?\s*/i, "").trim();
  }

  if (action.type === "mood") {
    prefill.extraValues.mood_level = extractMoodScore(entry.value, 6);
    prefill.value = extractStructuredFreeText(entry.value, [`${prefill.extraValues.mood_level}/10`]);
  }

  if (action.type === "sleep") {
    prefill.extraValues.sleep_duration = extractSleepDuration(entry.value, "7.5 год");
    prefill.extraValues.sleep_quality = extractSleepQualityScore(entry.value, 7);
    prefill.extraValues.sleep_awakenings =
      extractSentenceValue(entry.note, "Пробудження:") ||
      findMatchingOption(["Без пробуджень", "1 раз", "2 рази", "3+ рази"], `${entry.value} ${entry.note}`) ||
      "Без пробуджень";
    prefill.value = extractSleepFreeText(
      entry.value,
      prefill.extraValues.sleep_duration,
      `${prefill.extraValues.sleep_quality}/10`,
    );
    prefill.note = entry.note.replace(/Пробудження:\s*[^.]*\.?\s*/i, "").trim();
  }

  if (action.type === "symptom") {
    prefill.extraValues.symptom_type =
      findMatchingOption(getSymptomTypeOptions(sourceTab), `${entry.title} ${entry.value}`) || getDefaultSymptomType(sourceTab);
    prefill.extraValues.symptom_intensity = extractIntensityScore(entry.value, 4);
    prefill.extraValues.symptom_repeat =
      extractSentenceValue(entry.note, "Повторюваність:") || "Іноді";
    prefill.value = extractStructuredFreeText(entry.value, [
      prefill.extraValues.symptom_type,
      `${prefill.extraValues.symptom_intensity}/10`,
    ]);
    prefill.note = entry.note.replace(/Повторюваність:\s*[^.]*\.?\s*/i, "").trim();
  }

  if (sourceTab === "intimate" && action.type === "pain") {
    prefill.extraValues.pain_type =
      findMatchingOption(getPainTypeOptions(sourceTab), entry.value) || getDefaultPainType(sourceTab);
    prefill.extraValues.pain_context =
      findMatchingOption(["Під час близькості", "Після близькості", "Поза близькістю", "Тазовий дискомфорт"], entry.value) || "Під час близькості";
    prefill.extraValues.pain_level = extractIntensityScore(entry.value, 4);
    prefill.extraValues.pain_repeat = extractSentenceValue(entry.note, "Частота:") || "Іноді";
    prefill.value = extractStructuredFreeText(entry.value, [
      prefill.extraValues.pain_type,
      prefill.extraValues.pain_context,
      `${prefill.extraValues.pain_level}/10`,
    ]);
    prefill.note = entry.note.replace(/Частота:\s*[^.]*\.?\s*/i, "").trim();
  }

  if (sourceTab === "intimate" && action.type === "note") {
    prefill.value = entry.title || entry.value || "";
    prefill.extraValues.intimate_note_mood =
      findMatchingOption(["Спокійне спостереження", "Є занепокоєння", "Треба обговорити з лікарем"], entry.value) || "Спокійне спостереження";
  }

  if (sourceTab === "intimate" && action.type === "question") {
    prefill.value = entry.value || "";
    prefill.extraValues.intimate_question_topic = extractSentenceValue(entry.note, "Тема:") || "Сухість";
    prefill.extraValues.intimate_question_priority = extractSentenceValue(entry.note, "Терміновість:") || "Обговорити на наступному візиті";
    prefill.note = entry.note
      .replace(/Тема:\s*[^.]*\.?\s*/i, "")
      .replace(/Терміновість:\s*[^.]*\.?\s*/i, "")
      .trim();
  }

  if (action.type === "analysis" || action.type === "document") {
    prefill.value = entry.title || "";
  }

  return prefill;
}

function renderRecordExtraFields(config) {
  recordFormSubtitle.textContent = config.subtitle || "";
  recordValueLabel.textContent = config.valueLabel || "Значення";
  recordValueInput.placeholder = config.valuePlaceholder || "";
  recordValueInput.required = Boolean(config.valueRequired);
  recordNoteLabel.textContent = config.noteLabel || "Нотатка";
  recordNoteInput.placeholder = config.notePlaceholder || "";

  const extraFields = config.extraFields || [];
  const topFields = extraFields.slice(0, 1);
  const bottomFields = extraFields.slice(1);

  recordExtraFieldsTop.innerHTML = topFields.map(renderRecordExtraField).join("");
  recordExtraFieldsBottom.innerHTML = bottomFields.map(renderRecordExtraField).join("");

  recordForm.querySelectorAll("[data-range-input]").forEach((input) => {
    updateRangeField(input.dataset.rangeInput);
  });
}

function updateRangeField(fieldId) {
  const input = recordForm.querySelector(`[data-range-input="${fieldId}"]`);
  const output = recordForm.querySelector(`[data-range-output="${fieldId}"]`);
  if (!input || !output) {
    return;
  }

  const min = Number(input.min || 1);
  const max = Number(input.max || 10);
  const progress = ((Number(input.value) - min) / (max - min)) * 100;
  const semanticLabels = parseRangeLabels(input.dataset.rangeLabels);
  input.style.setProperty("--range-progress", `${progress}%`);
  output.textContent = `${input.value}/10 · ${getRangeSemanticLabel(input.value, semanticLabels)}`;
}

function applyRecordExtraPrefill(extraValues = {}) {
  Object.entries(extraValues).forEach(([fieldId, value]) => {
    const element = recordForm.querySelector(`[data-record-extra="${fieldId}"]`);
    if (element && value) {
      element.value = value;
      if (element.dataset.rangeInput) {
        updateRangeField(fieldId);
      }
    }
  });

  recordForm.querySelectorAll("[data-range-input]").forEach((input) => {
    updateRangeField(input.dataset.rangeInput);
  });
}

function resetRecordFormUi() {
  recordFormTitle.textContent = "Додати запис";
  recordFormSubtitle.textContent = "";
  recordValueLabel.textContent = "Значення";
  recordValueInput.placeholder = "Наприклад: короткий опис або важлива деталь";
  recordValueInput.required = true;
  recordNoteLabel.textContent = "Нотатка";
  recordNoteInput.placeholder = "Коротка нотатка про стан або подію";
  recordExtraFieldsTop.innerHTML = "";
  recordExtraFieldsBottom.innerHTML = "";
  saveRecordButton.textContent = "Зберегти запис";
}

function renderRecordExtraField(field) {
  if (field.kind === "file") {
    return `
      <label class="field">
        <span class="field-label">${field.label}</span>
        <input
          type="file"
          data-record-extra="${field.id}"
          ${field.accept ? `accept="${field.accept}"` : ""}
          ${field.required ? "required" : ""}
        />
        ${field.hint ? `<span class="field-hint">${field.hint}</span>` : ""}
      </label>
    `;
  }

  if (field.kind === "select") {
    return `
      <label class="field">
        <span class="field-label">${field.label}</span>
        <select data-record-extra="${field.id}" ${field.required ? "required" : ""}>
          ${field.options
            .map(
              (option) => `
                <option value="${option}" ${option === field.defaultValue ? "selected" : ""}>${option}</option>
              `,
            )
            .join("")}
        </select>
      </label>
    `;
  }

  if (field.kind === "range") {
    const semanticLabels = field.semanticLabels || [];
    return `
      <label class="field range-field">
        <div class="range-header">
          <span class="field-label">${field.label}</span>
          <span class="range-value" data-range-output="${field.id}">${field.defaultValue}/10 · ${getRangeSemanticLabel(field.defaultValue || 5, semanticLabels)}</span>
        </div>
        <div class="range-track">
          <input
            type="range"
            min="${field.min || 1}"
            max="${field.max || 10}"
            step="1"
            value="${field.defaultValue || 5}"
            data-record-extra="${field.id}"
            data-range-input="${field.id}"
            data-range-labels="${semanticLabels.join("|")}"
            ${field.required ? "required" : ""}
          />
        </div>
        <div class="range-ticks" aria-hidden="true">
          <span>1</span>
          <span>5</span>
          <span>10</span>
        </div>
        <div class="range-scale">
          <span>${field.minLabel || "Мін"}</span>
          <span>${field.maxLabel || "Макс"}</span>
        </div>
      </label>
    `;
  }

  return "";
}

function getExtraFieldValue(fieldId) {
  const element = recordForm.querySelector(`[data-record-extra="${fieldId}"]`);
  return element ? element.value.trim() : "";
}

async function buildStructuredPayload(action, sourceTab) {
  const valueInput = recordValueInput.value.trim();
  const noteInput = recordNoteInput.value.trim();

  if (action.type === "bleeding") {
    const intensity = getExtraFieldValue("bleeding_intensity");
    const phase = getExtraFieldValue("bleeding_day_phase");
    return {
      title: "Кровотеча",
      value: buildStructuredValue([`${intensity}/10`, valueInput]),
      note: [phase ? `Найбільше помітно ${phase.toLowerCase()}.` : "", noteInput].filter(Boolean).join(" "),
    };
  }

  if (sourceTab === "cycles" && action.type === "pain") {
    const type = getExtraFieldValue("pain_type");
    const level = getExtraFieldValue("pain_level");
    const repeat = getExtraFieldValue("pain_repeat");
    const zone = getExtraFieldValue("pain_zone");
    return {
      title: "Біль",
      value: buildStructuredValue([type, `${level}/10`, valueInput]),
      note: [repeat ? `Частота: ${repeat.toLowerCase()}.` : "", zone ? `Локалізація: ${zone}.` : "", noteInput].filter(Boolean).join(" "),
    };
  }

  if (action.type === "pain" && sourceTab !== "cycles" && sourceTab !== "intimate") {
    const type = getExtraFieldValue("pain_type");
    const level = getExtraFieldValue("pain_level");
    const repeat = getExtraFieldValue("pain_repeat");
    return {
      title: "Біль",
      value: buildStructuredValue([type, `${level}/10`, valueInput]),
      note: [repeat ? `Частота: ${repeat.toLowerCase()}.` : "", noteInput].filter(Boolean).join(" "),
    };
  }

  if (sourceTab === "cycles" && action.type === "cycle_start") {
    const phase = getExtraFieldValue("cycle_start_phase");
    const flow = getExtraFieldValue("cycle_start_flow");
    return {
      value: valueInput || `День 1 · ${flow.toLowerCase()} потік`,
      note: [phase ? `Почався ${phase.toLowerCase()}.` : "", noteInput].filter(Boolean).join(" "),
    };
  }

  if (sourceTab === "cycles" && action.type === "cycle_end") {
    const endState = getExtraFieldValue("cycle_end_state");
    return {
      value: valueInput || "Цикл завершено",
      note: [endState ? `Завершення: ${endState.toLowerCase()}.` : "", noteInput].filter(Boolean).join(" "),
    };
  }

  if (action.type === "mood") {
    const moodLevel = getExtraFieldValue("mood_level");
    return {
      title: "Настрій",
      value: buildStructuredValue([`${moodLevel}/10`, valueInput]),
      note: noteInput,
    };
  }

  if (action.type === "sleep") {
    const duration = getExtraFieldValue("sleep_duration");
    const quality = getExtraFieldValue("sleep_quality");
    const awakenings = getExtraFieldValue("sleep_awakenings");
    return {
      title: "Сон",
      value: buildStructuredValue([duration, `${quality}/10`, valueInput]),
      note: [awakenings ? `Пробудження: ${awakenings.toLowerCase()}.` : "", noteInput].filter(Boolean).join(" "),
    };
  }

  if (action.type === "symptom") {
    const symptomType = getExtraFieldValue("symptom_type");
    const intensity = getExtraFieldValue("symptom_intensity");
    const repeat = getExtraFieldValue("symptom_repeat");
    return {
      title: "Симптом",
      value: buildStructuredValue([symptomType, `${intensity}/10`, valueInput]),
      note: [repeat ? `Повторюваність: ${repeat.toLowerCase()}.` : "", noteInput].filter(Boolean).join(" "),
    };
  }

  if (sourceTab === "intimate" && action.type === "pain") {
    const type = getExtraFieldValue("pain_type");
    const context = getExtraFieldValue("pain_context");
    const level = getExtraFieldValue("pain_level");
    const repeat = getExtraFieldValue("pain_repeat");
    return {
      title: "Біль",
      value: buildStructuredValue([type, context, `${level}/10`, valueInput]),
      note: [repeat ? `Частота: ${repeat.toLowerCase()}.` : "", noteInput].filter(Boolean).join(" "),
    };
  }

  if (sourceTab === "intimate" && action.type === "note") {
    const mood = getExtraFieldValue("intimate_note_mood");
    return {
      title: valueInput || "Приватна інтимна нотатка",
      value: mood || action.value,
      note: noteInput,
    };
  }

  if (sourceTab === "intimate" && action.type === "question") {
    const topic = getExtraFieldValue("intimate_question_topic");
    const priority = getExtraFieldValue("intimate_question_priority");
    return {
      title: "Питання до лікаря",
      value: valueInput,
      note: [topic ? `Тема: ${topic}.` : "", priority ? `Терміновість: ${priority}.` : "", noteInput].filter(Boolean).join(" "),
    };
  }

  if (action.type === "energy") {
    const level = getExtraFieldValue("energy_level");
    return {
      title: "Енергія",
      value: buildStructuredValue([`${level}/10`, valueInput]),
      note: noteInput,
    };
  }

  if (action.type === "discharge") {
    const type = getExtraFieldValue("discharge_type");
    const amount = getExtraFieldValue("discharge_amount");
    const smell = getExtraFieldValue("discharge_smell");
    return {
      title: "Виділення",
      value: buildStructuredValue([type, amount, valueInput]),
      note: [smell && smell !== "Без запаху" ? `Запах: ${smell.toLowerCase()}.` : "", noteInput].filter(Boolean).join(" "),
    };
  }

  if (action.type === "libido") {
    const level = getExtraFieldValue("libido_level");
    const activity = getExtraFieldValue("libido_activity");
    return {
      title: "Лібідо / секс",
      value: buildStructuredValue([`${level}/10`, activity, valueInput]),
      note: noteInput,
    };
  }

  if (action.type === "medication") {
    const dose = getExtraFieldValue("medication_dose");
    const frequency = getExtraFieldValue("medication_frequency");
    return {
      title: valueInput || "Ліки / добавки",
      value: buildStructuredValue([dose, frequency]),
      note: noteInput,
    };
  }

  if (action.type === "analysis" || action.type === "document") {
    const existingEntry =
      state.draftActionMeta?.mode === "edit" && state.draftActionMeta?.entryId
        ? state.entries.find((entry) => String(entry.id) === String(state.draftActionMeta.entryId)) || null
        : null;
    const attachment = (await readAttachmentField("attachment_file")) || existingEntry?.attachment || null;

    if (!attachment) {
      throw new Error("attachment_required");
    }

    return {
      title: valueInput || attachment.name || action.title,
      value: `Прикріплено: ${attachment.name}`,
      note: noteInput,
      attachment,
    };
  }

  return {
    value: valueInput,
    note: noteInput,
  };
}

function openEditEntryFlow(entry) {
  const sourceTab = inferSourceTabFromEntry(entry);
  const action = getActionByType(entry.type);
  const formConfig = getRecordFormConfig(action, sourceTab);
  const prefill = getRecordFormPrefill(action, sourceTab, entry);

  state.draftActionType = action.type;
  state.draftActionMeta = {
    sourceTab,
    presetDate: entry.date,
    formConfig,
    mode: "edit",
    entryId: String(entry.id),
  };

  recordFormTitle.textContent = `Редагувати: ${typeLabels[action.type] || action.title}`;
  recordValueInput.value = prefill.value || "";
  recordNoteInput.value = prefill.note || "";
  recordDateInput.value = toDateTimeLocalValue(entry.date);
  renderRecordExtraFields(formConfig);
  applyRecordExtraPrefill(prefill.extraValues);
  if (entry.attachment?.name && ["document", "analysis"].includes(action.type)) {
    const attachmentInput = recordForm.querySelector('[data-record-extra="attachment_file"]');
    if (attachmentInput) {
      attachmentInput.required = false;
    }
  }
  recordFormSubtitle.textContent =
    entry.attachment?.name && ["document", "analysis"].includes(action.type)
      ? `Поточний файл: ${entry.attachment.name}. Якщо обереш новий, він замінить вкладення в записі.`
      : "Зміни одразу оновлять запис у журналі та пов'язаних модулях.";
  saveRecordButton.textContent = "Зберегти зміни";

  if (entryDetailSheet.open) {
    entryDetailSheet.close();
  }

  if (cycleDaySheet.open) {
    cycleDaySheet.close();
  }

  if (composerSheet.open) {
    composerSheet.close();
  }

  recordFormSheet.showModal();
  syncAddRecordScrollLock();
}

function openCreateEntryFlow(action, meta = {}) {
  if (action.type === "cycle_start" && getActiveCycleStart()) {
    showToast("Спочатку заверши поточний цикл.");
    return;
  }

  const sourceTab = meta.sourceTab || state.activeTab;
  const presetDate =
    meta.presetDate ||
    (sourceTab === "cycles" ? getSelectedCycleDateTimeIso() : getNowIso());
  const formConfig = getRecordFormConfig(action, sourceTab);

  state.draftActionType = action.type;
  state.draftActionMeta = {
    sourceTab,
    presetDate,
    formConfig,
    mode: "create",
  };
  recordFormTitle.textContent = action.title;
  recordFormSubtitle.textContent = formConfig.subtitle || "";
  recordValueInput.value = formConfig.valueRequired === false ? "" : action.value || "";
  recordNoteInput.value = action.note || "";
  recordDateInput.value = toDateTimeLocalValue(presetDate);
  renderRecordExtraFields(formConfig);
  saveRecordButton.textContent = "Зберегти запис";

  if (composerSheet.open) {
    composerSheet.close();
  }

  if (cycleDaySheet.open) {
    cycleDaySheet.close();
  }

  recordFormSheet.showModal();
  syncAddRecordScrollLock();
}

async function addEntry(action, overrides = {}) {
  const now = Date.now();
  const signature = `${action.type}:${state.activeTab}:${state.uiTest.context}:${state.uiTest.dataMode}`;

  if (state.lastActionSignature === signature && now - state.lastActionAt < 900) {
    return;
  }

  state.lastActionSignature = signature;
  state.lastActionAt = now;

  const context = getCurrentContext().mode;
  const eventTitles = {
    cycle_start: "Цикл почався",
    cycle_end: "Цикл завершився",
    pregnancy_confirmed: "Вагітність підтверджено",
    birth: "Пологи зафіксовано",
    pregnancy_end: "Вагітність завершено",
    recovery_end: "Відновлення завершено",
  };

  const entry = {
    id: createJournalEntryId(),
    type: action.type,
    title: overrides.title ?? eventTitles[action.type] ?? action.title,
    value: overrides.value ?? action.value,
    note: overrides.note ?? action.note,
    date: overrides.date ?? getNowIso(),
    tags: resolveTags(action.type, overrides.sourceTab),
    context,
    attachment: overrides.attachment ?? null,
  };

  state.entries.unshift(entry);
  sortEntries();
  await persistEntries();
  if (entry.tags.includes("cycle")) {
    state.selectedCycleDate = toLocalDateKey(entry.date);
    state.cycleMonthCursor = toMonthCursorKey(entry.date);
  }
  render();

  const contextAfter = getCurrentContext();
  const message =
    actionCatalog.event.some((item) => item.type === action.type)
      ? `${entry.title}. Активний контекст: ${contextAfter.title}.`
      : `${entry.title} збережено в єдиному журналі.`;

  showToast(message);
}

function resolveTags(type, sourceTab = "") {
  const isIntimateSource = sourceTab === "intimate";
  const map = {
    symptom: isIntimateSource ? ["intimate", "symptom"] : ["symptom"],
    pain:
      sourceTab === "cycles"
        ? ["cycle", "symptom"]
        : isIntimateSource
          ? ["intimate", "symptom"]
          : ["symptom"],
    bleeding: ["cycle", "symptom"],
    discharge: isIntimateSource ? ["intimate", "symptom"] : ["symptom"],
    mood: ["daily"],
    sleep: ["daily"],
    energy: ["daily"],
    libido: isIntimateSource ? ["intimate", "daily"] : ["daily"],
    medication: ["daily", "doctor"],
    note: isIntimateSource ? ["intimate", "daily"] : ["daily"],
    appointment: ["doctor"],
    question: isIntimateSource ? ["intimate", "doctor"] : ["doctor"],
    analysis: ["record", "doctor"],
    document: ["record", "doctor"],
    cycle_start: ["cycle", "event"],
    cycle_end: ["cycle", "event"],
    pregnancy_confirmed: ["pregnancy", "event"],
    birth: ["recovery", "event"],
    pregnancy_end: ["pregnancy", "event"],
    recovery_end: ["recovery", "event"],
  };

  return map[type] || ["daily"];
}

function getDisplayType(type) {
  return typeLabels[type] || type;
}

function getDisplayContext(context) {
  return contextLabels[context] || context;
}

function getEntryHighlight(entry) {
  const value = normalizeLegacyScaleText(entry.value).trim();

  if (entry.type === "pain") {
    const level = value.match(/\b(10|[1-9])\/10\b/i)?.[0] || value.match(/\b[1-5]\/5\b/i)?.[0];
    return level || value || null;
  }

  if (entry.type === "bleeding") {
    const level = value.match(/\b(10|[1-9])\/10\b/i)?.[0];
    return level || `${extractIntensityScore(value, 5)}/10`;
  }

  if (entry.type === "sleep") {
    return extractSleepDuration(value, "7.5 год");
  }

  if (entry.type === "mood") {
    return value.match(/\b(10|[1-9])\/10\b/i)?.[0] || `${extractMoodScore(value, 6)}/10`;
  }

  if (entry.type === "symptom") {
    return value.match(/\b(10|[1-9])\/10\b/i)?.[0] || value || null;
  }

  if (entry.type === "energy") {
    return value.match(/\b(10|[1-9])\/10\b/i)?.[0] || `${extractIntensityScore(value, 6)}/10`;
  }

  if (entry.type === "discharge") {
    return value.split("·")[0]?.trim() || "Виділення";
  }

  if (entry.type === "libido") {
    return value.match(/\b(10|[1-9])\/10\b/i)?.[0] || null;
  }

  if (entry.type === "medication") {
    return "Прийом";
  }

  if (entry.type === "cycle_start") {
    return value.includes("День 1") ? "День 1" : "Старт";
  }

  if (entry.type === "cycle_end") {
    return "Фініш";
  }

  if (entry.type === "question") {
    return "До лікаря";
  }

  if (entry.type === "appointment") {
    return "Візит";
  }

  if (entry.type === "analysis") {
    return "Результат";
  }

  if (entry.type === "document") {
    return "Файл";
  }

  if (entry.type === "pregnancy_confirmed" || entry.type === "birth" || entry.type === "pregnancy_end" || entry.type === "recovery_end") {
    return "Подія";
  }

  return null;
}

function renderEntryHighlight(entry) {
  const highlight = getEntryHighlight(entry);
  return highlight ? `<span class="pill" data-entry-tone="${getEntryTone(entry)}">${highlight}</span>` : "";
}

function getEntryDisplayValue(entry) {
  if (entry.type === "bleeding") {
    const value = normalizeLegacyScaleText(entry.value);
    const level = value.match(/\b(10|[1-9])\/10\b/i)?.[0] || `${extractIntensityScore(value, 5)}/10`;
    const details = extractBleedingFreeText(value, extractIntensityScore(value, 5));
    return buildStructuredValue([level, details]);
  }

  if (entry.type === "sleep") {
    const value = normalizeLegacyScaleText(entry.value);
    const duration = extractSleepDuration(value, "7.5 год");
    const quality = value.match(/\b(10|[1-9])\/10\b/i)?.[0] || `${extractSleepQualityScore(value, 7)}/10`;
    const details = extractSleepFreeText(value, duration, quality);
    return buildStructuredValue([duration, quality, details]);
  }

  if ((entry.type === "analysis" || entry.type === "document") && entry.attachment?.name) {
    return entry.attachment.name;
  }

  return normalizeLegacyScaleText(entry.value);
}

function getEntryTone(entry) {
  if (entry.type === "pain") {
    return "pain";
  }

  if (entry.type === "bleeding") {
    return "bleeding";
  }

  if (entry.type === "sleep") {
    return "sleep";
  }

  if (entry.type === "mood") {
    return "mood";
  }

  if (entry.type === "symptom") {
    return entry.tags.includes("intimate") ? "intimate" : "symptom";
  }

  if (entry.type === "discharge") {
    return "intimate";
  }

  if (entry.type === "energy") {
    return "mood";
  }

  if (entry.type === "libido") {
    return "intimate";
  }

  if (entry.type === "medication") {
    return "doctor";
  }

  if (entry.type === "note") {
    return entry.tags.includes("intimate") ? "intimate" : "note";
  }

  if (["appointment", "analysis", "document", "question"].includes(entry.type)) {
    return "doctor";
  }

  if (["cycle_start", "cycle_end"].includes(entry.type)) {
    return "cycle";
  }

  if (["pregnancy_confirmed", "pregnancy_end"].includes(entry.type)) {
    return "pregnancy";
  }

  if (["birth", "recovery_end"].includes(entry.type)) {
    return "recovery";
  }

  return "default";
}

function getEntryById(id) {
  return getEntries().find((entry) => String(entry.id) === String(id)) || null;
}

function renderMetricCard(iconName, label, value) {
  return `
    <div class="metric">
      <div class="metric-top">
        ${icon(iconName, "metric-icon")}
        <span class="muted">${label}</span>
      </div>
      <strong>${value}</strong>
    </div>
  `;
}

function renderInsightItem(iconName, title, text) {
  return `
    <div class="list-item">
      ${icon(iconName, "list-icon")}
      <div>
        <strong>${title}</strong>
        <span class="detail-copy">${text}</span>
      </div>
    </div>
  `;
}

function isDoctorEntry(entry) {
  return ["appointment", "analysis", "question", "document"].includes(entry.type);
}

function renderHomeRecentEntry(entry) {
  return `
    <article class="entry-card intimate-entry-card" data-entry-id="${entry.id}" data-entry-tone="${getEntryTone(entry)}">
      <div class="entry-title-row">
        <div class="entry-main">
          <div class="entry-icon-wrap" data-entry-tone="${getEntryTone(entry)}">
            ${icon(iconByType[entry.type] || "journal", "entry-icon")}
          </div>
          <div>
            <p class="entry-title">${entry.title}</p>
            <div class="entry-meta">
              <span class="detail-copy">${toTime(entry.date)}</span>
            </div>
          </div>
        </div>
        ${renderEntryHighlight(entry)}
      </div>
      <p class="hero-subtitle">${getEntryDisplayValue(entry)}</p>
      ${entry.note ? `<p class="detail-copy">${entry.note}</p>` : ""}
    </article>
  `;
}

function renderRecentIntimateEntry(entry) {
  return `
    <article class="entry-card intimate-entry-card" data-entry-id="${entry.id}" data-entry-tone="${getEntryTone(entry)}">
      <div class="entry-title-row">
        <div class="entry-main">
          <div class="entry-icon-wrap" data-entry-tone="${getEntryTone(entry)}">
            ${icon(iconByType[entry.type] || "intimate", "entry-icon")}
          </div>
          <div>
            <p class="entry-title">${entry.title}</p>
            <div class="entry-meta">
              <span class="detail-copy">${toLongDateTime(entry.date)}</span>
            </div>
          </div>
        </div>
        ${renderEntryHighlight(entry)}
      </div>
      <p class="hero-subtitle">${getEntryDisplayValue(entry)}</p>
      <p class="detail-copy">${entry.note}</p>
    </article>
  `;
}

function renderHome() {
  const entries = getEntries();
  const context = getCurrentContext();
  const stats = getJournalStats();
  const cycleDay = getCurrentCycleDay();
  const todayKey = toLocalDateKey(new Date());
  const todayEntries = getEntriesForDate(todayKey).slice(0, 3);
  const todayCycleEntries = todayEntries.filter((entry) =>
    entry.tags.includes("cycle") || ["cycle_start", "cycle_end", "bleeding", "pain"].includes(entry.type),
  );
  const latestSymptomEntry =
    entries.find((entry) => ["symptom", "pain", "bleeding", "sleep", "mood"].includes(entry.type)) || null;
  const latestDoctorEntry = entries.find((entry) => isDoctorEntry(entry)) || null;
  const doctorEntries = entries.filter((entry) => isDoctorEntry(entry));
  const appointmentEntries = doctorEntries.filter((entry) => entry.type === "appointment");
  const questionEntries = doctorEntries.filter((entry) => entry.type === "question");
  const documentEntries = doctorEntries.filter((entry) => ["analysis", "document"].includes(entry.type));
  const intimateSignals = getIntimateSignals();
  const topRecurringIntimate = intimateSignals.recurringItems[0] || null;
  const todaySummary =
    todayEntries.length > 0
      ? `Сьогодні вже є ${todayEntries.length} ${todayEntries.length === 1 ? "запис" : todayEntries.length < 5 ? "записи" : "записів"} у журналі.`
      : "Сьогодні ще немає записів у журналі.";
  const cycleAttentionText = cycleDay
    ? todayCycleEntries.length > 0
      ? `Зараз день циклу ${cycleDay}. За сьогодні вже є ${todayCycleEntries.length} записів, пов'язаних із циклом.`
      : `Зараз день циклу ${cycleDay}. Стан циклу активний, але за сьогодні ще немає окремих записів.`
    : "Цикл не активний. Додай старт, коли почнеться.";
  const latestSignalText = latestSymptomEntry
    ? `${latestSymptomEntry.title} · ${getEntryDisplayValue(latestSymptomEntry)} · ${toLongDateTime(latestSymptomEntry.date)}`
    : "Поки немає записів про самопочуття.";
  const doctorFocusText = latestDoctorEntry
    ? `${latestDoctorEntry.title} · ${getEntryDisplayValue(latestDoctorEntry)}`
    : "Поки немає медичних записів.";
  const readinessText =
    doctorEntries.length > 0
      ? `Уже є ${doctorEntries.length} ${doctorEntries.length === 1 ? "елемент" : doctorEntries.length < 5 ? "елементи" : "елементів"} для підготовки до лікаря.`
      : "Підсумок поки порожній.";
  const recurringInsightText = topRecurringIntimate
    ? `${topRecurringIntimate[0]} повторювався ${topRecurringIntimate[1]} рази, тож його вже варто тримати в полі зору.`
    : intimateSignals.latest
      ? `Останній інтимний запис: ${toLongDateTime(intimateSignals.latest.date)}.`
      : "Поки немає повторюваних інтимних сигналів.";
  const heroLiveLine =
    todayEntries.length > 0
      ? `Сьогодні в журналі вже ${todayEntries.length} ${todayEntries.length === 1 ? "запис" : todayEntries.length < 5 ? "записи" : "записів"}.`
      : latestSymptomEntry
        ? `Останній запис: ${latestSymptomEntry.title} · ${getEntryDisplayValue(latestSymptomEntry)}`
        : "Додай перший запис за сьогодні.";

  const heroDetails = {
    base: {
      status: cycleDay ? `День циклу ${cycleDay}` : "Цикл не активний",
      badge: "Базовий режим",
      badgeIcon: "cycle",
    },
    pregnancy: {
      status: "12 тиждень",
      badge: "Вагітність",
      badgeIcon: "pregnancy",
    },
    recovery: {
      status: "3 тиждень відновлення",
      badge: "Відновлення",
      badgeIcon: "recovery",
    },
  };

  const hero = heroDetails[context.mode];

  return `
    <section class="screen active" data-screen="home">
      <div class="stack">
        <section class="card hero-card">
          <div class="hero-glow"></div>
          <div class="hero-topline">
            <p class="eyebrow">${toDateParts(getNowIso())}</p>
            <span class="badge">${icon(hero.badgeIcon, "badge-icon")}<span>${hero.badge}</span></span>
          </div>
          <div class="hero-main">
            <div>
              <p class="hero-title">${hero.status}</p>
              <p class="hero-subtitle">${heroLiveLine}</p>
            </div>
            <div class="hero-orb">
              ${icon(hero.badgeIcon, "hero-orb-icon")}
            </div>
          </div>
          <div class="hero-strip">
            <div class="hero-pill">${icon("journal", "mini-icon")}Єдиний журнал</div>
            <div class="hero-pill">${icon("shield", "mini-icon")}Приватність</div>
            <div class="hero-pill">${icon("summary", "mini-icon")}Підсумки</div>
          </div>
        </section>

        <div class="section-header">
          <div>
            <h2 class="section-title">Сьогоднішній контекст</h2>
            <p class="section-subtitle">${context.description}</p>
          </div>
          <button class="small-button primary-button" type="button" data-summary-trigger="true">
            ${icon("summary", "button-icon")}Підсумок
          </button>
        </div>

        <section class="card">
          <div class="section-header">
            <div>
              <h3>Сьогодні</h3>
              <p class="section-subtitle">${todaySummary}</p>
            </div>
          </div>
          ${
            todayEntries.length > 0
              ? `<div class="list-block">${todayEntries.map((entry) => renderHomeRecentEntry(entry)).join("")}</div>`
              : `<div class="list-block">${renderInsightItem("journal", "Ще немає записів", "Додай перший запис за сьогодні.")}</div>`
          }
        </section>

        <section class="card">
          <div class="section-header">
            <div>
              <h3>Потребує уваги</h3>
              <p class="section-subtitle">Зміни, які варто помітити.</p>
            </div>
          </div>
          <div class="list-block">
            ${renderInsightItem("cycle", cycleDay ? `День циклу ${cycleDay}` : "Контекст циклу", cycleAttentionText)}
            ${renderInsightItem("spark", latestSymptomEntry ? "Останній сигнал" : "Сигнали дня", latestSignalText)}
            ${renderInsightItem("calendar", latestDoctorEntry ? "Останній медичний крок" : "Медичний фокус", doctorFocusText)}
          </div>
        </section>

        <section class="card">
          <div class="section-header">
            <div>
              <h3>Зріз за 30 днів</h3>
              <p class="section-subtitle">Що відбувалось за останній місяць.</p>
            </div>
          </div>
          <div class="metrics">
            ${renderMetricCard("journal", "Записи", stats.total)}
            ${renderMetricCard("spark", "Симптоми", stats.symptoms)}
            ${renderMetricCard("summary", "Для лікаря", stats.doctor)}
          </div>
        </section>

        <section class="card">
          <div class="section-header">
            <div>
              <h3>Для лікаря</h3>
              <p class="section-subtitle">Готовність до наступного візиту.</p>
            </div>
            <button class="small-button primary-button" type="button" data-summary-trigger="true">
              ${icon("summary", "button-icon")}Підсумок
            </button>
          </div>
          <div class="metrics">
            ${renderMetricCard("calendar", "Прийоми", appointmentEntries.length)}
            ${renderMetricCard("question", "Питання", questionEntries.length)}
            ${renderMetricCard("document", "Документи", documentEntries.length)}
          </div>
          <div class="list-block">
            ${renderInsightItem("summary", "Готовність підсумку", readinessText)}
            ${renderInsightItem("intimate", "Повторюваний сигнал", recurringInsightText)}
            ${
              latestDoctorEntry
                ? renderInsightItem("calendar", latestDoctorEntry.title, `${getEntryDisplayValue(latestDoctorEntry)}${latestDoctorEntry.note ? ` · ${latestDoctorEntry.note}` : ""}`)
                : renderInsightItem("calendar", "Немає медичних записів", "Додай прийом, аналіз або питання до лікаря.")
            }
          </div>
        </section>
      </div>
    </section>
  `;
}

function renderJournal() {
  const entries = getEntries();
  const filters = [
    ["all", "Усе"],
    ["symptoms", "Симптоми"],
    ["bleeding", "Кровотеча"],
    ["intimate", "Інтимне"],
    ["doctor", "Для лікаря"],
    ["events", "Ключові події"],
  ];

  const grouped = groupEntries(filterEntries());
  const groupsHtml = Object.entries(grouped)
    .map(
      ([date, entries]) => `
        <div class="timeline-group">
          <div class="timeline-date">${date}</div>
          <div class="timeline-track">
            ${entries
              .map(
                (entry) => `
                  <div class="timeline-entry">
                    <div class="timeline-marker">
                      <div class="entry-icon-wrap timeline-icon-wrap" data-entry-tone="${getEntryTone(entry)}">
                        ${icon(iconByType[entry.type] || "journal", "entry-icon")}
                      </div>
                    </div>
                    <article class="entry-card journal-entry-card" data-entry-id="${entry.id}" data-entry-tone="${getEntryTone(entry)}">
                      <div class="entry-title-row">
                        <div class="entry-main">
                          <div>
                            <p class="entry-title">${entry.title}</p>
                            <div class="entry-meta">
                              <span class="detail-copy">${toLongDateTime(entry.date)}</span>
                            </div>
                          </div>
                        </div>
                        ${renderEntryHighlight(entry)}
                      </div>
                      <p class="hero-subtitle">${getEntryDisplayValue(entry)}</p>
                      <p class="detail-copy">${entry.note}</p>
                    </article>
                  </div>
                `,
              )
              .join("")}
          </div>
        </div>
      `,
    )
    .join("");

  return `
    <section class="screen active" data-screen="journal">
      <div class="stack">
        <div class="section-header">
          <div>
            <h2 class="section-title">Журнал здоров'я</h2>
          </div>
          <span class="badge">${icon("journal", "badge-icon")}<span>${entries.length} записів</span></span>
        </div>

        <div class="journal-search-wrap">
          <input class="journal-search" type="search" placeholder="Пошук у журналі..." value="${state.journalSearch}" data-journal-search="true" />
        </div>

        <div class="filters">
          ${filters
            .map(
              ([id, label]) => `
                <button class="filter-chip ${state.activeFilter === id ? "active" : ""}" data-filter="${id}" type="button">
                  ${label}
                </button>
              `,
            )
            .join("")}
        </div>

        <section class="card">
          <div class="stack">${groupsHtml || '<p class="detail-copy">Для цього фільтра поки немає записів.</p>'}</div>
        </section>
      </div>
    </section>
  `;
}

function renderCycleOverviewMetric(iconName, label, value, note) {
  return `
    <div class="cycle-overview-card">
      <div class="metric-top">
        ${icon(iconName, "metric-icon")}
        <span class="muted">${label}</span>
      </div>
      <strong>${value}</strong>
      <span class="detail-copy">${note}</span>
    </div>
  `;
}

function renderCycleDayLog(entry) {
  return `
    <article class="entry-card cycle-log-card" data-entry-id="${entry.id}" data-entry-tone="${getEntryTone(entry)}">
      <div class="entry-title-row">
        <div class="entry-main">
          <div class="entry-icon-wrap" data-entry-tone="${getEntryTone(entry)}">
            ${icon(iconByType[entry.type] || "journal", "entry-icon")}
          </div>
          <div>
            <p class="entry-title">${entry.title}</p>
            <div class="entry-meta">
              <span class="detail-copy">${toLongDateTime(entry.date)}</span>
            </div>
          </div>
        </div>
        ${renderEntryHighlight(entry)}
      </div>
      <p class="hero-subtitle">${getEntryDisplayValue(entry)}</p>
      <p class="detail-copy">${entry.note}</p>
    </article>
  `;
}

function renderCycles() {
  const cycleMetrics = getCycleMetrics();
  const activeCycleDay = getCurrentCycleDay();
  const selectedDateKey = state.selectedCycleDate || toLocalDateKey(new Date());
  const selectedDate = fromLocalDateKey(selectedDateKey);
  const selectedDateEntries = getCycleEntriesForDate(selectedDateKey).sort((a, b) => new Date(b.date) - new Date(a.date));
  const selectedRange = getCycleRangeForDate(selectedDateKey, cycleMetrics.cycleSeries);
  const selectedCycleDay = selectedRange ? diffInDays(selectedRange.start.date, selectedDate) + 1 : null;
  const monthCursor = state.cycleMonthCursor || toMonthCursorKey(new Date());
  const calendarDays = getCycleCalendarDays(monthCursor);
  const selectedBleeding = selectedDateEntries.filter((entry) => entry.type === "bleeding").length;
  const selectedPain = selectedDateEntries.filter((entry) => entry.type === "pain").length;

  const calendarHtml = calendarDays
    .map((day) => {
      const markerItems = [
        day.markerTypes.start ? '<span class="cycle-day-dot start" aria-hidden="true"></span>' : "",
        day.markerTypes.bleeding ? '<span class="cycle-day-dot bleeding" aria-hidden="true"></span>' : "",
        day.markerTypes.pain ? '<span class="cycle-day-dot pain" aria-hidden="true"></span>' : "",
        day.markerTypes.end ? '<span class="cycle-day-dot end" aria-hidden="true"></span>' : "",
      ]
        .filter(Boolean)
        .join("");

      return `
        <button
          class="calendar-cell cycle-day-button ${day.isSelected ? "selected" : ""} ${day.isToday ? "today" : ""} ${day.inMonth ? "" : "muted-day"} ${day.entryCount ? "has-data" : ""} ${day.inCycle ? "in-cycle" : ""} ${day.isCycleStart ? "cycle-start" : ""} ${day.isCycleEnd ? "cycle-end" : ""} ${day.isActiveCycle ? "active-cycle" : ""}"
          data-cycle-date="${day.dateKey}"
          type="button"
        >
          <span class="cycle-day-inner">
            <strong class="cycle-day-number">${day.date.getDate()}</strong>
            ${day.cycleDay ? `<span class="cycle-day-phase">д${day.cycleDay}</span>` : ""}
          </span>
        </button>
      `;
    })
    .join("");

  const activeSummary = cycleMetrics.activeSeries
    ? `У поточному циклі вже ${cycleMetrics.bleedingThisCycle} записів кровотечі та ${cycleMetrics.painThisCycle} записи болю.`
    : "Активний цикл ще не відкритий або вже завершений, але модуль готовий до наступного старту.";

  const trendItems = [
    {
      iconName: "trend",
      title: "Середня довжина циклу",
      text:
        cycleMetrics.averageCycleLength !== null
          ? `${cycleMetrics.averageCycleLength} днів на основі ${cycleMetrics.cycleSeries.filter((series) => series.cycleLengthDays).length} зафіксованих інтервалів між стартами.`
          : "Поки недостатньо стартів циклу, щоб показати надійну середню довжину.",
    },
    {
      iconName: "pain",
      title: "Біль на старті циклу",
      text:
        cycleMetrics.earlyPainSignals > 0
          ? `У ${cycleMetrics.earlyPainSignals} циклах біль фіксувався в перші 1-3 дні після старту.`
          : "Поки недостатньо повторень, щоб показати стабільний патерн болю на старті.",
    },
    {
      iconName: "drop",
      title: "Поточна активність",
      text: activeSummary,
    },
  ];

  const historyHtml = cycleMetrics.cycleSeries.length
    ? cycleMetrics.cycleSeries.slice(0, 4).map((series) => {
      const rangeLabel = series.end
        ? `${toLongDate(series.start.date)} - ${toLongDate(series.end.date)}`
        : `${toLongDate(series.start.date)} - триває`;
      const meta = [
        `Кровотеча: ${series.bleedingCount}`,
        `Біль: ${series.painCount}`,
        series.cycleLengthDays ? `Інтервал: ${series.cycleLengthDays} днів` : "Інтервал збирається",
      ].join(" · ");

      return `
        <article class="trend-item cycle-history-item">
          <div class="trend-top">
            ${icon(series.active ? "cycle" : "calendar", "trend-icon")}
            <strong>${series.active ? "Поточний цикл" : "Попередній цикл"}</strong>
          </div>
          <span class="detail-copy">${rangeLabel}</span>
          <div class="cycle-history-meta">
            <span class="entry-tag">${meta}</span>
          </div>
        </article>
      `;
    }).join("")
    : `
      <div class="empty-cycle-state">
        <strong>Ще немає історії циклів</strong>
        <p class="detail-copy">Почни з події “Початок циклу”, і модуль одразу збиратиме хронологію, дні циклу та денні записи.</p>
      </div>
    `;

  return `
    <section class="screen active" data-screen="cycles">
      <div class="stack">
        <section class="card hero-card">
          <div class="hero-glow"></div>
          <div class="hero-topline">
            <p class="eyebrow">Модуль циклів</p>
            <span class="badge">${icon("cycle", "badge-icon")}<span>${cycleMetrics.cycleSeries.length || 0} циклів в історії</span></span>
          </div>
          <div class="hero-main">
            <div>
              <p class="hero-title">${activeCycleDay ? `День ${activeCycleDay}` : "Цикл не активний"}</p>
              <p class="hero-subtitle">Календар, кровотеча, біль і денні записи в одному місці.</p>
              <p class="hero-subtitle">${activeSummary}</p>
            </div>
            <div class="hero-orb">
              ${icon("cycle", "hero-orb-icon")}
            </div>
          </div>
          <div class="hero-strip">
            <div class="hero-pill">${icon("calendar", "mini-icon")}Інтерактивний календар</div>
            <div class="hero-pill">${icon("drop", "mini-icon")}Кровотеча по днях</div>
            <div class="hero-pill">${icon("pain", "mini-icon")}Симптоми циклу</div>
          </div>
        </section>

        <section class="card">
          <div class="section-header">
            <div>
              <h3>Огляд циклу</h3>
              <p class="section-subtitle">Ключові показники поточного циклу.</p>
            </div>
          </div>
          <div class="cycle-overview-grid">
            ${renderCycleOverviewMetric("cycle", "Статус", activeCycleDay ? `День ${activeCycleDay}` : "Очікує старт", activeCycleDay ? "Активний цикл." : "Зафіксуй старт.")}
            ${renderCycleOverviewMetric("calendar", "Останній старт", cycleMetrics.latestStart ? toLongDate(cycleMetrics.latestStart.date) : "Немає", cycleMetrics.latestStart ? toTime(cycleMetrics.latestStart.date) : "—")}
            ${renderCycleOverviewMetric("drop", "Кровотеча", cycleMetrics.bleedingDaysThisCycle ? `${cycleMetrics.bleedingDaysThisCycle} дн.` : `${cycleMetrics.bleedingThisCycle} зап.`, activeCycleDay ? "У поточному циклі." : "—")}
            ${renderCycleOverviewMetric("trend", "Середня", cycleMetrics.averageCycleLength ? `${cycleMetrics.averageCycleLength} дн.` : "—", cycleMetrics.isRegular !== null ? (cycleMetrics.isRegular ? "Регулярний" : "Нерегулярний") : "Мало даних.")}
          </div>
        </section>

        <div class="chip-row">
          <button class="chip" data-action-type="cycle_start" type="button">
            <div class="chip-head">
              ${icon("cycle", "chip-icon")}
              <strong>Початок циклу</strong>
            </div>
            <span>Зафіксувати старт нового циклу</span>
          </button>
          <button class="chip" data-action-type="bleeding" type="button">
            <div class="chip-head">
              ${icon("drop", "chip-icon")}
              <strong>Додати кровотечу</strong>
            </div>
            <span>Швидкий запис інтенсивності</span>
          </button>
          <button class="chip" data-action-type="pain" type="button">
            <div class="chip-head">
              ${icon("pain", "chip-icon")}
              <strong>Додати біль</strong>
            </div>
            <span>Спазми, чутливість або дискомфорт</span>
          </button>
          <button class="chip" data-action-type="cycle_end" type="button">
            <div class="chip-head">
              ${icon("note", "chip-icon")}
              <strong>Завершити цикл</strong>
            </div>
            <span>Закрити активний цикл подією</span>
          </button>
        </div>

        <section class="card">
          <div class="section-header cycle-calendar-header">
            <div>
              <h3>Календар циклу</h3>
              <p class="section-subtitle">Вибери день, щоб побачити записи.</p>
            </div>
            <button class="small-button" data-cycle-month="today" type="button">Сьогодні</button>
          </div>
          <div class="calendar-frame">
            <div class="calendar-month-nav">
              <button class="small-button calendar-nav-button" data-cycle-month="prev" type="button" aria-label="Попередній місяць">
                ${icon("chevronLeft", "button-icon")}
              </button>
              <div class="calendar-month-title">${toMonthLabel(monthCursor)}</div>
              <button class="small-button calendar-nav-button" data-cycle-month="next" type="button" aria-label="Наступний місяць">
                ${icon("chevronRight", "button-icon")}
              </button>
            </div>
            <div class="calendar-weekdays">
              <span>Пн</span>
              <span>Вт</span>
              <span>Ср</span>
              <span>Чт</span>
              <span>Пт</span>
              <span>Сб</span>
              <span>Нд</span>
            </div>
            <div class="calendar-grid cycle-calendar-grid">${calendarHtml}</div>
            <div class="cycle-legend">
              <span class="cycle-day-marker range">Період циклу</span>
              <span class="cycle-day-marker start">Старт</span>
              <span class="cycle-day-marker bleeding">Кров</span>
              <span class="cycle-day-marker pain">Біль</span>
              <span class="cycle-day-marker end">Фініш</span>
            </div>
          </div>
        </section>

        <section class="card">
          <div class="section-header">
            <div>
              <h3>Вибраний день</h3>
              <p class="section-subtitle">Записи за обрану дату.</p>
            </div>
            <span class="badge">${icon("calendar", "badge-icon")}<span>${toLongDate(selectedDate)}</span></span>
          </div>
          <div class="cycle-day-summary">
            <div class="cycle-day-stats">
              <div class="cycle-day-stat">
                <span class="muted">Статус дня</span>
                <strong>${selectedCycleDay ? `День циклу ${selectedCycleDay}` : "Поза активним циклом"}</strong>
              </div>
              <div class="cycle-day-stat">
                <span class="muted">Записів</span>
                <strong>${selectedDateEntries.length}</strong>
              </div>
              <div class="cycle-day-stat">
                <span class="muted">Кровотеча</span>
                <strong>${selectedBleeding}</strong>
              </div>
              <div class="cycle-day-stat">
                <span class="muted">Біль</span>
                <strong>${selectedPain}</strong>
              </div>
            </div>
            <div class="cycle-inline-actions">
              <button class="small-button" data-action-type="bleeding" data-action-date="${selectedDateKey}" type="button">
                ${icon("drop", "button-icon")}Кровотеча на цю дату
              </button>
              <button class="small-button" data-action-type="pain" data-action-date="${selectedDateKey}" type="button">
                ${icon("pain", "button-icon")}Біль на цю дату
              </button>
            </div>
            <div class="cycle-day-log-list">
              ${selectedDateEntries.length
                ? selectedDateEntries.map((entry) => renderCycleDayLog(entry)).join("")
                : `
                  <div class="empty-cycle-state">
                    <strong>На цей день ще немає cycle-записів</strong>
                    <p class="detail-copy">Вибери “Кровотеча” або “Біль”, і запис одразу потрапить і в цей день, і в загальний журнал.</p>
                  </div>
                `}
            </div>
          </div>
        </section>

        <section class="card">
          <div class="section-header">
            <div>
              <h3>Тренди</h3>
              <p class="section-subtitle">Спостереження без медичних висновків.</p>
            </div>
          </div>
          <div class="trend-list">
            ${trendItems
              .map(
                (item) => `
                  <div class="trend-item">
                    <div class="trend-top">
                      ${icon(item.iconName, "trend-icon")}
                      <strong>${item.title}</strong>
                    </div>
                    <span class="detail-copy">${item.text}</span>
                  </div>
                `,
              )
              .join("")}
          </div>
        </section>

        <section class="card">
          <div class="section-header">
            <div>
              <h3>Історія циклів</h3>
              <p class="section-subtitle">Старти, завершення та навантаження.</p>
            </div>
          </div>
          <div class="trend-list">${historyHtml}</div>
        </section>
      </div>
    </section>
  `;
}

function renderIntimate() {
  const signals = getIntimateSignals();
  const recurringSignal = signals.recurringItems[0] || null;
  const latestLoggedDate = signals.latest ? toLongDate(signals.latest.date) : "Поки без записів";
  const readinessText =
    signals.doctorQuestions > 0
      ? `Уже є ${signals.doctorQuestions} записів, які можна винести в підготовку до лікаря.`
      : "Поки немає окремих питань до лікаря, але модуль уже готовий їх збирати.";

  return `
    <section class="screen active" data-screen="intimate">
      <div class="stack">
        <section class="card hero-card">
          <div class="hero-glow"></div>
          <div class="hero-topline">
            <p class="eyebrow">Інтимне здоров'я</p>
            <span class="badge">${icon("intimate", "badge-icon")}<span>Приватний простір</span></span>
          </div>
          <div class="hero-main">
            <div>
              <p class="hero-title">${signals.total} записи</p>
              <p class="hero-subtitle">Інтимні симптоми, біль, нотатки й питання до лікаря.</p>
              <p class="hero-subtitle">${readinessText}</p>
            </div>
            <div class="hero-orb">
              ${icon("intimate", "hero-orb-icon")}
            </div>
          </div>
          <div class="hero-strip">
            <div class="hero-pill">${icon("shield", "mini-icon")}Приватно</div>
            <div class="hero-pill">${icon("journal", "mini-icon")}У спільному журналі</div>
            <div class="hero-pill">${icon("summary", "mini-icon")}Для підсумку</div>
          </div>
        </section>

        <section class="card">
          <div class="section-header">
            <div>
              <h3>Огляд модуля</h3>
              <p class="section-subtitle">Короткий зріз, щоб одразу бачити інтенсивність сигналів, останню активність і готовність до розмови з лікарем.</p>
            </div>
          </div>
          <div class="cycle-overview-grid">
            ${renderCycleOverviewMetric("intimate", "Останній запис", latestLoggedDate, signals.latest ? signals.latest.title : "Ще не було інтимних записів.")}
            ${renderCycleOverviewMetric("spark", "За 30 днів", `${signals.last30Count}`, "Кількість записів у приватному модулі за останній місяць.")}
            ${renderCycleOverviewMetric("pain", "Біль / дискомфорт", `${signals.painCount}`, signals.latestSymptom ? `Останній симптом: ${signals.latestSymptom.title}.` : "Поки не було окремих записів болю чи дискомфорту.")}
            ${renderCycleOverviewMetric("question", "Для лікаря", `${signals.doctorQuestions}`, "Питання, документи й елементи, які можна винести в наступний візит.")}
          </div>
        </section>

        <div class="chip-row intimate-chip-row">
          <button class="chip" data-action-type="symptom" type="button">
            <div class="chip-head">
              ${icon("intimate", "chip-icon")}
              <strong>Додати симптом</strong>
            </div>
            <span>Сухість, свербіж, печіння, виділення або інший делікатний сигнал.</span>
          </button>
          <button class="chip" data-action-type="pain" type="button">
            <div class="chip-head">
              ${icon("pain", "chip-icon")}
              <strong>Додати біль</strong>
            </div>
            <span>Дискомфорт під час, після або поза інтимною активністю.</span>
          </button>
          <button class="chip" data-action-type="note" type="button">
            <div class="chip-head">
              ${icon("note", "chip-icon")}
              <strong>Приватна нотатка</strong>
            </div>
            <span>Вільне спостереження без жорсткої структури.</span>
          </button>
          <button class="chip" data-action-type="question" type="button">
            <div class="chip-head">
              ${icon("question", "chip-icon")}
              <strong>Питання до лікаря</strong>
            </div>
            <span>Підготувати коротке формулювання для наступного прийому.</span>
          </button>
        </div>

        <section class="card">
          <div class="section-header">
            <div>
              <h3>Сигнали й патерни</h3>
              <p class="section-subtitle">Модуль не ставить висновків, але акуратно збирає повтори й підсвічує, що вже варто тримати в полі зору.</p>
            </div>
          </div>
          <div class="trend-list">
            <div class="trend-item">
              <div class="trend-top">
                ${icon("trend", "trend-icon")}
                <strong>Повторюваний сигнал</strong>
              </div>
              <span class="detail-copy">${recurringSignal ? `${recurringSignal[0]} повторювався ${recurringSignal[1]} рази.` : "Поки недостатньо повторів, щоб показувати стабільний інтимний патерн."}</span>
            </div>
            <div class="trend-item">
              <div class="trend-top">
                ${icon("note", "trend-icon")}
                <strong>Останній чутливий запис</strong>
              </div>
              <span class="detail-copy">${signals.latest ? `${signals.latest.title} · ${toLongDateTime(signals.latest.date)}` : "Ще немає інтимних записів у журналі."}</span>
            </div>
            <div class="trend-item">
              <div class="trend-top">
                ${icon("summary", "trend-icon")}
                <strong>Готовність до розмови</strong>
              </div>
              <span class="detail-copy">${readinessText}</span>
            </div>
          </div>
        </section>

        <section class="card">
          <div class="section-header">
            <div>
              <h3>Останні записи</h3>
              <p class="section-subtitle">Тут видно останні інтимні записи як окремий потоковий блок. Тап по картці відкриває її деталі.</p>
            </div>
          </div>
          <div class="cycle-day-log-list">
            ${signals.recent.length
              ? signals.recent.map((entry) => renderRecentIntimateEntry(entry)).join("")
              : `
                <div class="empty-cycle-state">
                  <strong>Поки що порожньо</strong>
                  <p class="detail-copy">Почни із симптому, болю або нотатки, і цей простір одразу стане корисним для реального спостереження.</p>
                </div>
              `}
          </div>
        </section>

        <section class="card">
          <div class="section-header">
            <div>
              <h3>Що можна логувати</h3>
              <p class="section-subtitle">Модуль лишається практичним, делікатним і сфокусованим на жіночому здоров'ї.</p>
            </div>
          </div>
          <div class="list-block">
            ${renderInsightItem("intimate", "Інтимні симптоми", "Сухість, виділення, свербіж, печіння, подразнення або інші делікатні зміни.")}
            ${renderInsightItem("pain", "Біль та дискомфорт", "Біль під час чи після сексу, тазовий дискомфорт, чутливість, мікротравми.")}
            ${renderInsightItem("question", "Підготовка до візиту", "Питання до лікаря, короткі формулювання й нотатки, які легко перенести в summary.")}
          </div>
        </section>

        <section class="card">
          <div class="section-header">
            <div>
              <h3>Для лікаря</h3>
              <p class="section-subtitle">З часом саме цей блок зможе збирати найкорисніші інтимні сигнали в компактний export-friendly summary.</p>
            </div>
            <button class="small-button primary-button" type="button" data-summary-trigger="true">
              ${icon("summary", "button-icon")}Підсумок
            </button>
          </div>
          <div class="list-block">
            ${renderInsightItem("summary", "Що вже готово", readinessText)}
            ${renderInsightItem("calendar", "Коли це важливо", "Перед гінекологічним прийомом або коли повторюваний інтимний симптом уже починає складатися в патерн.")}
            ${renderInsightItem("shield", "Приватність", "Інтимні записи лишаються в загальному журналі, але мають окремий модуль і делікатний UX-контекст.")}
          </div>
        </section>
      </div>
    </section>
  `;
}

function renderProfileMain() {
  return `
    <div class="stack">
      <section class="card hero-card">
        <div class="hero-glow"></div>
        <div class="hero-topline">
          <p class="eyebrow">Профіль</p>
          <span class="badge">${icon("shield", "badge-icon")}<span>Чутливі дані в центрі</span></span>
        </div>
        <div class="hero-main">
          <div>
            <p class="hero-title">Профіль і безпека</p>
            <p class="hero-subtitle">Усі чутливі налаштування, підсумки й контроль над даними зібрані в одному місці.</p>
          </div>
          <div class="hero-orb">
            ${icon("profile", "hero-orb-icon")}
          </div>
        </div>
      </section>

      <div class="profile-list">
        <div class="profile-row">
          <div class="profile-main">
            ${icon("lock", "profile-icon")}
            <div>
              <strong>Приватність і безпека</strong>
              <p class="profile-note">Блокування, приховані сповіщення, експорт і видалення даних.</p>
            </div>
          </div>
          <button class="small-button" type="button" data-profile-screen="privacy">Відкрити</button>
        </div>
        <div class="profile-row">
          <div class="profile-main">
            ${icon("export", "profile-icon")}
            <div>
              <strong>Підсумок для лікаря</strong>
              <p class="profile-note">Короткий preview симптомів, циклу, питань і документів перед візитом.</p>
            </div>
          </div>
          <button class="small-button" type="button" data-summary-trigger="true">Відкрити</button>
        </div>
        <div class="profile-row">
          <div class="profile-main">
            ${icon("attachment", "profile-icon")}
            <div>
              <strong>Документи та аналізи</strong>
              <p class="profile-note">Аналізи, УЗД, скани та PDF в одному місці.</p>
            </div>
          </div>
          <button class="small-button" type="button" data-profile-screen="vault">Відкрити</button>
        </div>
        <div class="profile-row">
          <div class="profile-main">
            ${icon("spark", "profile-icon")}
            <div>
              <strong>Тест UI</strong>
              <p class="profile-note">Перевірка порожніх станів, контекстів і stress test контенту.</p>
            </div>
          </div>
          <button class="small-button" type="button" data-open-test-ui="true">Відкрити</button>
        </div>
      </div>

      <section class="card">
        <div class="section-header">
          <div>
            <h3>Налаштування відстеження</h3>
            <p class="section-subtitle">У MVP користувачка сама обирає, які категорії для неї важливі.</p>
          </div>
        </div>
        <div class="trend-list">
          <div class="trend-item">
            <div class="trend-top">
              ${icon("cycle", "trend-icon")}
              <strong>Відстеження циклу</strong>
            </div>
            <span class="detail-copy">Увімкнено</span>
          </div>
          <div class="trend-item">
            <div class="trend-top">
              ${icon("intimate", "trend-icon")}
              <strong>Інтимне здоров'я</strong>
            </div>
            <span class="detail-copy">Увімкнено</span>
          </div>
          <div class="trend-item">
            <div class="trend-top">
              ${icon("reminder", "trend-icon")}
              <strong>Нагадування</strong>
            </div>
            <span class="detail-copy">Щоденна відмітка, ліки та прийоми.</span>
          </div>
        </div>
      </section>
    </div>
  `;
}

function renderDoctorSummaryScreen() {
  const summary = getDoctorSummaryData();
  const bleedingDays = summary.cycleMetrics.bleedingDaysThisCycle;
  const cycleText = summary.cycleDay
    ? `День циклу ${summary.cycleDay}${bleedingDays ? ` · кровотеча ${bleedingDays} дн.` : ""}.`
    : "Цикл не активний.";
  const symptomText = summary.latestSymptom
    ? `${summary.latestSymptom.title} · ${getEntryDisplayValue(summary.latestSymptom)}`
    : "Немає симптомних записів за 30 днів.";
  const appointmentText = summary.latestAppointment
    ? `${summary.latestAppointment.title} · ${getEntryDisplayValue(summary.latestAppointment)}`
    : "Немає запланованих прийомів.";
  const recurringText = summary.recurringSignal
    ? `${summary.recurringSignal[0]} — ${summary.recurringSignal[1]} рази.`
    : "Немає повторюваних інтимних сигналів.";
  const varianceText = summary.cycleMetrics.varianceRange
    ? `${summary.cycleMetrics.varianceRange.min}–${summary.cycleMetrics.varianceRange.max} днів${summary.cycleMetrics.isRegular ? " · регулярний" : " · нерегулярний"}`
    : "Недостатньо даних.";
  const symptomChronology = summary.symptomEntries.slice(0, 6).map((entry) =>
    `${toDateParts(entry.date)}: ${entry.title} · ${getEntryDisplayValue(entry)}`
  );

  return `
    <div class="stack">
      <section class="card hero-card">
        <div class="hero-glow"></div>
        <div class="hero-topline">
          <button class="small-button" type="button" data-profile-screen="main">
            ${icon("chevronLeft", "button-icon")}Профіль
          </button>
          <span class="badge">${icon("summary", "badge-icon")}<span>Preview для візиту</span></span>
        </div>
        <div class="hero-main">
          <div>
            <p class="hero-title">Підсумок для лікаря</p>
            <p class="hero-subtitle">Короткий live-зріз з журналу: симптоми, цикл, запитання та документи в одному місці.</p>
          </div>
          <div class="hero-orb">
            ${icon("summary", "hero-orb-icon")}
          </div>
        </div>
      </section>

      <section class="card">
        <div class="section-header">
          <div>
            <h3>Готовність</h3>
            <p class="section-subtitle">Наскільки вже зібрана інформація для майбутнього візиту.</p>
          </div>
          <button class="small-button primary-button" type="button" data-summary-export="true">
            ${icon("export", "button-icon")}Експорт
          </button>
        </div>
        <div class="cycle-overview-grid">
          ${renderCycleOverviewMetric("spark", "Симптоми", `${summary.symptomEntries.length}`, summary.latestSymptom ? `Останній: ${toLongDateTime(summary.latestSymptom.date)}` : "Ще немає останнього сигналу.")}
          ${renderCycleOverviewMetric("calendar", "Прийоми", `${summary.appointments.length}`, summary.latestAppointment ? `Останній: ${toLongDate(summary.latestAppointment.date)}` : "Ще не додано жодного прийому.")}
          ${renderCycleOverviewMetric("question", "Питання", `${summary.questions.length}`, summary.questions.length ? "Є що винести на консультацію." : "Питання до лікаря ще не зібрані.")}
          ${renderCycleOverviewMetric("document", "Документи", `${summary.documents.length}`, summary.documents.length ? "Документи вже в журналі." : "Документи ще не додані.")}
        </div>
      </section>

      <section class="card">
        <div class="section-header">
          <div>
            <h3>Що сказати лікарю</h3>
            <p class="section-subtitle">Не висновки, а компактний фактологічний зріз перед розмовою.</p>
          </div>
        </div>
        <div class="list-block">
          ${renderInsightItem("cycle", summary.cycleDay ? `День циклу ${summary.cycleDay}` : "Цикл", cycleText)}
          ${renderInsightItem("drop", "Тривалість кровотечі", bleedingDays ? `${bleedingDays} днів у поточному циклі.` : "Немає записів кровотечі.")}
          ${renderInsightItem("trend", "Діапазон циклу", varianceText)}
          ${renderInsightItem("spark", "Останній симптом", symptomText)}
          ${renderInsightItem("calendar", "Останній прийом", appointmentText)}
          ${renderInsightItem("intimate", "Повторюваний сигнал", recurringText)}
        </div>
      </section>

      <section class="card">
        <div class="section-header">
          <div>
            <h3>Хронологія симптомів</h3>
            <p class="section-subtitle">Динаміка за останні 30 днів для лікаря.</p>
          </div>
        </div>
        <div class="list-block">
          ${
            symptomChronology.length
              ? symptomChronology.map((line) => renderInsightItem("spark", line.split(":")[0] || "", line.split(":").slice(1).join(":").trim())).join("")
              : renderInsightItem("spark", "Порожньо", "Немає симптомних записів за 30 днів.")
          }
        </div>
      </section>

      <section class="card">
        <div class="section-header">
          <div>
            <h3>Останні записи</h3>
            <p class="section-subtitle">Деталі для обговорення на прийомі.</p>
          </div>
        </div>
        <div class="list-block">
          ${
            summary.symptomEntries.length
              ? summary.symptomEntries.slice(0, 4).map((entry) => renderHomeRecentEntry(entry)).join("")
              : renderInsightItem("spark", "Порожньо", "Додай симптом, біль або настрій.")
          }
        </div>
      </section>

      <section class="card">
        <div class="section-header">
          <div>
            <h3>Матеріали до візиту</h3>
            <p class="section-subtitle">Питання, документи й прийоми, які вже є в журналі.</p>
          </div>
        </div>
        <div class="list-block">
          ${
            summary.doctorEntries.length
              ? summary.doctorEntries.slice(0, 4).map((entry) => renderHomeRecentEntry(entry)).join("")
              : renderInsightItem("summary", "Ще немає медичних матеріалів", "Додай питання, документ, аналіз або прийом, і він одразу з'явиться в підсумку.")
          }
        </div>
        <div class="detail-actions">
          <button class="small-button" type="button" data-tab="journal">Журнал</button>
          <button class="small-button primary-button" type="button" data-tab="cycles">Цикли</button>
        </div>
      </section>
    </div>
  `;
}

function renderVaultEntryCard(entry) {
  const hasFile = Boolean(entry.attachment?.dataUrl);
  return `
    <article class="entry-card vault-entry-card" data-entry-id="${entry.id}" data-entry-tone="${getEntryTone(entry)}">
      <div class="entry-title-row">
        <div class="entry-main">
          <div class="entry-icon-wrap" data-entry-tone="${getEntryTone(entry)}">
            ${icon(iconByType[entry.type] || "attachment", "entry-icon")}
          </div>
          <div>
            <p class="entry-title">${entry.title}</p>
            <div class="entry-meta">
              <span class="detail-copy">${toLongDateTime(entry.date)}</span>
            </div>
          </div>
        </div>
        <span class="pill" data-entry-tone="${hasFile ? "doctor" : "default"}">${hasFile ? "Файл" : "Без файлу"}</span>
      </div>
      <p class="hero-subtitle">${getEntryDisplayValue(entry)}</p>
      ${entry.note ? `<p class="detail-copy">${entry.note}</p>` : ""}
      ${hasFile ? `
        <div class="vault-file-row">
          <span class="detail-copy">${entry.attachment.name}</span>
          <button class="small-button" type="button" data-entry-attachment="${entry.id}">
            ${icon("export", "button-icon")}Відкрити
          </button>
        </div>
      ` : ""}
    </article>
  `;
}

function renderDocumentsVaultScreen() {
  const vault = getVaultEntries();

  return `
    <div class="stack">
      <section class="card hero-card">
        <div class="hero-glow"></div>
        <div class="hero-topline">
          <button class="small-button" type="button" data-profile-screen="main">
            ${icon("chevronLeft", "button-icon")}Профіль
          </button>
          <span class="badge">${icon("attachment", "badge-icon")}<span>Сховище</span></span>
        </div>
        <div class="hero-main">
          <div>
            <p class="hero-title">Документи та аналізи</p>
            <p class="hero-subtitle">Усі медичні файли, скани й результати в одному місці.</p>
          </div>
          <div class="hero-orb">
            ${icon("attachment", "hero-orb-icon")}
          </div>
        </div>
      </section>

      <section class="card">
        <div class="section-header">
          <div>
            <h3>Огляд</h3>
            <p class="section-subtitle">Що вже зібрано.</p>
          </div>
        </div>
        <div class="cycle-overview-grid">
          ${renderCycleOverviewMetric("attachment", "Усього", `${vault.total}`, vault.total ? "Документів у сховищі." : "Порожньо.")}
          ${renderCycleOverviewMetric("document", "Аналізи", `${vault.analyses.length}`, vault.analyses.length ? "Результати скринінгів та аналізів." : "—")}
          ${renderCycleOverviewMetric("attachment", "Документи", `${vault.documents.length}`, vault.documents.length ? "УЗД, скани, PDF." : "—")}
          ${renderCycleOverviewMetric("export", "З файлом", `${vault.withAttachment}`, vault.withAttachment ? "Прикріплені файли." : "—")}
        </div>
      </section>

      ${vault.analyses.length ? `
        <section class="card">
          <div class="section-header">
            <div>
              <h3>Аналізи</h3>
              <p class="section-subtitle">Результати аналізів та скринінгів.</p>
            </div>
            <span class="badge">${icon("document", "badge-icon")}<span>${vault.analyses.length}</span></span>
          </div>
          <div class="list-block">
            ${vault.analyses.map((entry) => renderVaultEntryCard(entry)).join("")}
          </div>
        </section>
      ` : ""}

      ${vault.documents.length ? `
        <section class="card">
          <div class="section-header">
            <div>
              <h3>Документи</h3>
              <p class="section-subtitle">УЗД, скани, фото та PDF.</p>
            </div>
            <span class="badge">${icon("attachment", "badge-icon")}<span>${vault.documents.length}</span></span>
          </div>
          <div class="list-block">
            ${vault.documents.map((entry) => renderVaultEntryCard(entry)).join("")}
          </div>
        </section>
      ` : ""}

      ${vault.total === 0 ? `
        <section class="card">
          <div class="empty-cycle-state">
            <strong>Сховище порожнє</strong>
            <p class="detail-copy">Додай аналіз або документ через "+" і він з'явиться тут із можливістю завантажити файл.</p>
          </div>
        </section>
      ` : ""}

      <div class="detail-actions">
        <button class="small-button" type="button" data-tab="journal">Журнал</button>
        <button class="small-button primary-button" type="button" data-summary-trigger="true">
          ${icon("summary", "button-icon")}Підсумок для лікаря
        </button>
      </div>
    </div>
  `;
}

function renderPrivacyProfileScreen() {
  return `
    <div class="stack">
      <section class="card hero-card">
        <div class="hero-glow"></div>
        <div class="hero-topline">
          <button class="small-button" type="button" data-profile-screen="main">
            ${icon("chevronLeft", "button-icon")}Профіль
          </button>
          <span class="badge">${icon("lock", "badge-icon")}<span>Захист даних</span></span>
        </div>
        <div class="hero-main">
          <div>
            <p class="hero-title">Приватність</p>
            <p class="hero-subtitle">Окремий керований простір для доступу, сповіщень і повного контролю над даними.</p>
          </div>
          <div class="hero-orb">
            ${icon("shield", "hero-orb-icon")}
          </div>
        </div>
      </section>

      <section class="card">
        <div class="section-header">
          <div>
            <h3>Статус захисту</h3>
            <p class="section-subtitle">Демо-стани, які пізніше можна напряму підв’язати до реальних налаштувань.</p>
          </div>
        </div>
        <div class="cycle-overview-grid">
          ${renderCycleOverviewMetric("lock", "Доступ", "Увімкнено", "Face ID / PIN після короткої паузи бездіяльності.")}
          ${renderCycleOverviewMetric("shield", "Push", "Приховано", "Текст чутливих нагадувань у preview не показується.")}
          ${renderCycleOverviewMetric("export", "Експорт", "Готово", "Підсумок для лікаря і повний експорт доступні окремо.")}
          ${renderCycleOverviewMetric("trash", "Видалення", "Під контролем", "Повне очищення історії залишається окремою підтвердженою дією.")}
        </div>
      </section>

      <section class="card">
        <div class="section-header">
          <div>
            <h3>Доступ і екран</h3>
            <p class="section-subtitle">Речі, які захищають застосунок ще до відкриття конкретних записів.</p>
          </div>
        </div>
        <div class="profile-list">
          <div class="profile-row">
            <div class="profile-main">
              ${icon("lock", "profile-icon")}
              <div>
                <strong>Блокування застосунку</strong>
                <p class="profile-note">Face ID / PIN після виходу з додатку або короткої паузи.</p>
              </div>
            </div>
            <button class="small-button" type="button" data-privacy-action="app-lock">Увімкнено</button>
          </div>
          <div class="profile-row">
            <div class="profile-main">
              ${icon("shield", "profile-icon")}
              <div>
                <strong>Blur у перемикачі застосунків</strong>
                <p class="profile-note">Останній екран не видно в multitasking preview.</p>
              </div>
            </div>
            <button class="small-button" type="button" data-privacy-action="screen-obscure">Увімкнено</button>
          </div>
        </div>
      </section>

      <section class="card">
        <div class="section-header">
          <div>
            <h3>Сповіщення</h3>
            <p class="section-subtitle">Нагадування залишаються корисними, але без зайвих деталей на lock screen.</p>
          </div>
        </div>
        <div class="profile-list">
          <div class="profile-row">
            <div class="profile-main">
              ${icon("reminder", "profile-icon")}
              <div>
                <strong>Прихований текст push-сповіщень</strong>
                <p class="profile-note">У preview лишається лише нейтральна назва і час.</p>
              </div>
            </div>
            <button class="small-button" type="button" data-privacy-action="push-preview">Приховано</button>
          </div>
          <div class="profile-row">
            <div class="profile-main">
              ${icon("question", "profile-icon")}
              <div>
                <strong>Нейтральні назви нагадувань</strong>
                <p class="profile-note">Без згадки інтимних або симптомних тем прямо в назві повідомлення.</p>
              </div>
            </div>
            <button class="small-button" type="button" data-privacy-action="neutral-reminders">Нейтрально</button>
          </div>
        </div>
      </section>

      <section class="card">
        <div class="section-header">
          <div>
            <h3>Дані і контроль</h3>
            <p class="section-subtitle">Усе, що пов’язано з експортом і повним видаленням історії, винесено в окремий блок.</p>
          </div>
        </div>
        <div class="detail-actions">
          <button class="small-button primary-button" type="button" data-summary-trigger="true">
            ${icon("summary", "button-icon")}Підсумок для лікаря
          </button>
          <button class="small-button" type="button" data-privacy-action="export-all">
            ${icon("export", "button-icon")}Експорт усіх даних
          </button>
          <button class="small-button danger-button" type="button" data-privacy-action="delete-all">
            ${icon("trash", "button-icon")}Видалити всі дані
          </button>
        </div>
      </section>
    </div>
  `;
}

function renderProfile() {
  return `
    <section class="screen active" data-screen="profile">
      ${state.profileScreen === "privacy" ? renderPrivacyProfileScreen() : state.profileScreen === "summary" ? renderDoctorSummaryScreen() : state.profileScreen === "vault" ? renderDocumentsVaultScreen() : renderProfileMain()}
    </section>
  `;
}

function renderNav() {
  bottomNav.innerHTML = tabs
    .map(
      (tab) => `
        <button class="nav-button ${state.activeTab === tab.id ? "active" : ""}" data-tab="${tab.id}" type="button">
          <span class="nav-icon">${icons[tab.icon] || ""}</span>
          <strong>${tab.label}</strong>
        </button>
      `,
    )
    .join("");
}

function renderComposerActions() {
  const buildButtons = (items, root) => {
    root.innerHTML = items
      .map(
        (item) => `
          <button class="action-pill" data-action-type="${item.type}" type="button">
            <div class="action-pill-head action-pill-inline">
              ${icon(iconByType[item.type] || "spark", "action-icon")}
              <strong>${item.title}</strong>
            </div>
          </button>
        `,
      )
      .join("");
  };

  buildButtons(actionCatalog.quick, quickActionsRoot);
  buildButtons(actionCatalog.medical, medicalActionsRoot);
  buildButtons(actionCatalog.event, eventActionsRoot);
}

function renderTestUiControls() {
  const contextOptions = [
    {
      id: "auto",
      title: "Авто",
      note: "Контекст визначається журналом",
    },
    {
      id: "pregnancy",
      title: "Вагітність",
      note: "Примусово показати pregnancy UI",
    },
    {
      id: "recovery",
      title: "Відновлення",
      note: "Примусово показати recovery UI",
    },
  ];

  const dataOptions = [
    {
      id: "default",
      title: "Базові дані",
      note: "Поточний набір записів MVP",
    },
    {
      id: "rich",
      title: "Багато даних",
      note: "Насичений журнал для stress test",
    },
    {
      id: "empty",
      title: "Порожньо",
      note: "Перевірка порожніх станів",
    },
  ];

  const textOptions = [
    {
      id: "off",
      title: "Звичайний текст",
      note: "Без додаткового навантаження",
    },
    {
      id: "on",
      title: "Довгий контент",
      note: "Перевірка переносу рядків",
    },
  ];

  demoContextOptionsRoot.innerHTML = contextOptions
    .map(
      (option) => `
        <button class="option-chip ${state.uiTest.context === option.id ? "active" : ""}" data-demo-context="${option.id}" type="button">
          <strong>${option.title}</strong>
          <span class="detail-copy">${option.note}</span>
        </button>
      `,
    )
    .join("");

  demoDataOptionsRoot.innerHTML = dataOptions
    .map(
      (option) => `
        <button class="option-chip ${state.uiTest.dataMode === option.id ? "active" : ""}" data-demo-data="${option.id}" type="button">
          <strong>${option.title}</strong>
          <span class="detail-copy">${option.note}</span>
        </button>
      `,
    )
    .join("");

  demoTextOptionsRoot.innerHTML = textOptions
    .map(
      (option) => `
        <button class="option-chip ${state.uiTest.longText === (option.id === "on") ? "active" : ""}" data-demo-text="${option.id}" type="button">
          <strong>${option.title}</strong>
          <span class="detail-copy">${option.note}</span>
        </button>
      `,
    )
    .join("");
}

function renderEntryDetail() {
  if (!state.selectedEntryId) {
    entryDetailContent.innerHTML = "";
    return;
  }

  const entry = getEntryById(state.selectedEntryId);

  if (!entry) {
    entryDetailContent.innerHTML = `
      <div class="detail-sheet-content">
        <div class="detail-value">
          <strong>Запис не знайдено</strong>
          <p class="detail-copy">Можливо, він був видалений або це тимчасовий демо-стан.</p>
        </div>
      </div>
    `;
    return;
  }

  entryDetailContent.innerHTML = `
    <div class="detail-sheet-content">
      <section class="detail-hero">
        <div class="detail-hero-top">
          <div class="detail-icon-wrap">
            ${icon(iconByType[entry.type] || "journal", "entry-icon")}
          </div>
          <div>
            <p class="detail-title">${entry.title}</p>
            <div class="detail-meta">
              <span class="entry-tag">${getDisplayContext(entry.context)}</span>
              <span class="entry-tag">${toLongDate(entry.date)}</span>
              <span class="entry-tag">${toTime(entry.date)}</span>
            </div>
          </div>
        </div>
      </section>

      <section class="detail-grid">
        <div class="detail-value">
          <strong>Значення</strong>
          <p class="hero-subtitle">${getEntryDisplayValue(entry)}</p>
        </div>
        <div class="detail-value">
          <strong>Нотатка</strong>
          <p class="detail-copy">${entry.note}</p>
        </div>
        ${
          entry.attachment
            ? `
              <div class="detail-value">
                <strong>Вкладення</strong>
                <p class="detail-copy">${entry.attachment.name}</p>
                <div class="detail-actions">
                  <button class="small-button" type="button" data-entry-attachment="${entry.id}">
                    ${icon("attachment", "button-icon")}Відкрити файл
                  </button>
                </div>
              </div>
            `
            : ""
        }
      </section>

      <div class="detail-actions">
        <button class="small-button primary-button" type="button" data-entry-edit="${entry.id}">
          ${icon("edit", "button-icon")}Редагувати
        </button>
        <button class="small-button danger-button" type="button" data-entry-delete="${entry.id}">
          ${icon("trash", "button-icon")}Видалити
        </button>
      </div>
    </div>
  `;
}

function renderCycleDaySheet() {
  const selectedDateKey = state.selectedCycleDate || toLocalDateKey(new Date());
  const selectedDateEntries = getEntriesForDate(selectedDateKey);
  const cycleEntries = selectedDateEntries.filter((entry) => entry.tags.includes("cycle"));
  const selectedRange = getCycleRangeForDate(selectedDateKey);
  const selectedCycleDay = selectedRange ? diffInDays(selectedRange.start.date, fromLocalDateKey(selectedDateKey)) + 1 : null;

  cycleDayContent.innerHTML = `
    <div class="detail-sheet-content">
      <section class="detail-hero">
        <div class="detail-hero-top">
          <div class="detail-icon-wrap">
            ${icon("calendar", "entry-icon")}
          </div>
          <div>
            <p class="detail-title">${toLongDate(fromLocalDateKey(selectedDateKey))}</p>
            <div class="detail-meta">
              <span class="pill">${selectedDateEntries.length} записів</span>
              ${selectedCycleDay ? `<span class="entry-tag">День циклу ${selectedCycleDay}</span>` : ""}
              ${cycleEntries.length ? `<span class="entry-tag">${cycleEntries.length} cycle-записів</span>` : ""}
            </div>
          </div>
        </div>
      </section>

      <section class="detail-grid">
        <div class="detail-value">
          <strong>Що є в цей день</strong>
          <p class="detail-copy">${selectedDateEntries.length ? "Усі записи за дату зібрані в одному місці, щоб не шукати між календарем і журналом." : "На цей день поки немає записів, але можна швидко додати цикл, кровотечу або біль."}</p>
        </div>
      </section>

      <div class="cycle-inline-actions">
        <button class="small-button" data-action-type="bleeding" data-action-date="${selectedDateKey}" type="button">
          ${icon("drop", "button-icon")}Кровотеча
        </button>
        <button class="small-button" data-action-type="pain" data-action-date="${selectedDateKey}" type="button">
          ${icon("pain", "button-icon")}Біль
        </button>
        <button class="small-button" data-action-type="cycle_start" data-action-date="${selectedDateKey}" type="button">
          ${icon("cycle", "button-icon")}Початок циклу
        </button>
      </div>

      <div class="cycle-day-log-list">
        ${selectedDateEntries.length
          ? selectedDateEntries.map((entry) => renderCycleDayLog(entry)).join("")
          : `
            <div class="empty-cycle-state">
              <strong>На цей день ще немає записів</strong>
              <p class="detail-copy">Створи перший запис прямо з day card, і він одразу з’явиться в календарі та журналі.</p>
            </div>
          `}
      </div>
    </div>
  `;
}

function render() {
  sortEntries();
  const screens = {
    home: renderHome(),
    journal: renderJournal(),
    cycles: renderCycles(),
    intimate: renderIntimate(),
    profile: renderProfile(),
  };

  app.innerHTML = screens[state.activeTab];
  renderNav();
  renderTestUiControls();
  renderEntryDetail();
  renderCycleDaySheet();
}

function openSummaryPreview() {
  state.activeTab = "profile";
  state.profileScreen = "summary";
  render();
}

function handleSummaryExport() {
  const summary = getDoctorSummaryData();
  const context = getCurrentContext();
  const cycleDay = summary.cycleDay;
  const bleedingDays = summary.cycleMetrics.bleedingDaysThisCycle;
  const varianceText = summary.cycleMetrics.varianceRange
    ? `${summary.cycleMetrics.varianceRange.min}–${summary.cycleMetrics.varianceRange.max} днів (${summary.cycleMetrics.isRegular ? "регулярний" : "нерегулярний"})`
    : "Недостатньо даних";

  const symptomRows = summary.symptomEntries.slice(0, 10).map((entry) =>
    `<tr><td>${toLongDateTime(entry.date)}</td><td>${entry.title}</td><td>${getEntryDisplayValue(entry)}</td><td>${entry.note || "—"}</td></tr>`
  ).join("");

  const doctorRows = summary.doctorEntries.slice(0, 10).map((entry) =>
    `<tr><td>${toLongDateTime(entry.date)}</td><td>${entry.title}</td><td>${getEntryDisplayValue(entry)}</td><td>${entry.note || "—"}</td></tr>`
  ).join("");

  const html = `<!DOCTYPE html>
<html lang="uk">
<head>
<meta charset="UTF-8">
<title>SOMI — Підсумок для лікаря</title>
<style>
body{font-family:system-ui,sans-serif;max-width:700px;margin:0 auto;padding:24px;color:#241813;font-size:13px;line-height:1.5}
h1{font-size:20px;margin:0 0 4px}h2{font-size:15px;margin:18px 0 6px;border-bottom:1px solid #e5d6cc;padding-bottom:4px}
.meta{color:#7d6659;font-size:12px;margin-bottom:16px}
table{width:100%;border-collapse:collapse;margin:8px 0}
th,td{text-align:left;padding:6px 8px;border:1px solid #e5d6cc;font-size:12px}
th{background:#faf3ed;font-weight:600}
.kv{display:flex;gap:24px;flex-wrap:wrap;margin:6px 0}
.kv div{flex:1 1 140px}
.kv strong{display:block;font-size:11px;color:#7d6659;text-transform:uppercase;letter-spacing:0.06em}
.kv span{font-size:14px;font-weight:600}
.footer{margin-top:24px;font-size:11px;color:#7d6659;border-top:1px solid #e5d6cc;padding-top:8px}
@media print{body{padding:12px}table{page-break-inside:avoid}}
</style>
</head>
<body>
<h1>Підсумок для лікаря</h1>
<p class="meta">Згенеровано ${toLongDate(getNowIso())} · SOMI</p>

<h2>Цикл і загальний стан</h2>
<div class="kv">
<div><strong>Контекст</strong><span>${context.title}</span></div>
<div><strong>День циклу</strong><span>${cycleDay || "Не активний"}</span></div>
<div><strong>Кровотеча</strong><span>${bleedingDays ? bleedingDays + " дн." : "—"}</span></div>
<div><strong>Діапазон циклу</strong><span>${varianceText}</span></div>
<div><strong>Середня довжина</strong><span>${summary.cycleMetrics.averageCycleLength ? summary.cycleMetrics.averageCycleLength + " дн." : "—"}</span></div>
</div>

<h2>Симптоми за 30 днів (${summary.symptomEntries.length})</h2>
${symptomRows ? `<table><tr><th>Дата</th><th>Тип</th><th>Значення</th><th>Нотатка</th></tr>${symptomRows}</table>` : "<p>Немає записів.</p>"}

<h2>Медичні записи (${summary.doctorEntries.length})</h2>
${doctorRows ? `<table><tr><th>Дата</th><th>Тип</th><th>Значення</th><th>Нотатка</th></tr>${doctorRows}</table>` : "<p>Немає записів.</p>"}

<div class="footer">Цей документ згенеровано автоматично з додатку SOMI. Він містить лише фактичні записи без медичних висновків чи діагнозів.</div>
</body></html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `SOMI_summary_${toLocalDateKey(new Date())}.html`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);

  showToast(`Підсумок збережено: ${summary.symptomEntries.length} симптомів, ${summary.doctorEntries.length} мед. записів.`);
}

function openEntryAttachment(entryId) {
  const entry = getEntryById(entryId);
  const attachment = entry?.attachment;

  if (!attachment?.dataUrl) {
    showToast("У цього запису поки немає доступного вкладення.");
    return;
  }

  const anchor = document.createElement("a");
  anchor.href = attachment.dataUrl;
  anchor.download = attachment.name || "somi-attachment";
  anchor.target = "_blank";
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

function getCatalogAction(actionType) {
  return [...actionCatalog.quick, ...actionCatalog.medical, ...actionCatalog.event].find(
    (item) => item.type === actionType,
  );
}

async function handleEntryDelete(entryId) {
  const id = String(entryId);
  const existsInBaseState = state.entries.some((entry) => String(entry.id) === id);

  if (!existsInBaseState) {
    showToast("Це демо-запис у тестовому режимі. Його не можна видалити назавжди.");
    return;
  }

  state.entries = state.entries.filter((entry) => String(entry.id) !== id);
  await persistEntries();
  state.selectedEntryId = null;
  entryDetailSheet.close();
  syncAddRecordScrollLock();
  render();
  showToast("Запис видалено з журналу.");
}

async function updateEntry(entryId, action, overrides = {}) {
  const id = String(entryId);
  const existingEntry = state.entries.find((entry) => String(entry.id) === id);

  if (!existingEntry) {
    showToast("Не вдалося знайти запис для редагування.");
    return;
  }

  const updatedEntry = normalizeJournalEntry({
    ...existingEntry,
    type: action.type,
    title: overrides.title ?? existingEntry.title ?? action.title,
    value: overrides.value ?? existingEntry.value,
    note: overrides.note ?? existingEntry.note,
    date: overrides.date ?? existingEntry.date,
    tags: resolveTags(action.type, overrides.sourceTab),
    context: existingEntry.context,
    attachment: overrides.attachment ?? existingEntry.attachment ?? null,
  });

  state.entries = state.entries.map((entry) => (String(entry.id) === id ? updatedEntry : entry));
  sortEntries();
  await persistEntries();

  if (updatedEntry.tags.includes("cycle")) {
    state.selectedCycleDate = toLocalDateKey(updatedEntry.date);
    state.cycleMonthCursor = toMonthCursorKey(updatedEntry.date);
  }

  state.selectedEntryId = updatedEntry.id;
  render();
  renderEntryDetail();
  showToast("Запис оновлено.");
}

async function handleDelegatedClick(event) {
  const target = event.target.closest(
    "[data-tab], [data-filter], [data-action-type], [data-summary-trigger='true'], [data-summary-export='true'], [data-entry-id], [data-entry-attachment], [data-demo-context], [data-demo-data], [data-demo-text], [data-entry-edit], [data-entry-delete], [data-cycle-date], [data-cycle-month], [data-profile-screen], [data-privacy-action], [data-open-test-ui='true']",
  );

  if (!target) {
    return;
  }

  if (target.dataset.tab) {
    state.activeTab = target.dataset.tab;
    if (target.dataset.tab === "profile") {
      state.profileScreen = "main";
    }
    render();
    return;
  }

  if (target.dataset.filter) {
    state.activeFilter = target.dataset.filter;
    render();
    return;
  }

  if (target.dataset.actionType) {
    const action = getCatalogAction(target.dataset.actionType);

    if (!action) {
      return;
    }

    openCreateEntryFlow(action, {
      sourceTab: state.activeTab,
      presetDate: target.dataset.actionDate ? toLocalDateTimeIso(target.dataset.actionDate) : null,
    });
    return;
  }

  if (target.dataset.summaryTrigger === "true") {
    openSummaryPreview();
    return;
  }

  if (target.dataset.summaryExport === "true") {
    handleSummaryExport();
    return;
  }

  if (target.dataset.openTestUi === "true") {
    testSheet.showModal();
    return;
  }

  if (target.dataset.entryId) {
    if (cycleDaySheet.open) {
      cycleDaySheet.close();
    }
    state.selectedEntryId = target.dataset.entryId;
    renderEntryDetail();
    entryDetailSheet.showModal();
    entryDetailSheet.scrollTop = 0;
    syncAddRecordScrollLock();
    return;
  }

  if (target.dataset.entryAttachment) {
    openEntryAttachment(target.dataset.entryAttachment);
    return;
  }

  if (target.dataset.demoContext) {
    state.uiTest.context = target.dataset.demoContext;
    render();
    return;
  }

  if (target.dataset.demoData) {
    state.uiTest.dataMode = target.dataset.demoData;
    render();
    return;
  }

  if (target.dataset.demoText) {
    state.uiTest.longText = target.dataset.demoText === "on";
    render();
    return;
  }

  if (target.dataset.profileScreen) {
    state.activeTab = "profile";
    state.profileScreen = target.dataset.profileScreen;
    render();
    return;
  }

  if (target.dataset.privacyAction) {
    const messages = {
      "app-lock": "Демо privacy: блокування застосунку лишається увімкненим через Face ID / PIN.",
      "screen-obscure": "Демо privacy: прев'ю застосунку в multitasking приховується через blur.",
      "push-preview": "Демо privacy: текст push-сповіщень приховано на lock screen.",
      "neutral-reminders": "Демо privacy: назви нагадувань лишаються нейтральними без чутливих тем.",
      "export-all": "Демо privacy: повний експорт даних буде підготовлено окремим захищеним файлом.",
      "delete-all": "Демо privacy: повне видалення даних потребуватиме окремого підтвердження.",
    };

    showToast(messages[target.dataset.privacyAction] || "Налаштування приватності оновлено.");
    return;
  }

  if (target.dataset.cycleDate) {
    const scrollY = window.scrollY;
    state.selectedCycleDate = target.dataset.cycleDate;
    state.cycleMonthCursor = toMonthCursorKey(target.dataset.cycleDate);
    render();
    window.scrollTo(0, scrollY);
    renderCycleDaySheet();
    cycleDaySheet.showModal();
    syncAddRecordScrollLock();
    return;
  }

  if (target.dataset.cycleMonth) {
    const scrollY = window.scrollY;
    if (target.dataset.cycleMonth === "today") {
      state.cycleMonthCursor = toMonthCursorKey(new Date());
      state.selectedCycleDate = toLocalDateKey(new Date());
    } else {
      const shift = target.dataset.cycleMonth === "prev" ? -1 : 1;
      const nextMonth = addMonths(fromLocalDateKey(state.cycleMonthCursor), shift);
      state.cycleMonthCursor = toMonthCursorKey(nextMonth);
    }
    render();
    window.scrollTo(0, scrollY);
    return;
  }

  if (target.dataset.entryEdit) {
    const entry = getEntryById(target.dataset.entryEdit);
    if (!entry) {
      showToast("Не вдалося знайти запис для редагування.");
      return;
    }

    openEditEntryFlow(entry);
    return;
  }

  if (target.dataset.entryDelete) {
    await handleEntryDelete(target.dataset.entryDelete);
  }
}

openComposerButton.innerHTML = `${icon("plus", "fab-plus")}<strong>Додати запис</strong>`;

openComposerButton.addEventListener("click", () => {
  renderComposerActions();
  composerSheet.showModal();
  syncAddRecordScrollLock();
});
document.addEventListener("click", handleDelegatedClick);

document.addEventListener("input", (event) => {
  if (event.target.dataset.journalSearch !== undefined) {
    state.journalSearch = event.target.value;
    render();
    const searchInput = app.querySelector("[data-journal-search]");
    if (searchInput) {
      searchInput.focus();
      searchInput.selectionStart = searchInput.selectionEnd = searchInput.value.length;
    }
  }
});

recordForm.addEventListener("input", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) {
    return;
  }

  if (target.dataset.rangeInput) {
    updateRangeField(target.dataset.rangeInput);
  }
});

cancelRecordButton.addEventListener("click", () => {
  state.draftActionType = null;
  state.draftActionMeta = null;
  resetRecordFormUi();
  recordFormSheet.close();
  syncAddRecordScrollLock();
});

closeRecordFormButton.addEventListener("click", () => {
  state.draftActionType = null;
  state.draftActionMeta = null;
  resetRecordFormUi();
  recordFormSheet.close();
  syncAddRecordScrollLock();
});

recordForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const action = state.draftActionType ? getCatalogAction(state.draftActionType) : null;
  if (!action) {
    return;
  }

  const sourceTab = state.draftActionMeta?.sourceTab || state.activeTab;
  let payload;

  try {
    payload = await buildStructuredPayload(action, sourceTab);
  } catch (error) {
    if (error instanceof Error && error.message === "attachment_required") {
      showToast("Для цього запису потрібно прикріпити файл.");
      return;
    }

    if (error instanceof Error && error.message === "attachment_too_large") {
      showToast("Файл завеликий для локального прототипу. Обери вкладення до 2 МБ.");
      return;
    }

    showToast("Не вдалося прочитати вкладення. Спробуй ще раз.");
    return;
  }

  const commonPayload = {
    title: payload.title,
    value: payload.value,
    note: payload.note,
    date: new Date(recordDateInput.value).toISOString(),
    sourceTab,
    attachment: payload.attachment ?? null,
  };

  if (state.draftActionMeta?.mode === "edit" && state.draftActionMeta?.entryId) {
    await updateEntry(state.draftActionMeta.entryId, action, commonPayload);
  } else {
    await addEntry(action, commonPayload);
  }

  state.draftActionType = null;
  state.draftActionMeta = null;
  resetRecordFormUi();
  recordForm.reset();
  recordFormSheet.close();
  syncAddRecordScrollLock();
});

resetDemoButton.addEventListener("click", () => {
  state.uiTest = {
    context: "auto",
    dataMode: "default",
    longText: false,
  };
  state.activeFilter = "all";
  state.selectedCycleDate = toLocalDateKey(new Date());
  state.cycleMonthCursor = toMonthCursorKey(new Date());
  render();
  showToast("Тестовий UI-режим скинуто до базового стану.");
});

composerSheet.addEventListener("click", (event) => {
  const rect = composerSheet.getBoundingClientRect();
  const isInside =
    rect.top <= event.clientY &&
    event.clientY <= rect.top + rect.height &&
    rect.left <= event.clientX &&
    event.clientX <= rect.left + rect.width;

  if (!isInside) {
    composerSheet.close();
  }
});

composerSheet.addEventListener("close", syncAddRecordScrollLock);

testSheet.addEventListener("click", (event) => {
  const rect = testSheet.getBoundingClientRect();
  const isInside =
    rect.top <= event.clientY &&
    event.clientY <= rect.top + rect.height &&
    rect.left <= event.clientX &&
    event.clientX <= rect.left + rect.width;

  if (!isInside) {
    testSheet.close();
  }
});

entryDetailSheet.addEventListener("click", (event) => {
  const rect = entryDetailSheet.getBoundingClientRect();
  const isInside =
    rect.top <= event.clientY &&
    event.clientY <= rect.top + rect.height &&
    rect.left <= event.clientX &&
    event.clientX <= rect.left + rect.width;

  if (!isInside) {
    entryDetailSheet.close();
    syncAddRecordScrollLock();
  }
});

cycleDaySheet.addEventListener("click", (event) => {
  const rect = cycleDaySheet.getBoundingClientRect();
  const isInside =
    rect.top <= event.clientY &&
    event.clientY <= rect.top + rect.height &&
    rect.left <= event.clientX &&
    event.clientX <= rect.left + rect.width;

  if (!isInside) {
    cycleDaySheet.close();
  }
});

entryDetailSheet.addEventListener("close", () => syncAddRecordScrollLock());
cycleDaySheet.addEventListener("close", () => syncAddRecordScrollLock());

recordFormSheet.addEventListener("click", (event) => {
  const rect = recordFormSheet.getBoundingClientRect();
  const isInside =
    rect.top <= event.clientY &&
    event.clientY <= rect.top + rect.height &&
    rect.left <= event.clientX &&
    event.clientX <= rect.left + rect.width;

  if (!isInside) {
    recordFormSheet.close();
  }
});

recordFormSheet.addEventListener("close", () => {
  state.draftActionType = null;
  state.draftActionMeta = null;
  resetRecordFormUi();
  syncAddRecordScrollLock();
});

document.querySelectorAll(".icon-button").forEach((button) => {
  button.innerHTML = icon("close", "button-icon");
});

let lastScrollY = 0;
window.addEventListener("scroll", () => {
  const scrolled = window.scrollY > 60;
  openComposerButton.classList.toggle("fab-compact", scrolled);
  lastScrollY = window.scrollY;
}, { passive: true });

renderComposerActions();
await hydrateEntries();
render();
