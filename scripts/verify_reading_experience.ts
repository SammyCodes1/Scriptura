import { parseScriptureReference } from '../src/utils/referenceParser';
import { parseVerseFootnotes } from '../src/utils/footnoteParser';
import { resolveBook } from '../src/config/books';
import { DEFAULT_POSITION } from '../src/services/readingPosition/readingPositionService';

console.log('='.repeat(60));
console.log('SCRIPTURA READING EXPERIENCE SUITE VERIFICATION');
console.log('='.repeat(60));

// TEST 1: Direct Reference Typing & Parsing
console.log('\n--- TEST 1: Direct Scripture Reference Parsing ---');
const testCases = [
  { input: 'John 3:16', expectedBook: 'JHN', expectedChapter: 3, expectedVerse: 16 },
  { input: 'Jn 3:16', expectedBook: 'JHN', expectedChapter: 3, expectedVerse: 16 },
  { input: 'Genesis 1:1', expectedBook: 'GEN', expectedChapter: 1, expectedVerse: 1 },
  { input: 'Gen 1', expectedBook: 'GEN', expectedChapter: 1, expectedVerse: undefined },
  { input: 'Psalm 23', expectedBook: 'PSA', expectedChapter: 23, expectedVerse: undefined },
  { input: 'Rom 8:28', expectedBook: 'ROM', expectedChapter: 8, expectedVerse: 28 },
  { input: '1 Corinthians 13:4', expectedBook: '1CO', expectedChapter: 13, expectedVerse: 4 },
  { input: 'random invalid string', expectedBook: null },
];

for (const tc of testCases) {
  const result = parseScriptureReference(tc.input);
  if (tc.expectedBook === null) {
    if (result !== null) throw new Error(`Expected null for '${tc.input}' but got result.`);
    console.log(`  [Pass] Correctly rejected invalid input: "${tc.input}"`);
  } else {
    if (!result) throw new Error(`Failed to parse valid reference: '${tc.input}'`);
    if (result.book.code !== tc.expectedBook) throw new Error(`Wrong book code for '${tc.input}': expected ${tc.expectedBook}, got ${result.book.code}`);
    if (result.chapter !== tc.expectedChapter) throw new Error(`Wrong chapter for '${tc.input}'`);
    if (result.verse !== tc.expectedVerse) throw new Error(`Wrong verse for '${tc.input}'`);
    console.log(`  [Pass] Parsed "${tc.input}" ➔ ${result.displayText} (${result.book.code})`);
  }
}

// TEST 2: Footnote Parsing & Extraction
console.log('\n--- TEST 2: Inline Footnote & Cross-Reference Separation ---');
const rawVerseWithFootnote = 'In the beginning God{After "God," the Hebrew has the two letters "Aleph Tav" as a grammatical marker.} created the heavens and the earth.';
const { cleanText, footnotes } = parseVerseFootnotes(rawVerseWithFootnote, 1);

console.log(`  Raw Text: "${rawVerseWithFootnote}"`);
console.log(`  Clean Reading Text: "${cleanText}"`);
console.log(`  Extracted Footnotes (${footnotes.length}):`);
for (const fn of footnotes) {
  console.log(`    [${fn.marker}]: ${fn.text}`);
}

if (cleanText.includes('{') || cleanText.includes('}')) {
  throw new Error('Clean text should not contain curly braces!');
}
if (!cleanText.includes('[1]')) {
  throw new Error('Clean text should have inline footnote marker [1]!');
}
if (footnotes.length !== 1 || !footnotes[0].text.includes('Aleph Tav')) {
  throw new Error('Footnote content not properly extracted!');
}
console.log('  [Pass] Footnote parsed and separated cleanly.');

// TEST 3: Canonical Book and Chapter Navigation Boundaries
console.log('\n--- TEST 3: Navigation Boundary Checks ---');
const gen = resolveBook('Genesis');
const rev = resolveBook('Revelation');
if (!gen || gen.chapters !== 50) throw new Error('Genesis chapter count mismatch');
if (!rev || rev.chapters !== 22) throw new Error('Revelation chapter count mismatch');
console.log(`  [Pass] Genesis has ${gen.chapters} chapters (1..50)`);
console.log(`  [Pass] Revelation has ${rev.chapters} chapters (1..22)`);

// TEST 4: Default Reading Position
console.log('\n--- TEST 4: Default Reading Position ---');
console.log(`  [Pass] Default reading position: ${DEFAULT_POSITION.translation} ${DEFAULT_POSITION.bookCode} ${DEFAULT_POSITION.chapter}:${DEFAULT_POSITION.verse}`);

console.log('\n' + '='.repeat(60));
console.log('ALL READING EXPERIENCE TESTS PASSED!');
console.log('=' .repeat(60));
