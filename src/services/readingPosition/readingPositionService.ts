import AsyncStorage from '@react-native-async-storage/async-storage';
import { ReadingPosition } from '../bible/types';

const LAST_TRANSLATION_KEY = 'scriptura_last_translation';
const POS_PREFIX = 'scriptura_pos_';

export const DEFAULT_POSITION: ReadingPosition = {
  translation: 'KJV',
  bookCode: 'JHN',
  chapter: 1,
  verse: 1,
  updatedAt: new Date().toISOString(),
};

/**
 * Saves reading position specifically per translation and sets it as last active.
 */
export async function saveReadingPosition(
  translation: string,
  bookCode: string,
  chapter: number,
  verse = 1
): Promise<void> {
  const trUpper = translation.toUpperCase();
  const position: ReadingPosition = {
    translation: trUpper,
    bookCode: bookCode.toUpperCase(),
    chapter,
    verse,
    updatedAt: new Date().toISOString(),
  };

  try {
    await Promise.all([
      AsyncStorage.setItem(`${POS_PREFIX}${trUpper}`, JSON.stringify(position)),
      AsyncStorage.setItem(LAST_TRANSLATION_KEY, trUpper),
    ]);
  } catch (err) {
    console.error('Failed to save reading position:', err);
  }
}

/**
 * Gets the last saved reading position for a specific translation.
 */
export async function getReadingPosition(translation: string): Promise<ReadingPosition | null> {
  const trUpper = translation.toUpperCase();
  try {
    const raw = await AsyncStorage.getItem(`${POS_PREFIX}${trUpper}`);
    if (!raw) return null;
    return JSON.parse(raw) as ReadingPosition;
  } catch (err) {
    console.error('Failed to load reading position:', err);
    return null;
  }
}

/**
 * Gets the global last active reading position upon app reopening.
 */
export async function getLastActiveReadingPosition(): Promise<ReadingPosition> {
  try {
    const lastTr = await AsyncStorage.getItem(LAST_TRANSLATION_KEY);
    if (lastTr) {
      const pos = await getReadingPosition(lastTr);
      if (pos) return pos;
    }
  } catch (err) {
    console.error('Failed to get last active position:', err);
  }
  return DEFAULT_POSITION;
}
