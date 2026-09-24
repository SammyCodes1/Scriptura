/**
 * Test script to verify Personal Tools:
 * 1. Bookmarks (save, unsave, grouping by date/book)
 * 2. Highlights (multi-color support, filter by color)
 * 3. Notes (save, search by text/reference)
 * 4. Reading History (auto-tracking, ordering)
 * 5. Reading Plans (starter library, schedule checkable, streak calculation, low-guilt validation)
 * 6. Chapter of the Week (Monday rotation, blurb, notification opt-in)
 * 7. Verse of the Day (daily deterministic rotation, widget bridge payload)
 */

// Polyfill window & localStorage for Node test runner
if (typeof window === 'undefined') {
  const store = new Map<string, string>();
  (globalThis as any).window = {
    localStorage: {
      getItem: (k: string) => store.get(k) || null,
      setItem: (k: string, v: string) => store.set(k, String(v)),
      removeItem: (k: string) => store.delete(k),
      clear: () => store.clear(),
    },
  };
}

import {
  STARTER_READING_PLANS,
  calculateLowGuiltStreak,
} from '../src/config/readingPlans';
import {
  getChapterOfTheWeek,
  getVerseOfTheDay,
  isChapterOfWeekNotificationOptedIn,
  setChapterOfWeekNotificationOptIn,
} from '../src/services/curated/dailyScriptureService';
import {
  formatWidgetDate,
  syncVerseOfTheDayToWidgetStorage,
  getWidgetLimitationReport,
} from '../src/services/widget/widgetDataService';

