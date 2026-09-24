export interface Footnote {
  id: string;
  marker: string; // e.g. "1", "a", "*"
  text: string;
}

export interface BibleVerse {
  verse: number;
  text: string;
  cleanText?: string;
  footnotes?: Footnote[];
}

export interface BibleChapter {
  translation: string;
  bookCode: string;
  bookName: string;
  chapter: number;
  verses: BibleVerse[];
  source: 'local' | 'cache' | 'remote';
  copyright?: string;
}

export interface BibleTranslationInfo {
  id: string; // e.g. "KJV", "NIV"
  name: string;
  abbreviation: string;
  isLocal: boolean; // true = bundled SQLite, zero network calls
  requiresLicense?: boolean; // true in commercial mode until verified
  excludedCommercial?: boolean; // true for NIV in commercial mode
  apiBibleId?: string; // known API.Bible ID or resolved dynamically
  description: string;
  language: string;
  estimatedSizeMb?: number;
  isDownloaded?: boolean;
}

export interface SearchVerseResult {
  translation: string;
  bookName: string;
  bookCode: string;
  chapter: number;
  verse: number;
  text: string;
  testament?: 'OT' | 'NT';
}

export interface ReadingPosition {
  translation: string;
  bookCode: string;
  chapter: number;
  verse: number;
  updatedAt: string;
}

export interface IBibleProvider {
  getAvailableTranslations(): BibleTranslationInfo[];
  getChapter(translation: string, book: string, chapter: number): Promise<BibleChapter>;
  search(translation: string, query: string, limit?: number): Promise<SearchVerseResult[]>;
}
