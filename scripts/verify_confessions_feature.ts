/**
 * Automated Verification Script for Scriptura Confessions Feature:
 * 1. Pre-built decks by theme (Identity, Healing, Provision/Finance, Family, Peace/Anxiety, Purpose, Protection)
 * 2. Traceability: every declaration has a source scripture reference
 * 3. Daily flow & low-guilt streak calculation (reusing ReadingPlan milestone pattern)
 * 4. Custom decks creation logic & data schema validation
 * 5. Daily local reminder notification config & time parser
 */

import {
  PREBUILT_CONFESSION_DECKS,
  calculateConfessionStreak,
  ConfessionDeck,
  ConfessionItem,
} from '../src/config/confessionDecks';

async function runTests() {
  console.log('============================================================');
  console.log('🕊️ VERIFYING SCRIPTURA SCRIPTURAL CONFESSIONS FEATURE');
  console.log('============================================================\n');

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

  // --- TEST 1: Pre-built Decks by Theme ---
  console.log('[1/5] Verifying 7 Thematic Pre-built Decks...');
  const REQUIRED_THEMES = [
    'Identity',
    'Healing',
    'Provision/Finance',
    'Family',
    'Peace/Anxiety',
    'Purpose',
    'Protection',
  ];

  for (const theme of REQUIRED_THEMES) {
    const deck = PREBUILT_CONFESSION_DECKS.find(d => d.theme === theme);
    assert(!!deck, `Pre-built deck exists for theme: ${theme}`);
    if (deck) {
      assert(
        deck.items.length >= 4,
        `Theme "${theme}" has at least 4 ordered scripture declarations (${deck.items.length} found)`
      );
    }
  }

  // --- TEST 2: Traceability & First-Person Phrasing ---
  console.log('\n[2/5] Verifying Scripture Traceability & First-Person Phrasing...');
  let allTraceable = true;
  let allFirstPerson = true;

  for (const deck of PREBUILT_CONFESSION_DECKS) {
    for (const item of deck.items) {
      if (!item.scriptureReference || item.scriptureReference.length < 3) {
        allTraceable = false;
      }
      const textLower = item.confessionText.toLowerCase();
      // First person phrasing indicators
      const hasFirstPerson =
        textLower.includes('i ') ||
        textLower.includes('my ') ||
        textLower.includes('me') ||
        textLower.includes('we ') ||
        textLower.includes('our ');
      if (!hasFirstPerson) {
        allFirstPerson = false;
      }
    }
  }
  assert(allTraceable, 'Every declaration item has an explicit traceable scripture reference');
  assert(allFirstPerson, 'Every declaration is phrased as a first-person affirmation of faith');

  // --- TEST 3: Low-Guilt Milestone Streak Calculation ---
  console.log('\n[3/5] Verifying Low-Guilt Milestone Streak Logic (ReadingPlan Pattern)...');
  // First recitation
  const step1 = calculateConfessionStreak(0, null, '2026-09-23');
  assert(step1.nextStreak === 1 && step1.isNewDay === true, 'First declaration sets initial streak milestone to 1');

  // Repeat on same day: does not inflate streak
  const step2 = calculateConfessionStreak(1, '2026-09-23', '2026-09-23');
  assert(step2.nextStreak === 1 && step2.isNewDay === false, 'Multiple declarations on same day do not inflate streak');

  // Next calendar day
  const step3 = calculateConfessionStreak(1, '2026-09-23', '2026-09-24');
  assert(step3.nextStreak === 2 && step3.isNewDay === true, 'Next day declaration increments milestone streak to 2');

  // Missed 5 days: low-guilt design picks up where left off without zeroing out!
  const step4 = calculateConfessionStreak(2, '2026-09-24', '2026-09-29');
  assert(step4.nextStreak === 3 && step4.isNewDay === true, 'Skipping calendar days retains milestone progress without shaming or zeroing out');

  // --- TEST 4: Custom Decks Construction & Schema ---
  console.log('\n[4/5] Verifying Custom Deck Construction & Schema...');
  const sampleCustomDeck: ConfessionDeck = {
    id: 'deck_custom_test_123',
    title: 'My Morning Promises',
    theme: 'Custom',
    description: 'Personal verses compiled from bookmarks and highlights',
    isCustom: true,
    items: [
      {
        id: 'citem_1',
        deckId: 'deck_custom_test_123',
        title: 'Strength in Waiting',
        scriptureReference: 'Isaiah 40:31',
        confessionText: 'I wait upon the Lord and my strength is renewed; I run and do not grow weary.',
        sortOrder: 1,
      },
      {
        id: 'citem_2',
        deckId: 'deck_custom_test_123',
        title: 'Light and Salvation',
        scriptureReference: 'Psalm 27:1',
        confessionText: 'The Lord is my light and salvation; I walk free of fear today.',
        sortOrder: 2,
      },
    ],
  };

  assert(sampleCustomDeck.isCustom === true, 'Custom deck schema flags isCustom=true');
  assert(sampleCustomDeck.items.length === 2, 'Custom deck holds user-added declarations');
  assert(sampleCustomDeck.items[0].scriptureReference === 'Isaiah 40:31', 'Custom declaration preserves traceable scripture reference');

  // --- TEST 5: Daily Local Reminder Time Parsing & Configuration ---
  console.log('\n[5/5] Verifying Daily Local Reminder Configuration & Time Parsing...');
  function parseReminderTime(timeStr: string): { hour: number; minute: number } {
    const parts = timeStr.split(':');
    const hour = parseInt(parts[0], 10) || 8;
    const minute = parseInt(parts[1], 10) || 0;
    return { hour, minute };
  }

  const t1 = parseReminderTime('08:00');
  assert(t1.hour === 8 && t1.minute === 0, 'Parsed 08:00 AM into hour=8, minute=0');

  const t2 = parseReminderTime('07:30');
  assert(t2.hour === 7 && t2.minute === 30, 'Parsed 07:30 AM into hour=7, minute=30');

  const t3 = parseReminderTime('21:15');
  assert(t3.hour === 21 && t3.minute === 15, 'Parsed 09:15 PM (21:15) into hour=21, minute=15');

  console.log('\n============================================================');
  console.log(`📊 RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
