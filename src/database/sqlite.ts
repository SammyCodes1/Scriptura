import { Platform } from 'react-native';
import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system/legacy';
import { Asset } from 'expo-asset';
import { BibleVerse } from '../services/bible/types';
import {
  ConfessionDeck,
  ConfessionItem,
  calculateConfessionStreak,
} from '../config/confessionDecks';
import starterChaptersData from '../data/starterChapters.json';

const starterChapters: Record<string, BibleVerse[]> = starterChaptersData as any;

export interface CachedChapterRow {
  translation: string;
  book_code: string;
  chapter: number;
  content_json: string;
  cached_at: number;
}

export interface LocalBookmarkRow {
  id: string;
  user_id: string | null;
  book: string;
  chapter: number;
  verse: number;
  translation: string;
  created_at: string;
  synced: number;
}

export interface LocalHighlightRow {
  id: string;
  user_id: string | null;
  book: string;
  chapter: number;
  verse: number;
  translation: string;
  color: string;
  created_at: string;
  synced: number;
}

export interface LocalNoteRow {
  id: string;
  user_id: string | null;
  book: string;
  chapter: number;
  verse: number;
  translation: string;
  text: string;
  created_at: string;
  updated_at: string;
  synced: number;
}

export interface LocalReadingHistoryRow {
  id: string;
  user_id: string | null;
  book: string;
  chapter: number;
  translation: string;
  last_read_at: string;
  synced: number;
}

let dbInstance: SQLite.SQLiteDatabase | null = null;
let isInitialized = false;

// Web memory fallback for web development
const webMemoryCache = new Map<string, string>();
const webLocalBookmarks = new Map<string, LocalBookmarkRow>();
const webLocalHighlights = new Map<string, LocalHighlightRow>();
const webLocalNotes = new Map<string, LocalNoteRow>();
const webLocalHistory = new Map<string, LocalReadingHistoryRow>();

/**
 * Initializes the SQLite database.
 * On native platforms, ensures the pre-packaged bibles.db is placed in the SQLite directory.
 */
