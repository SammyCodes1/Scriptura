import { ENV } from '../../config/env';
import { BibleVerse } from './types';

const BASE_URL = 'https://api.scripture.api.bible/v1';

// Cache for resolved bible IDs (e.g. "ESV" -> "01b29f4b342acc35-01")
const resolvedBibleIds = new Map<string, string>();

/**
 * Resolves the API.Bible bibleId for a given translation abbreviation.
 */
export async function getBibleIdForAbbreviation(abbreviation: string): Promise<string | null> {
  const upper = abbreviation.toUpperCase();
  if (resolvedBibleIds.has(upper)) {
    return resolvedBibleIds.get(upper)!;
  }

  if (!ENV.API_BIBLE_KEY) {
    return null;
  }

  try {
    const res = await fetch(`${BASE_URL}/bibles?language=eng`, {
      headers: {
        'api-key': ENV.API_BIBLE_KEY,
      },
    });

    if (!res.ok) {
      console.warn(`API.Bible error fetching bibles list: ${res.status} ${res.statusText}`);
      return null;
    }

    const json = await res.json();
    const bibles: Array<{ id: string; abbreviation: string; name: string }> = json.data || [];

    for (const b of bibles) {
      if (b.abbreviation && b.abbreviation.toUpperCase() === upper) {
        resolvedBibleIds.set(upper, b.id);
        return b.id;
      }
    }

    // Try name match if abbreviation didn't match directly
    const byName = bibles.find(b => b.name.toUpperCase().includes(upper));
    if (byName) {
      resolvedBibleIds.set(upper, byName.id);
      return byName.id;
    }

    return null;
  } catch (err) {
    console.error('Failed to query API.Bible bibles:', err);
    return null;
  }
}

/**
 * Recursively extracts verses from API.Bible JSON content AST.
 */
function extractVersesFromJsonAst(content: any[]): BibleVerse[] {
  const verses: BibleVerse[] = [];
  let currentVerseNum = 1;
  let currentText = '';

  function traverse(node: any) {
    if (!node) return;

    if (Array.isArray(node)) {
      for (const item of node) {
        traverse(item);
      }
      return;
    }

    if (node.type === 'tag' && node.name === 'verse') {
      // Verse marker encountered
      if (currentText.trim()) {
        verses.push({
          verse: currentVerseNum,
          text: currentText.trim(),
        });
        currentText = '';
      }
      const numAttr = node.attrs?.number;
      if (numAttr) {
        const parsed = parseInt(numAttr, 10);
        if (!isNaN(parsed)) {
          currentVerseNum = parsed;
        }
      }
    } else if (node.type === 'text') {
      if (node.text) {
        currentText += node.text;
      }
    }

    if (node.items) {
      traverse(node.items);
    }
  }

  traverse(content);

  // Push final verse
  if (currentText.trim()) {
    verses.push({
      verse: currentVerseNum,
      text: currentText.trim(),
    });
  }

  return verses;
}

/**
 * Fetches a chapter from API.Bible REST API.
 */
export async function fetchChapterFromApiBible(
  translation: string,
  bookCode: string,
  chapter: number
): Promise<{ verses: BibleVerse[]; copyright?: string }> {
  const upperTr = translation.toUpperCase();
  const upperBook = bookCode.toUpperCase();
  const chapterId = `${upperBook}.${chapter}`;

  if (!ENV.API_BIBLE_KEY) {
    // If no key is set yet, provide mock data for architecture & cache testing
    return {
      verses: [
        {
          verse: 1,
          text: `[API.Bible Demo - ${upperTr}] In the beginning was the Word, and the Word was with God, and the Word was God. (${upperBook} ${chapter}:1)`,
        },
        {
          verse: 2,
          text: `[API.Bible Demo - ${upperTr}] He was in the beginning with God. All things were made through him. (${upperBook} ${chapter}:2)`,
        },
        {
          verse: 3,
          text: `[API.Bible Demo - ${upperTr}] In him was life, and the life was the light of men. (Configure EXPO_PUBLIC_API_BIBLE_KEY in .env for live API.Bible texts).`,
        },
      ],
      copyright: `© API.Bible Demo (${upperTr})`,
    };
  }

  const bibleId = await getBibleIdForAbbreviation(upperTr);
  if (!bibleId) {
    throw new Error(
      `Could not find an authorized API.Bible ID for translation '${upperTr}'. Please check your API.Bible dashboard access.`
    );
  }

  const url = `${BASE_URL}/bibles/${bibleId}/chapters/${chapterId}?content-type=json&include-notes=false&include-titles=false&include-chapter-numbers=false&include-verse-numbers=true`;

  const response = await fetch(url, {
    headers: {
      'api-key': ENV.API_BIBLE_KEY,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API.Bible error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const chapterData = data.data;
  const content = chapterData.content || [];
  const verses = extractVersesFromJsonAst(content);

  return {
    verses,
    copyright: chapterData.copyright,
  };
}
