import { ENV } from './env';
import { BibleTranslationInfo } from '../services/bible/types';

/**
 * License-free, public-domain translations bundled locally in SQLite.
 * Zero network calls required.
 */
export const LOCAL_TRANSLATIONS: BibleTranslationInfo[] = [
  {
    id: 'KJV',
    abbreviation: 'KJV',
    name: 'King James Version',
    isLocal: true,
    description: '1611 King James Version. Bundled offline, public domain.',
    language: 'eng',
  },
  {
    id: 'ASV',
    abbreviation: 'ASV',
    name: 'American Standard Version',
    isLocal: true,
    description: '1901 American Standard Version. Bundled offline, public domain.',
    language: 'eng',
  },
  {
    id: 'WEB',
    abbreviation: 'WEB',
    name: 'World English Bible',
    isLocal: true,
    description: 'Modern English, bundled offline, dedicated to public domain.',
    language: 'eng',
  },
  {
    id: 'YLT',
    abbreviation: 'YLT',
    name: "Young's Literal Translation",
    isLocal: true,
    description: '1862/1898 strictly literal translation. Bundled offline, public domain.',
    language: 'eng',
  },
  {
    id: 'BBE',
    abbreviation: 'BBE',
    name: 'Bible in Basic English',
    isLocal: true,
    description: '1949 translation in simple vocabulary. Bundled offline, public domain.',
    language: 'eng',
  },
];

/**
 * Licensed translations integrated via API.Bible REST API (docs.api.bible).
 */
export const REMOTE_TRANSLATIONS: BibleTranslationInfo[] = [
  {
    id: 'NIV',
    abbreviation: 'NIV',
    name: 'New International Version',
    isLocal: false,
    description: 'Widely read modern translation. Excluded completely in commercial mode.',
    language: 'eng',
  },
  {
    id: 'NKJV',
    abbreviation: 'NKJV',
    name: 'New King James Version',
    isLocal: false,
    description: 'Modern language edition of the King James text.',
    language: 'eng',
  },
  {
    id: 'AMP',
    abbreviation: 'AMP',
    name: 'Amplified Bible',
    isLocal: false,
    description: 'Expanded translation with explanatory words.',
    language: 'eng',
  },
  {
    id: 'AMPC',
    abbreviation: 'AMPC',
    name: 'Amplified Classic',
    isLocal: false,
    description: 'Original classic 1987 Amplified Bible edition.',
    language: 'eng',
  },
  {
    id: 'MSG',
    abbreviation: 'MSG',
    name: 'The Message',
    isLocal: false,
    description: 'Contemporary idiomatic paraphrase by Eugene Peterson.',
    language: 'eng',
  },
  {
    id: 'NLT',
    abbreviation: 'NLT',
    name: 'New Living Translation',
    isLocal: false,
    description: 'Clear, contemporary English dynamic translation.',
    language: 'eng',
  },
  {
    id: 'CSB',
    abbreviation: 'CSB',
    name: 'Christian Standard Bible',
    isLocal: false,
    description: 'Optimal blend of formal and dynamic equivalence.',
    language: 'eng',
  },
  {
    id: 'NASB',
    abbreviation: 'NASB',
    name: 'New American Standard Bible',
    isLocal: false,
    description: 'Renowned formal equivalence literal translation.',
    language: 'eng',
  },
  {
    id: 'GNT',
    abbreviation: 'GNT',
    name: 'Good News Translation',
    isLocal: false,
    description: 'Easy-to-understand functional equivalence translation.',
    language: 'eng',
  },
  {
    id: 'ESV',
    abbreviation: 'ESV',
    name: 'English Standard Version',
    isLocal: false,
    description: 'Essentially literal translation emphasizing word-for-word accuracy.',
    language: 'eng',
  },
];

/**
 * In-memory state of confirmed purchased licenses for commercial mode.
 */
const CONFIRMED_PURCHASED_LICENSES = new Set<string>();

export function markLicensePurchased(translationId: string) {
  CONFIRMED_PURCHASED_LICENSES.add(translationId.toUpperCase());
}

export function isLicensePurchased(translationId: string): boolean {
  return CONFIRMED_PURCHASED_LICENSES.has(translationId.toUpperCase());
}

/**
 * Returns available translations according to the IS_COMMERCIAL config flag.
 *
 * Rules:
 * - When IS_COMMERCIAL === true:
 *   - Exclude NIV entirely (no commercial license available at any price).
 *   - Other licensed translations can still show, flagged as "requires license" until confirmed purchased.
 * - When IS_COMMERCIAL === false:
 *   - All translations use the free non-commercial API key.
 */
export function getActiveTranslations(): BibleTranslationInfo[] {
  const isCommercial = ENV.IS_COMMERCIAL;

  // Local translations are always available (public domain)
  const list: BibleTranslationInfo[] = [...LOCAL_TRANSLATIONS];

  for (const remote of REMOTE_TRANSLATIONS) {
    if (isCommercial) {
      if (remote.id === 'NIV') {
        // Exclude NIV entirely in commercial mode
        continue;
      }

      const hasPurchased = isLicensePurchased(remote.id);
      list.push({
        ...remote,
        requiresLicense: !hasPurchased,
      });
    } else {
      // Non-commercial mode: all translations available with free key
      list.push({
        ...remote,
        requiresLicense: false,
      });
    }
  }

  return list;
}

export function getTranslationInfo(id: string): BibleTranslationInfo | undefined {
  const upper = id.toUpperCase();
  const all = [...LOCAL_TRANSLATIONS, ...REMOTE_TRANSLATIONS];
  const found = all.find(t => t.id.toUpperCase() === upper || t.abbreviation.toUpperCase() === upper);
  if (!found) return undefined;

  if (ENV.IS_COMMERCIAL) {
    if (found.id === 'NIV') {
      return {
        ...found,
        excludedCommercial: true,
      };
    }
    if (!found.isLocal) {
      return {
        ...found,
        requiresLicense: !isLicensePurchased(found.id),
      };
    }
  }

  return {
    ...found,
    requiresLicense: false,
  };
}
