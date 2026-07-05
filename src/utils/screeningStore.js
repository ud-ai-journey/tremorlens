/**
 * Local persistence for tremor screenings. Uses localStorage so the app works
 * offline with zero setup; the same shape can later be synced to Supabase.
 */

const KEY = 'neuroscreen_screenings';

export function getScreenings() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to read screenings:', e);
    return [];
  }
}

export function saveScreening(entry) {
  const record = {
    id:
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2),
    created_at: new Date().toISOString(),
    ...entry,
  };
  const all = getScreenings();
  all.unshift(record);
  try {
    localStorage.setItem(KEY, JSON.stringify(all.slice(0, 100)));
  } catch (e) {
    console.error('Failed to save screening:', e);
  }
  return record;
}

export function deleteScreening(id) {
  const all = getScreenings().filter((s) => s.id !== id);
  localStorage.setItem(KEY, JSON.stringify(all));
  return all;
}
