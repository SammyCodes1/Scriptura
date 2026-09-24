import { ENV } from '../../config/env';
import { resolveBook } from '../../config/books';
import { getActiveTranslations, getTranslationInfo } from '../../config/translations';
import {
  getLocalVersesFromSqlite,
  searchLocalVersesInSqlite,
  getCachedChapter,
  setCachedChapter,
  recordLocalReadingHistory,
} from '../../database/sqlite';
import { fetchChapterFromApiBible } from './apiBibleClient';
import {
  BibleChapter,
  BibleTranslationInfo,
  BibleVerse,
  IBibleProvider,
  SearchVerseResult,
} from './types';
import { enrichVerseWithFootnotes } from '../../utils/footnoteParser';

/**
 * Unified BibleProvider abstraction.
 * Completely hides whether text originates from bundled offline SQLite,
 * locally cached SQLite, or remote API.Bible REST calls.
 */
export class BibleProvider implements IBibleProvider {
  /**
   * Returns list of translations according to the IS_COMMERCIAL flag.
   */
  getAvailableTranslations(): BibleTranslationInfo[] {
    return getActiveTranslations();
  }

  /**
   * Fetches a chapter from either local SQLite or API.Bible,
   * automatically caching remote chapters to local SQLite.
   */
  async getChapter(
    translation: string,
    bookInput: string,
    chapter: number
  ): Promise<BibleChapter> {
    const trUpper = translation.trim().toUpperCase();
    const trInfo = getTranslationInfo(trUpper);

    if (!trInfo) {
      throw new Error(`Translation '${translation}' is not supported.`);
    }

    // Commercial rule enforcement
    if (ENV.IS_COMMERCIAL && trUpper === 'NIV') {
      throw new Error(
        'NIV is excluded in commercial mode: no commercial license is available at any price.'
      );
    }

    const book = resolveBook(bookInput);
    if (!book) {
      throw new Error(`Bible book '${bookInput}' not recognized.`);
    }

    if (chapter < 1 || chapter > book.chapters) {
      throw new Error(`Invalid chapter ${chapter} for book ${book.name} (has ${book.chapters} chapters).`);
    }

    // 1. If Local Translation: Bundled in SQLite (Zero network calls)
    if (trInfo.isLocal) {
      const verses = await getLocalVersesFromSqlite(trUpper, book.code, chapter);

      // Record reading history locally
      await recordLocalReadingHistory({
        user_id: null,
        book: book.name,
        chapter,
        translation: trUpper,
      });

      const enriched = verses.map(enrichVerseWithFootnotes);

      return {
        translation: trUpper,
        bookCode: book.code,
        bookName: book.name,
        chapter,
        verses: enriched,
        source: 'local',
      };
    }

    // 2. If Remote Translation: Check local SQLite cache first (Offline Repeat Reads)
    const cachedVerses = await getCachedChapter(trUpper, book.code, chapter);
    if (cachedVerses && cachedVerses.length > 0) {
      await recordLocalReadingHistory({
        user_id: null,
        book: book.name,
        chapter,
        translation: trUpper,
      });

      const enriched = cachedVerses.map(enrichVerseWithFootnotes);

      return {
        translation: trUpper,
        bookCode: book.code,
        bookName: book.name,
        chapter,
        verses: enriched,
        source: 'cache',
      };
    }

    // 3. Remote translation not in cache: Fetch via API.Bible REST API
    const remoteResult = await fetchChapterFromApiBible(trUpper, book.code, chapter);

    // Save fetched chapter to local SQLite cache immediately
    await setCachedChapter(trUpper, book.code, chapter, remoteResult.verses);

    // Record reading history
    await recordLocalReadingHistory({
      user_id: null,
      book: book.name,
      chapter,
      translation: trUpper,
    });

    const enriched = remoteResult.verses.map(enrichVerseWithFootnotes);

    return {
      translation: trUpper,
      bookCode: book.code,
      bookName: book.name,
      chapter,
      verses: enriched,
      source: 'remote',
      copyright: remoteResult.copyright,
    };
  }

  /**
   * Search verses in current translation or across all downloaded translations.
   */
  async search(
    translation: string,
    query: string,
    limit = 50,
    searchAllTranslations = false
  ): Promise<SearchVerseResult[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }
    const target = searchAllTranslations ? 'ALL' : translation.trim().toUpperCase();
    const rows = await searchLocalVersesInSqlite(target, query.trim(), limit);
    return rows.map(r => {
      const bookInfo = resolveBook(r.book_code || r.book);
      const isNT = bookInfo?.testament === 'NT' || ['MAT','MRK','LUK','JHN','ACT','ROM','1CO','2CO','GAL','EPH','PHP','COL','1TH','2TH','1TI','2TI','TIT','PHM','HEB','JAS','1PE','2PE','1JN','2JN','3JN','JUD','REV'].includes(r.book_code?.toUpperCase());
      return {
        translation: r.translation,
        bookName: bookInfo?.name || r.book,
        bookCode: bookInfo?.code || r.book_code,
        chapter: r.chapter,
        verse: r.verse,
        text: r.text,
        testament: isNT ? 'NT' : 'OT',
      };
    });
  }
}

// Global singleton instance
export const bibleProvider = new BibleProvider();