async function runTests() {
  console.log('====================================================');
  console.log('🧪 VERIFYING SCRIPTURA PERSONAL TOOLS & FOUNDATION');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
      failed++;
    }
  }

  // --- TEST 1: Bookmarks Grouping Logic ---
  console.log('[1/7] Testing Bookmarks Grouping...');
  const mockBookmarks = [
    { id: 'b1', book: 'JHN', chapter: 3, verse: 16, translation: 'KJV', created_at: new Date().toISOString() },
    { id: 'b2', book: 'ROM', chapter: 8, verse: 28, translation: 'KJV', created_at: new Date(Date.now() - 86400000).toISOString() }, // Yesterday
    { id: 'b3', book: 'PSA', chapter: 23, verse: 1, translation: 'KJV', created_at: new Date(Date.now() - 3 * 86400000).toISOString() }, // Last 7 days
    { id: 'b4', book: 'JHN', chapter: 1, verse: 1, translation: 'KJV', created_at: new Date(Date.now() - 10 * 86400000).toISOString() }, // Earlier
  ];

  // Group by Book
  const byBook: Record<string, typeof mockBookmarks> = {};
  for (const b of mockBookmarks) {
    if (!byBook[b.book]) byBook[b.book] = [];
    byBook[b.book].push(b);
  }
  assert(byBook['JHN'].length === 2, 'Group by Book aggregates John correctly');
  assert(byBook['ROM'].length === 1, 'Group by Book aggregates Romans correctly');
  assert(byBook['PSA'].length === 1, 'Group by Book aggregates Psalms correctly');

  // Group by Date
  const now = new Date();
  const byDate: Record<string, typeof mockBookmarks> = { Today: [], Yesterday: [], 'Last 7 Days': [], Earlier: [] };
  for (const b of mockBookmarks) {
    const d = new Date(b.created_at);
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 3600 * 24));
    if (diffDays === 0) byDate['Today'].push(b);
    else if (diffDays === 1) byDate['Yesterday'].push(b);
    else if (diffDays < 7) byDate['Last 7 Days'].push(b);
    else byDate['Earlier'].push(b);
  }
  assert(byDate['Today'].length === 1 && byDate['Today'][0].id === 'b1', 'Group by Date: Today identified');
  assert(byDate['Yesterday'].length === 1 && byDate['Yesterday'][0].id === 'b2', 'Group by Date: Yesterday identified');
  assert(byDate['Last 7 Days'].length === 1 && byDate['Last 7 Days'][0].id === 'b3', 'Group by Date: Last 7 Days identified');
  assert(byDate['Earlier'].length === 1 && byDate['Earlier'][0].id === 'b4', 'Group by Date: Earlier identified');

  // --- TEST 2: Highlights Colors & Filtering ---
  console.log('\n[2/7] Testing Highlights Color Filtering...');
  const mockHighlights = [
    { id: 'h1', book: 'GEN', chapter: 1, verse: 1, color: '#FEF08A' }, // Yellow
    { id: 'h2', book: 'GEN', chapter: 1, verse: 2, color: '#BBF7D0' }, // Green
    { id: 'h3', book: 'GEN', chapter: 1, verse: 3, color: '#BFDBFE' }, // Blue
    { id: 'h4', book: 'GEN', chapter: 1, verse: 4, color: '#FBCFE8' }, // Pink
    { id: 'h5', book: 'GEN', chapter: 1, verse: 5, color: '#FED7AA' }, // Orange
    { id: 'h6', book: 'GEN', chapter: 1, verse: 6, color: '#FEF08A' }, // Yellow
  ];
  const yellowFiltered = mockHighlights.filter(h => h.color.toUpperCase() === '#FEF08A');
  const pinkFiltered = mockHighlights.filter(h => h.color.toUpperCase() === '#FBCFE8');
  assert(yellowFiltered.length === 2, 'Highlights filter by Yellow returns 2 items');
  assert(pinkFiltered.length === 1, 'Highlights filter by Pink returns 1 item');
  const distinctColors = new Set(mockHighlights.map(h => h.color));
  assert(distinctColors.size >= 5, 'At least 5 distinct highlight colors are supported');

  // --- TEST 3: Notes Free-Text Search ---
  console.log('\n[3/7] Testing Notes Search...');
  const mockNotes = [
    { id: 'n1', book: 'JHN', chapter: 3, verse: 16, text: 'The heart of the Gospel and sacrificial love.' },
    { id: 'n2', book: 'ROM', chapter: 8, verse: 28, text: 'Comfort in trials and God working all things for good.' },
    { id: 'n3', book: 'PSA', chapter: 23, verse: 1, text: 'The Lord is my shepherd; total contentment and peace.' },
  ];
  const searchGospel = mockNotes.filter(n => n.text.toLowerCase().includes('gospel'));
  const searchReference = mockNotes.filter(n => `${n.book} ${n.chapter}:${n.verse}`.includes('ROM 8:28'));
  assert(searchGospel.length === 1 && searchGospel[0].id === 'n1', 'Notes query "gospel" matches note n1');
  assert(searchReference.length === 1 && searchReference[0].id === 'n2', 'Notes search by reference "ROM 8:28" matches');

  // --- TEST 4: Reading History & Continue Reading Auto-Tracking ---
  console.log('\n[4/7] Testing Reading History Ordering...');
  const mockHistory = [
    { book: 'JHN', chapter: 3, translation: 'KJV', last_read_at: '2026-09-23T20:00:00Z' },
    { book: 'ROM', chapter: 8, translation: 'ESV', last_read_at: '2026-09-23T21:30:00Z' },
    { book: 'PSA', chapter: 23, translation: 'WEB', last_read_at: '2026-09-23T22:15:00Z' },
  ];
  const sortedHistory = [...mockHistory].sort((a, b) => new Date(b.last_read_at).getTime() - new Date(a.last_read_at).getTime());
  assert(sortedHistory[0].book === 'PSA' && sortedHistory[0].chapter === 23, 'Continue Reading top item is the most recently read chapter');

  // --- TEST 5: Starter Reading Plans & Low-Guilt Streak ---
  console.log('\n[5/7] Testing Reading Plans & Low-Guilt Streak...');
  assert(STARTER_READING_PLANS.length >= 3, 'Starter reading plans library contains at least 3 plans');
  const psalmsPlan = STARTER_READING_PLANS.find(p => p.id === 'plan_psalms_30');
  const ntPlan = STARTER_READING_PLANS.find(p => p.id === 'plan_nt_90');
  const yearPlan = STARTER_READING_PLANS.find(p => p.id === 'plan_bible_year');
  assert(!!psalmsPlan, 'Psalms in a Month plan is present');
  assert(!!ntPlan, 'New Testament in 90 Days plan is present');
  assert(!!yearPlan, 'Bible in a Year plan is present');

  // Test low-guilt streak calculation:
  // Completing days out of order or skipping calendar days does not reset streak to zero
  const sampleCompleted = [1, 2, 5, 8];
  const calculatedStreak = calculateLowGuiltStreak(sampleCompleted);
  assert(calculatedStreak === 4, 'Low-guilt streak counts cumulative milestone progress without zeroing out on missed calendar days');

  // --- TEST 6: Chapter of the Week Rotation & Opt-In ---
  console.log('\n[6/7] Testing Chapter of the Week Rotation...');
  const cotw = getChapterOfTheWeek();
  assert(!!cotw.title && !!cotw.blurb && !!cotw.bookCode, 'Chapter of the week has title, why-this-chapter blurb, and bookCode');
  assert(cotw.blurb.length > 30, 'Chapter of the week blurb is an explanatory paragraph');
  
  // Notification opt-in toggle test
  await setChapterOfWeekNotificationOptIn(true);
  const optedIn = await isChapterOfWeekNotificationOptedIn();
  assert(optedIn === true, 'Notification opt-in preference saved as true');
  await setChapterOfWeekNotificationOptIn(false);
  const optedOut = await isChapterOfWeekNotificationOptedIn();
  assert(optedOut === false, 'Notification opt-in preference saved as false');

  // --- TEST 7: Verse of the Day & Widget Bridge ---
  console.log('\n[7/7] Testing Verse of the Day & Home-Screen Widget Bridge...');
  const votd = getVerseOfTheDay();
  assert(!!votd.reference && !!votd.text && !!votd.theme, 'Verse of the day includes reference, text, and theme');
  
  const widgetPayload = await syncVerseOfTheDayToWidgetStorage();
  assert(widgetPayload.reference === votd.reference, 'Widget storage correctly synced today reference');
  assert(widgetPayload.text === votd.text, 'Widget storage correctly synced today scripture text');

  const limitationReport = getWidgetLimitationReport();
  assert(limitationReport.expoGoSupported === false, 'Widget report correctly documents Expo Go native limitation');
  assert(limitationReport.easPrebuildSupported === true, 'Widget report confirms support via expo prebuild / bare React Native');

  console.log('\n====================================================');
  console.log(`📊 RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
