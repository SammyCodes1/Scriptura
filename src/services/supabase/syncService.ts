import { supabase, isSupabaseConfigured } from './client';
import {
  getLocalBookmarks,
  getLocalHighlights,
  getLocalNotes,
  getLocalReadingHistory,
  getDatabase,
} from '../../database/sqlite';

/**
 * Syncs locally created bookmarks, highlights, notes, and reading history
 * to the Supabase Postgres backend for an authenticated user.
 */
export async function syncGuestDataToSupabase(userId: string): Promise<{
  bookmarksSynced: number;
  highlightsSynced: number;
  notesSynced: number;
  historySynced: number;
}> {
  if (!isSupabaseConfigured || !userId) {
    return { bookmarksSynced: 0, highlightsSynced: 0, notesSynced: 0, historySynced: 0 };
  }

  let bookmarksSynced = 0;
  let highlightsSynced = 0;
  let notesSynced = 0;
  let historySynced = 0;

  try {
    const db = await getDatabase();

    // 1. Sync Bookmarks
    const localBookmarks = await getLocalBookmarks();
    const unsyncedBookmarks = localBookmarks.filter(b => b.synced === 0);
    if (unsyncedBookmarks.length > 0) {
      const payload = unsyncedBookmarks.map(b => ({
        user_id: userId,
        book: b.book,
        chapter: b.chapter,
        verse: b.verse,
        translation: b.translation,
        created_at: b.created_at,
      }));

      const { error } = await supabase
        .from('bookmarks')
        .upsert(payload, { onConflict: 'user_id,book,chapter,verse,translation' });

      if (!error) {
        bookmarksSynced = unsyncedBookmarks.length;
        if (db) {
          await db.runAsync(`UPDATE local_bookmarks SET synced = 1, user_id = ? WHERE synced = 0`, [userId]);
        }
      }
    }

    // 2. Sync Highlights
    const localHighlights = await getLocalHighlights();
    const unsyncedHighlights = localHighlights.filter(h => h.synced === 0);
    if (unsyncedHighlights.length > 0) {
      const payload = unsyncedHighlights.map(h => ({
        user_id: userId,
        book: h.book,
        chapter: h.chapter,
        verse: h.verse,
        translation: h.translation,
        color: h.color,
        created_at: h.created_at,
      }));

      const { error } = await supabase
        .from('highlights')
        .upsert(payload, { onConflict: 'user_id,book,chapter,verse,translation' });

      if (!error) {
        highlightsSynced = unsyncedHighlights.length;
        if (db) {
          await db.runAsync(`UPDATE local_highlights SET synced = 1, user_id = ? WHERE synced = 0`, [userId]);
        }
      }
    }

    // 3. Sync Notes
    const localNotes = await getLocalNotes();
    const unsyncedNotes = localNotes.filter(n => n.synced === 0);
    if (unsyncedNotes.length > 0) {
      const payload = unsyncedNotes.map(n => ({
        user_id: userId,
        book: n.book,
        chapter: n.chapter,
        verse: n.verse,
        translation: n.translation,
        text: n.text,
        created_at: n.created_at,
        updated_at: n.updated_at,
      }));

      const { error } = await supabase.from('notes').insert(payload);

      if (!error) {
        notesSynced = unsyncedNotes.length;
        if (db) {
          await db.runAsync(`UPDATE local_notes SET synced = 1, user_id = ? WHERE synced = 0`, [userId]);
        }
      }
    }

    // 4. Sync Reading History
    const localHistory = await getLocalReadingHistory();
    const unsyncedHistory = localHistory.filter(h => h.synced === 0);
    if (unsyncedHistory.length > 0) {
      const payload = unsyncedHistory.map(h => ({
        user_id: userId,
        book: h.book,
        chapter: h.chapter,
        translation: h.translation,
        last_read_at: h.last_read_at,
      }));

      const { error } = await supabase
        .from('reading_history')
        .upsert(payload, { onConflict: 'user_id,book,chapter,translation' });

      if (!error) {
        historySynced = unsyncedHistory.length;
        if (db) {
          await db.runAsync(`UPDATE local_reading_history SET synced = 1, user_id = ? WHERE synced = 0`, [userId]);
        }
      }
    }
  } catch (err) {
    console.error('Error during data synchronization to Supabase:', err);
  }

  return { bookmarksSynced, highlightsSynced, notesSynced, historySynced };
}
