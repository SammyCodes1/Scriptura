import { Footnote, BibleVerse } from '../services/bible/types';

/**
 * Parses raw verse text to separate embedded notes / cross-references
 * into structured footnotes while producing clean, distraction-free reading text.
 */
export function parseVerseFootnotes(rawText: string, verseNum: number): {
  cleanText: string;
  footnotes: Footnote[];
} {
  const footnotes: Footnote[] = [];
  let noteIndex = 1;

  // 1. Matches {note text} common in World English Bible (WEB) & public domain texts
  let processed = rawText.replace(/\{([^}]+)\}/g, (_match, noteContent) => {
    const marker = `${noteIndex}`;
    footnotes.push({
      id: `fn_${verseNum}_${noteIndex}`,
      marker,
      text: noteContent.trim(),
    });
    noteIndex++;
    return `[${marker}]`;
  });

  // 2. Clean extra quotes or spaces
  const clean = processed.replace(/\s{2,}/g, ' ').trim();

  return {
    cleanText: clean,
    footnotes,
  };
}

/**
 * Enriches a BibleVerse object with clean text and footnotes.
 */
export function enrichVerseWithFootnotes(verse: BibleVerse): BibleVerse {
  const { cleanText, footnotes } = parseVerseFootnotes(verse.text, verse.verse);
  return {
    ...verse,
    cleanText,
    footnotes,
  };
}