export async function getDatabase(): Promise<SQLite.SQLiteDatabase | null> {
  if (Platform.OS === 'web') {
    return null;
  }

  if (dbInstance && isInitialized) {
    return dbInstance;
  }

  try {
    const dbName = 'scriptura.db';
    const sqliteDir = `${FileSystem.documentDirectory}SQLite`;
    const targetPath = `${sqliteDir}/${dbName}`;

    // Ensure SQLite directory exists
    const dirInfo = await FileSystem.getInfoAsync(sqliteDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(sqliteDir, { intermediates: true });
    }

    // Check if scriptura.db already exists
    const fileInfo = await FileSystem.getInfoAsync(targetPath);
    if (!fileInfo.exists) {
      // Copy bundled bibles.db asset if available
      try {
        const asset = Asset.fromModule(require('../../assets/bibles.db'));
        await asset.downloadAsync();
        if (asset.localUri) {
          await FileSystem.copyAsync({
            from: asset.localUri,
            to: targetPath,
          });
        }
      } catch (assetErr) {
        console.warn('Bundled database asset not copied, initializing fresh database:', assetErr);
      }
    }

    const db = await SQLite.openDatabaseAsync(dbName);

    // Ensure all required tables and indexes exist
    await db.execAsync(`
      PRAGMA journal_mode = WAL;

      CREATE TABLE IF NOT EXISTS verses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        translation TEXT NOT NULL,
        book TEXT NOT NULL,
        book_code TEXT NOT NULL,
        chapter INTEGER NOT NULL,
        verse INTEGER NOT NULL,
        text TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_verses_lookup ON verses(translation, book_code, chapter, verse);
      CREATE INDEX IF NOT EXISTS idx_verses_book ON verses(translation, book, chapter);

      CREATE TABLE IF NOT EXISTS cached_chapters (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        translation TEXT NOT NULL,
        book_code TEXT NOT NULL,
        chapter INTEGER NOT NULL,
        content_json TEXT NOT NULL,
        cached_at INTEGER NOT NULL,
        UNIQUE(translation, book_code, chapter)
      );

      CREATE TABLE IF NOT EXISTS local_bookmarks (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        book TEXT NOT NULL,
        chapter INTEGER NOT NULL,
        verse INTEGER NOT NULL,
        translation TEXT NOT NULL,
        created_at TEXT NOT NULL,
        synced INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS local_highlights (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        book TEXT NOT NULL,
        chapter INTEGER NOT NULL,
        verse INTEGER NOT NULL,
        translation TEXT NOT NULL,
        color TEXT NOT NULL,
        created_at TEXT NOT NULL,
        synced INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS local_notes (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        book TEXT NOT NULL,
        chapter INTEGER NOT NULL,
        verse INTEGER NOT NULL,
        translation TEXT NOT NULL,
        text TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        synced INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS local_reading_history (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        book TEXT NOT NULL,
        chapter INTEGER NOT NULL,
        translation TEXT NOT NULL,
        last_read_at TEXT NOT NULL,
        synced INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS local_reading_plan_progress (
        plan_id TEXT PRIMARY KEY,
        current_day INTEGER NOT NULL DEFAULT 1,
        completed_days_json TEXT NOT NULL DEFAULT '[]',
        streak INTEGER NOT NULL DEFAULT 0,
        last_completed_date TEXT,
        started_at TEXT NOT NULL,
        synced INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS local_confession_decks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        theme TEXT NOT NULL,
        description TEXT,
        is_custom INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        synced INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS local_confession_items (
        id TEXT PRIMARY KEY,
        deck_id TEXT NOT NULL,
        title TEXT NOT NULL,
        scripture_reference TEXT NOT NULL,
        confession_text TEXT NOT NULL,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        synced INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS local_confession_progress (
        deck_id TEXT PRIMARY KEY,
        completed_today INTEGER DEFAULT 0,
        streak INTEGER DEFAULT 0,
        times_recited INTEGER DEFAULT 0,
        last_recited_date TEXT,
        synced INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS local_bible_places (
        id TEXT PRIMARY KEY,
        ancient_id TEXT,
        name TEXT NOT NULL,
        lat REAL NOT NULL,
        lng REAL NOT NULL,
        confidence INTEGER DEFAULT 500,
        verse_refs_json TEXT NOT NULL DEFAULT '[]',
        verse_count INTEGER NOT NULL DEFAULT 0,
        image_url TEXT,
        image_attribution TEXT,
        image_credit_url TEXT,
        is_featured INTEGER DEFAULT 0,
        featured_note TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_places_name ON local_bible_places(name);
      CREATE INDEX IF NOT EXISTS idx_places_featured ON local_bible_places(is_featured);
    `);

    dbInstance = db;
    isInitialized = true;
    return dbInstance;
  } catch (error) {
    console.error('Failed to initialize SQLite database:', error);
    return null;
  }
}

/**
 * Retrieves bundled local verses from SQLite.
 */
export async function getLocalVersesFromSqlite(
  translation: string,
  bookCode: string,
  chapter: number
): Promise<BibleVerse[]> {
  const trUpper = translation.toUpperCase();
  const bkUpper = bookCode.toUpperCase();

  if (Platform.OS === 'web') {
    const key = `${trUpper}_${bkUpper}_${chapter}`;

    // 1. Check pre-bundled starter chapters (instant 0ms response)
    if (starterChapters[key]) {
      return starterChapters[key];
    }

    // 2. Check in-memory/localStorage cache
    if (typeof localStorage !== 'undefined') {
      try {
        const cached = localStorage.getItem(`@scriptura_verses_${key}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch {}
    }

    // 3. Fetch from /api/chapter serverless endpoint
    try {
      const url = `/api/chapter?translation=${encodeURIComponent(trUpper)}&book=${encodeURIComponent(bkUpper)}&chapter=${chapter}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.verses) && data.verses.length > 0) {
          if (typeof localStorage !== 'undefined') {
            try {
              localStorage.setItem(`@scriptura_verses_${key}`, JSON.stringify(data.verses));
            } catch {}
          }
          return data.verses;
        }
      }
    } catch (e) {
      console.warn('Failed to fetch chapter from web API:', e);
    }

    return [];
  }

  const db = await getDatabase();
  if (!db) {
    return [];
  }

  const rows = await db.getAllAsync<{ verse: number; text: string }>(
    `SELECT verse, text FROM verses 
     WHERE translation = ? AND (book_code = ? OR book = ?) AND chapter = ? 
     ORDER BY verse ASC`,
    [trUpper, bkUpper, bkUpper, chapter]
  );

  return rows.map(r => ({ verse: r.verse, text: r.text }));
}

