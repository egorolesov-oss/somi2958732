const STORAGE_KEY = "somi.journal.entries.v1";

function convertFiveScaleToTenScale(score) {
  return String(Math.max(1, Math.min(10, Math.round((Number(score) / 5) * 10))));
}

function normalizeLegacyScaleText(text = "") {
  return String(text || "").replace(/\b([1-5])\/5\b/gi, (_, score) => `${convertFiveScaleToTenScale(score)}/10`);
}

export function createJournalEntryId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `entry-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

export function normalizeJournalEntry(entry) {
  const attachment =
    entry && typeof entry.attachment === "object" && entry.attachment
      ? {
          name: String(entry.attachment.name || ""),
          type: String(entry.attachment.type || ""),
          size: Number(entry.attachment.size || 0),
          dataUrl: String(entry.attachment.dataUrl || ""),
        }
      : null;

  return {
    id: String(entry.id),
    type: String(entry.type || "note"),
    title: String(entry.title || ""),
    value: normalizeLegacyScaleText(entry.value || ""),
    note: String(entry.note || ""),
    date: String(entry.date || new Date().toISOString()),
    tags: Array.isArray(entry.tags) ? entry.tags.map((tag) => String(tag)) : [],
    context: String(entry.context || "base"),
    attachment: attachment && attachment.name && attachment.dataUrl ? attachment : null,
  };
}

export const journalRepository = {
  async listEntries(fallbackEntries = []) {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return fallbackEntries.map(normalizeJournalEntry);
      }

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return fallbackEntries.map(normalizeJournalEntry);
      }

      return parsed.map(normalizeJournalEntry);
    } catch {
      return fallbackEntries.map(normalizeJournalEntry);
    }
  },

  async saveEntries(entries) {
    const normalized = entries.map(normalizeJournalEntry);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    return normalized;
  },
};
