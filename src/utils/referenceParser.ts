import { resolveBook, BibleBookInfo } from '../config/books';

export interface ParsedReference {
  book: BibleBookInfo;
  chapter: number;
  verse?: number;
  displayText: string;
}

/**
 * Parses user input to detect direct scripture reference patterns like:
 * "John 3:16", "Jn 3:16", "Genesis 1:1", "Gen 1", "Rom 8:28", "Psalm 23", "1 Cor 13"
 */
export function parseScriptureReference(input: string): ParsedReference | null {
  if (!input || input.trim().length < 3) return null;
  const raw = input.trim();

  // Pattern matches: [Optional Number] [Book Name] [Chapter]:[Optional Verse]
  // e.g. "1 Corinthians 13:4", "John 3:16", "Genesis 1", "Psalm 23"
  const regex = /^((?:\d\s*)?[a-zA-Z\s]+?)\s*(\d+)(?:[:\s](\d+))?$/;
  const match = raw.match(regex);

  if (!match) return null;

  const bookPart = match[1].trim();
  const chapterPart = parseInt(match[2], 10);
  const versePart = match[3] ? parseInt(match[3], 10) : undefined;

  const book = resolveBook(bookPart);
  if (!book) return null;

  if (chapterPart < 1 || chapterPart > book.chapters) {
    return null;
  }

  const displayText = versePart
    ? `${book.name} ${chapterPart}:${versePart}`
    : `${book.name} ${chapterPart}`;

  return {
    book,
    chapter: chapterPart,
    verse: versePart,
    displayText,
  };
}