/**
 * Searches local bundled verses across a single translation or ALL translations.
 */
export async function searchLocalVersesInSqlite(
  translation: string,
  query: string,
  limit = 150
): Promise<Array<{ translation: string; book: string; book_code: string; chapter: number; verse: number; text: string }>> {
  const trUpper = translation.toUpperCase();

  if (Platform.OS === 'web') {
    try {
      const url = `/api/search?translation=${encodeURIComponent(trUpper)}&query=${encodeURIComponent(query)}&limit=${limit}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.results)) {
          return data.results;
        }
      }
    } catch (e) {
      console.warn('Failed to search verses from web API:', e);
    }
    return [];
  }

  const db = await getDatabase();
  if (!db) return [];

  let sql = '';
  let params: any[] = [];

  if (trUpper === 'ALL') {
    sql = `SELECT translation, book, book_code, chapter, verse, text 
           FROM verses 
           WHERE text LIKE ? 
           LIMIT ?`;
    params = [`%${query}%`, limit];
  } else {
    sql = `SELECT translation, book, book_code, chapter, verse, text 
           FROM verses 
           WHERE translation = ? AND text LIKE ? 
           LIMIT ?`;
    params = [trUpper, `%${query}%`, limit];
  }

  const rows = await db.getAllAsync<{
    translation: string;
    book: string;
    book_code: string;
    chapter: number;
    verse: number;
    text: string;
  }>(sql, params);

  return rows;
}

/**
 * Returns the number of verses in a given chapter.
 */
export async function getChapterVerseCount(
  bookCode: string,
  chapter: number,
  translation = 'KJV'
): Promise<number> {
  const db = await getDatabase();
  if (!db) return 30; // fallback standard estimate

  const row = await db.getFirstAsync<{ max_v: number }>(
    `SELECT MAX(verse) as max_v FROM verses 
     WHERE (book_code = ? OR book = ?) AND chapter = ?`,
    [bookCode.toUpperCase(), bookCode, chapter]
  );

  return row?.max_v || 30;
}

/**
 * Returns number of cached chapters for a translation.
 */
export async function getCachedChaptersCount(translation: string): Promise<number> {
  const db = await getDatabase();
  if (!db) return 0;
  const row = await db.getFirstAsync<{ cnt: number }>(
    `SELECT COUNT(*) as cnt FROM cached_chapters WHERE translation = ?`,
    [translation.toUpperCase()]
  );
  return row?.cnt || 0;
}

/**
 * Clears cached chapters for a translation to free up space.
 */
export async function deleteCachedTranslation(translation: string): Promise<void> {
  const db = await getDatabase();
  if (!db) return;
  await db.runAsync(`DELETE FROM cached_chapters WHERE translation = ?`, [translation.toUpperCase()]);
}

/**
 * Retrieves a cached remote chapter.
 */
export async function getCachedChapter(
  translation: string,
  bookCode: string,
  chapter: number
): Promise<BibleVerse[] | null> {
  const key = `${translation.toUpperCase()}_${bookCode.toUpperCase()}_${chapter}`;
  if (Platform.OS === 'web') {
    const raw = webMemoryCache.get(key);
    return raw ? JSON.parse(raw) : null;
  }

  const db = await getDatabase();
  if (!db) {
    const raw = webMemoryCache.get(key);
    return raw ? JSON.parse(raw) : null;
  }

  const row = await db.getFirstAsync<{ content_json: string }>(
    `SELECT content_json FROM cached_chapters 
     WHERE translation = ? AND book_code = ? AND chapter = ?`,
    [translation.toUpperCase(), bookCode.toUpperCase(), chapter]
  );

  if (!row) return null;
  try {
    return JSON.parse(row.content_json) as BibleVerse[];
  } catch (err) {
    console.error('Failed to parse cached chapter JSON:', err);
    return null;
  }
}

/**
 * Saves a fetched chapter to local SQLite cache.
 */
export async function setCachedChapter(
  translation: string,
  bookCode: string,
  chapter: number,
  verses: BibleVerse[]
): Promise<void> {
  const key = `${translation.toUpperCase()}_${bookCode.toUpperCase()}_${chapter}`;
  const json = JSON.stringify(verses);
  const now = Date.now();

  if (Platform.OS === 'web') {
    webMemoryCache.set(key, json);
    return;
  }

  const db = await getDatabase();
  if (!db) {
    webMemoryCache.set(key, json);
    return;
  }

  await db.runAsync(
    `INSERT OR REPLACE INTO cached_chapters (translation, book_code, chapter, content_json, cached_at)
     VALUES (?, ?, ?, ?, ?)`,
    [translation.toUpperCase(), bookCode.toUpperCase(), chapter, json, now]
  );
}

// -----------------------------------------------------------------------------
// LOCAL / GUEST BOOKMARKS, HIGHLIGHTS, NOTES, READING HISTORY
// -----------------------------------------------------------------------------

export async function addLocalBookmark(
  bookmark: Omit<LocalBookmarkRow, 'id' | 'created_at' | 'synced'>
): Promise<LocalBookmarkRow> {
  const id = `bm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const created_at = new Date().toISOString();
  const row: LocalBookmarkRow = { ...bookmark, id, created_at, synced: 0 };

  if (Platform.OS === 'web') {
    webLocalBookmarks.set(id, row);
    return row;
  }

  const db = await getDatabase();
  if (db) {
    await db.runAsync(
      `INSERT OR REPLACE INTO local_bookmarks (id, user_id, book, chapter, verse, translation, created_at, synced)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [row.id, row.user_id, row.book, row.chapter, row.verse, row.translation, row.created_at, row.synced]
    );
  } else {
    webLocalBookmarks.set(id, row);
  }
  return row;
}

export async function getLocalBookmarks(): Promise<LocalBookmarkRow[]> {
  if (Platform.OS === 'web') {
    return Array.from(webLocalBookmarks.values());
  }
  const db = await getDatabase();
  if (!db) return Array.from(webLocalBookmarks.values());
  return await db.getAllAsync<LocalBookmarkRow>(`SELECT * FROM local_bookmarks ORDER BY created_at DESC`);
}

export async function addLocalHighlight(
  highlight: Omit<LocalHighlightRow, 'id' | 'created_at' | 'synced'>
): Promise<LocalHighlightRow> {
  const id = `hl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const created_at = new Date().toISOString();
  const row: LocalHighlightRow = { ...highlight, id, created_at, synced: 0 };

  if (Platform.OS === 'web') {
    webLocalHighlights.set(id, row);
    return row;
  }

  const db = await getDatabase();
  if (db) {
    await db.runAsync(
      `INSERT OR REPLACE INTO local_highlights (id, user_id, book, chapter, verse, translation, color, created_at, synced)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [row.id, row.user_id, row.book, row.chapter, row.verse, row.translation, row.color, row.created_at, row.synced]
    );
  } else {
    webLocalHighlights.set(id, row);
  }
  return row;
}

export async function getLocalHighlights(): Promise<LocalHighlightRow[]> {
  if (Platform.OS === 'web') {
    return Array.from(webLocalHighlights.values());
  }
  const db = await getDatabase();
  if (!db) return Array.from(webLocalHighlights.values());
  return await db.getAllAsync<LocalHighlightRow>(`SELECT * FROM local_highlights ORDER BY created_at DESC`);
}

export async function addLocalNote(
  note: Omit<LocalNoteRow, 'id' | 'created_at' | 'updated_at' | 'synced'>
): Promise<LocalNoteRow> {
  const id = `nt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();
  const row: LocalNoteRow = { ...note, id, created_at: now, updated_at: now, synced: 0 };

  if (Platform.OS === 'web') {
    webLocalNotes.set(id, row);
    return row;
  }

  const db = await getDatabase();
  if (db) {
    await db.runAsync(
      `INSERT OR REPLACE INTO local_notes (id, user_id, book, chapter, verse, translation, text, created_at, updated_at, synced)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [row.id, row.user_id, row.book, row.chapter, row.verse, row.translation, row.text, row.created_at, row.updated_at, row.synced]
    );
  } else {
    webLocalNotes.set(id, row);
  }
  return row;
}

export async function getLocalNotes(): Promise<LocalNoteRow[]> {
  if (Platform.OS === 'web') {
    return Array.from(webLocalNotes.values());
  }
  const db = await getDatabase();
  if (!db) return Array.from(webLocalNotes.values());
  return await db.getAllAsync<LocalNoteRow>(`SELECT * FROM local_notes ORDER BY created_at DESC`);
}

export async function recordLocalReadingHistory(
  item: Omit<LocalReadingHistoryRow, 'id' | 'last_read_at' | 'synced'>
): Promise<LocalReadingHistoryRow> {
  const id = `rh_${item.translation}_${item.book}_${item.chapter}`;
  const now = new Date().toISOString();
  const row: LocalReadingHistoryRow = { ...item, id, last_read_at: now, synced: 0 };

  if (Platform.OS === 'web') {
    webLocalHistory.set(id, row);
    return row;
  }

  const db = await getDatabase();
  if (db) {
    await db.runAsync(
      `INSERT OR REPLACE INTO local_reading_history (id, user_id, book, chapter, translation, last_read_at, synced)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [row.id, row.user_id, row.book, row.chapter, row.translation, row.last_read_at, row.synced]
    );
  } else {
    webLocalHistory.set(id, row);
  }
  return row;
}

export async function getLocalReadingHistory(limit = 20): Promise<LocalReadingHistoryRow[]> {
  if (Platform.OS === 'web') {
    return Array.from(webLocalHistory.values()).slice(0, limit);
  }
  const db = await getDatabase();
  if (!db) return Array.from(webLocalHistory.values()).slice(0, limit);
  return await db.getAllAsync<LocalReadingHistoryRow>(
    `SELECT * FROM local_reading_history ORDER BY last_read_at DESC LIMIT ?`,
    [limit]
  );
}

export async function removeLocalBookmark(id: string): Promise<void> {
  if (Platform.OS === 'web') {
    webLocalBookmarks.delete(id);
    return;
  }
  const db = await getDatabase();
  if (db) {
    await db.runAsync(`DELETE FROM local_bookmarks WHERE id = ?`, [id]);
  } else {
    webLocalBookmarks.delete(id);
  }
}

export async function removeLocalBookmarkByVerse(
  book: string,
  chapter: number,
  verse: number,
  translation: string
): Promise<void> {
  if (Platform.OS === 'web') {
    for (const [id, bm] of webLocalBookmarks.entries()) {
      if (bm.book === book && bm.chapter === chapter && bm.verse === verse && bm.translation === translation) {
        webLocalBookmarks.delete(id);
      }
    }
    return;
  }
  const db = await getDatabase();
  if (db) {
    await db.runAsync(
      `DELETE FROM local_bookmarks WHERE book = ? AND chapter = ? AND verse = ? AND translation = ?`,
      [book, chapter, verse, translation]
    );
  }
}

export async function removeLocalHighlight(id: string): Promise<void> {
  if (Platform.OS === 'web') {
    webLocalHighlights.delete(id);
    return;
  }
  const db = await getDatabase();
  if (db) {
    await db.runAsync(`DELETE FROM local_highlights WHERE id = ?`, [id]);
  } else {
    webLocalHighlights.delete(id);
  }
}

export async function removeLocalHighlightByVerse(
  book: string,
  chapter: number,
  verse: number,
  translation: string
): Promise<void> {
  if (Platform.OS === 'web') {
    for (const [id, hl] of webLocalHighlights.entries()) {
      if (hl.book === book && hl.chapter === chapter && hl.verse === verse && hl.translation === translation) {
        webLocalHighlights.delete(id);
      }
    }
    return;
  }
  const db = await getDatabase();
  if (db) {
    await db.runAsync(
      `DELETE FROM local_highlights WHERE book = ? AND chapter = ? AND verse = ? AND translation = ?`,
      [book, chapter, verse, translation]
    );
  }
}

export async function removeLocalNote(id: string): Promise<void> {
  if (Platform.OS === 'web') {
    webLocalNotes.delete(id);
    return;
  }
  const db = await getDatabase();
  if (db) {
    await db.runAsync(`DELETE FROM local_notes WHERE id = ?`, [id]);
  } else {
    webLocalNotes.delete(id);
  }
}

// -----------------------------------------------------------------------------
// READING PLAN PROGRESS (OFFLINE & SYNC)
// -----------------------------------------------------------------------------

export interface LocalPlanProgressRow {
  plan_id: string;
  current_day: number;
  completed_days_json: string;
  streak: number;
  last_completed_date: string | null;
  started_at: string;
  synced: number;
}

const webPlanProgress = new Map<string, LocalPlanProgressRow>();

export async function saveLocalReadingPlanProgress(
  planId: string,
  currentDay: number,
  completedDays: number[],
  streak: number,
  lastCompletedDate?: string
): Promise<void> {
  const json = JSON.stringify(completedDays);
  const now = new Date().toISOString();
  const row: LocalPlanProgressRow = {
    plan_id: planId,
    current_day: currentDay,
    completed_days_json: json,
    streak,
    last_completed_date: lastCompletedDate || null,
    started_at: now,
    synced: 0,
  };

  if (Platform.OS === 'web') {
    webPlanProgress.set(planId, row);
    return;
  }

  const db = await getDatabase();
  if (db) {
    await db.runAsync(
      `INSERT OR REPLACE INTO local_reading_plan_progress 
       (plan_id, current_day, completed_days_json, streak, last_completed_date, started_at, synced)
       VALUES (?, ?, ?, ?, ?, COALESCE((SELECT started_at FROM local_reading_plan_progress WHERE plan_id = ?), ?), 0)`,
      [planId, currentDay, json, streak, lastCompletedDate || null, planId, now]
    );
  } else {
    webPlanProgress.set(planId, row);
  }
}

export async function getLocalReadingPlanProgress(
  planId: string
): Promise<{ planId: string; currentDay: number; completedDays: number[]; streak: number; lastCompletedDate?: string } | null> {
  if (Platform.OS === 'web') {
    const row = webPlanProgress.get(planId);
    if (!row) return null;
    return {
      planId: row.plan_id,
      currentDay: row.current_day,
      completedDays: JSON.parse(row.completed_days_json || '[]'),
      streak: row.streak,
      lastCompletedDate: row.last_completed_date || undefined,
    };
  }

  const db = await getDatabase();
  if (!db) return null;

  const row = await db.getFirstAsync<LocalPlanProgressRow>(
    `SELECT * FROM local_reading_plan_progress WHERE plan_id = ?`,
    [planId]
  );

  if (!row) return null;

  try {
    return {
      planId: row.plan_id,
      currentDay: row.current_day,
      completedDays: JSON.parse(row.completed_days_json || '[]'),
      streak: row.streak,
      lastCompletedDate: row.last_completed_date || undefined,
    };
  } catch {
    return null;
  }
}

// -----------------------------------------------------------------------------
// CONFESSION DECKS, CUSTOM DECKS & LOW-GUILT RECITATION PROGRESS
// -----------------------------------------------------------------------------

export interface LocalConfessionDeckRow {
  id: string;
  title: string;
  theme: string;
  description: string;
  is_custom: number;
  created_at: string;
  synced: number;
}

export interface LocalConfessionItemRow {
  id: string;
  deck_id: string;
  title: string;
  scripture_reference: string;
  confession_text: string;
  sort_order: number;
  created_at: string;
  synced: number;
}

export interface LocalConfessionProgressRow {
  deck_id: string;
  completed_today: number;
  streak: number;
  times_recited: number;
  last_recited_date: string | null;
  synced: number;
}

const webCustomDecks = new Map<string, ConfessionDeck>();
const webConfessionProgress = new Map<
  string,
  { deckId: string; streak: number; timesRecited: number; lastRecitedDate: string | null }
>();

/**
 * Creates a custom confession deck (e.g. from user bookmarks or highlights).
 */
export async function addCustomConfessionDeck(deckData: {
  title: string;
  theme?: string;
  description?: string;
  items: Array<{
    title: string;
    scriptureReference: string;
    confessionText: string;
  }>;
}): Promise<ConfessionDeck> {
  const deckId = `deck_custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();
  const theme = (deckData.theme || 'Custom') as any;
  const description = deckData.description || 'Personal scripture declaration deck.';

  const items: ConfessionItem[] = deckData.items.map((item, idx) => ({
    id: `item_${Date.now()}_${idx}`,
    deckId,
    title: item.title,
    scriptureReference: item.scriptureReference,
    confessionText: item.confessionText,
    sortOrder: idx + 1,
  }));

  const newDeck: ConfessionDeck = {
    id: deckId,
    title: deckData.title,
    theme,
    description,
    isCustom: true,
    items,
  };

  if (Platform.OS === 'web') {
    webCustomDecks.set(deckId, newDeck);
    return newDeck;
  }

  const db = await getDatabase();
  if (!db) {
    webCustomDecks.set(deckId, newDeck);
    return newDeck;
  }

  // Insert deck
  await db.runAsync(
    `INSERT INTO local_confession_decks (id, title, theme, description, is_custom, created_at, synced)
     VALUES (?, ?, ?, ?, 1, ?, 0)`,
    [deckId, deckData.title, theme, description, now]
  );

  // Insert items
  for (const item of items) {
    await db.runAsync(
      `INSERT INTO local_confession_items (id, deck_id, title, scripture_reference, confession_text, sort_order, created_at, synced)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
      [item.id, deckId, item.title, item.scriptureReference, item.confessionText, item.sortOrder, now]
    );
  }

  return newDeck;
}

/**
 * Retrieves all custom confession decks created by the user.
 */
export async function getLocalCustomConfessionDecks(): Promise<ConfessionDeck[]> {
  if (Platform.OS === 'web') {
    return Array.from(webCustomDecks.values());
  }

  const db = await getDatabase();
  if (!db) return Array.from(webCustomDecks.values());

  const deckRows = await db.getAllAsync<LocalConfessionDeckRow>(
    `SELECT * FROM local_confession_decks ORDER BY created_at DESC`
  );

  const result: ConfessionDeck[] = [];

  for (const deck of deckRows) {
    const itemRows = await db.getAllAsync<LocalConfessionItemRow>(
      `SELECT * FROM local_confession_items WHERE deck_id = ? ORDER BY sort_order ASC`,
      [deck.id]
    );

    result.push({
      id: deck.id,
      title: deck.title,
      theme: deck.theme as any,
      description: deck.description || '',
      isCustom: true,
      items: itemRows.map(i => ({
        id: i.id,
        deckId: i.deck_id,
        title: i.title,
        scriptureReference: i.scripture_reference,
        confessionText: i.confession_text,
        sortOrder: i.sort_order,
      })),
    });
  }

  return result;
}

/**
 * Deletes a custom confession deck and its items.
 */
export async function deleteCustomConfessionDeck(deckId: string): Promise<void> {
  if (Platform.OS === 'web') {
    webCustomDecks.delete(deckId);
    return;
  }

  const db = await getDatabase();
  if (db) {
    await db.runAsync(`DELETE FROM local_confession_decks WHERE id = ?`, [deckId]);
    await db.runAsync(`DELETE FROM local_confession_items WHERE deck_id = ?`, [deckId]);
    await db.runAsync(`DELETE FROM local_confession_progress WHERE deck_id = ?`, [deckId]);
  } else {
    webCustomDecks.delete(deckId);
  }
}

/**
 * Records completion/recitation for a confession deck today.
 * Reuses low-guilt milestone streak tracking (no shame, no zeroing out on missed calendar days).
 */
export async function recordLocalConfessionRecitation(
  deckId: string
): Promise<{ streak: number; timesRecited: number; isNewDay: boolean }> {
  const todayStr = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"
  const currentProgress = await getLocalConfessionProgress(deckId);

  const prevStreak = currentProgress?.streak || 0;
  const prevRecitations = currentProgress?.timesRecited || 0;
  const lastDate = currentProgress?.lastRecitedDate || null;

  const { nextStreak, isNewDay } = calculateConfessionStreak(prevStreak, lastDate, todayStr);
  const nextRecitations = prevRecitations + 1;

  if (Platform.OS === 'web') {
    webConfessionProgress.set(deckId, {
      deckId,
      streak: nextStreak,
      timesRecited: nextRecitations,
      lastRecitedDate: todayStr,
    });
    return { streak: nextStreak, timesRecited: nextRecitations, isNewDay };
  }

  const db = await getDatabase();
  if (db) {
    await db.runAsync(
      `INSERT OR REPLACE INTO local_confession_progress 
       (deck_id, completed_today, streak, times_recited, last_recited_date, synced)
       VALUES (?, 1, ?, ?, ?, 0)`,
      [deckId, nextStreak, nextRecitations, todayStr]
    );
  } else {
    webConfessionProgress.set(deckId, {
      deckId,
      streak: nextStreak,
      timesRecited: nextRecitations,
      lastRecitedDate: todayStr,
    });
  }

  return { streak: nextStreak, timesRecited: nextRecitations, isNewDay };
}

/**
 * Retrieves the current user progress for a confession deck.
 */
export async function getLocalConfessionProgress(
  deckId: string
): Promise<{
  deckId: string;
  streak: number;
  timesRecited: number;
  lastRecitedDate: string | null;
  completedToday: boolean;
} | null> {
  const todayStr = new Date().toISOString().split('T')[0];

  if (Platform.OS === 'web') {
    const p = webConfessionProgress.get(deckId);
    if (!p) return null;
    return {
      deckId: p.deckId,
      streak: p.streak,
      timesRecited: p.timesRecited,
      lastRecitedDate: p.lastRecitedDate,
      completedToday: p.lastRecitedDate === todayStr,
    };
  }

  const db = await getDatabase();
  if (!db) return null;

  const row = await db.getFirstAsync<LocalConfessionProgressRow>(
    `SELECT * FROM local_confession_progress WHERE deck_id = ?`,
    [deckId]
  );

  if (!row) return null;

  return {
    deckId: row.deck_id,
    streak: row.streak,
    timesRecited: row.times_recited,
    lastRecitedDate: row.last_recited_date,
    completedToday: row.last_recited_date === todayStr,
  };
}

// ─────────────────────────────────────────────────────────────
// BIBLICAL PLACES (GEOCODING) SQLITE OPERATIONS
// ─────────────────────────────────────────────────────────────

export interface LocalBiblePlaceRow {
  id: string;
  ancient_id?: string;
  name: string;
  lat: number;
  lng: number;
  confidence: number;
  verse_refs_json: string;
  verse_count: number;
  image_url: string | null;
  image_attribution: string;
  image_credit_url: string;
  is_featured: number;
  featured_note: string | null;
}

/**
 * Retrieves all biblical places stored in local SQLite.
 */
export async function getLocalBiblePlaces(): Promise<LocalBiblePlaceRow[]> {
  const db = await getDatabase();
  if (!db) return [];

  const rows = await db.getAllAsync<LocalBiblePlaceRow>(
    `SELECT * FROM local_bible_places ORDER BY is_featured DESC, verse_count DESC`
  );
  return rows || [];
}

/**
 * Retrieves only featured biblical places.
 */
export async function getLocalFeaturedBiblePlaces(): Promise<LocalBiblePlaceRow[]> {
  const db = await getDatabase();
  if (!db) return [];

  const rows = await db.getAllAsync<LocalBiblePlaceRow>(
    `SELECT * FROM local_bible_places WHERE is_featured = 1 ORDER BY verse_count DESC`
  );
  return rows || [];
}

/**
 * Searches biblical places by name in local SQLite.
 */
export async function searchLocalBiblePlaces(query: string): Promise<LocalBiblePlaceRow[]> {
  const db = await getDatabase();
  if (!db) return [];

  const trimmed = query.trim();
  if (!trimmed) return getLocalFeaturedBiblePlaces();

  const rows = await db.getAllAsync<LocalBiblePlaceRow>(
    `SELECT * FROM local_bible_places WHERE name LIKE ? ORDER BY is_featured DESC, verse_count DESC LIMIT 30`,
    [`%${trimmed}%`]
  );
  return rows || [];
}

/**
 * Wipes all user-generated data (bookmarks, highlights, notes, reading history,
 * reading plan progress, confessions, and cached chapters) for privacy and account deletion.
 */
export async function wipeAllUserData(): Promise<void> {
  // Clear in-memory fallbacks
  webLocalBookmarks.clear();
  webLocalHighlights.clear();
  webLocalNotes.clear();
  webLocalHistory.clear();
  webPlanProgress.clear();
  webCustomDecks.clear();
  webConfessionProgress.clear();

  const db = await getDatabase();
  if (!db) return;

  await db.withTransactionAsync(async () => {
    await db.runAsync(`DELETE FROM local_bookmarks`);
    await db.runAsync(`DELETE FROM local_highlights`);
    await db.runAsync(`DELETE FROM local_notes`);
    await db.runAsync(`DELETE FROM local_reading_history`);
    await db.runAsync(`DELETE FROM local_reading_plan_progress`);
    await db.runAsync(`DELETE FROM local_confession_decks`);
    await db.runAsync(`DELETE FROM local_confession_items`);
    await db.runAsync(`DELETE FROM local_confession_progress`);
    await db.runAsync(`DELETE FROM cached_chapters`);
  });
}

