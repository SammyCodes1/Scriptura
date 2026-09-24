import AsyncStorage from '@react-native-async-storage/async-storage';
import { getVerseOfTheDay, VerseOfTheDayData } from '../curated/dailyScriptureService';

const WIDGET_STORAGE_KEY = 'scriptura_widget_verse_of_day';

/**
 * ARCHITECTURAL LIMITATION NOTICE:
 *
 * In standard Expo (managed workflow with Expo Go), native iOS home-screen
 * widgets (WidgetKit) and Android home-screen widgets (AppWidgetProvider)
 * CANNOT be run inside Expo Go because widgets are separate native targets:
 *
 * 1. iOS: Requires a separate Xcode Target ("ScripturaWidgetExtension")
 *    written in Swift using SwiftUI and WidgetKit, sharing data with the
 *    main app via an App Group (e.g. `group.com.scriptura.app`) and UserDefaults.
 * 2. Android: Requires an XML widget layout (`res/layout/widget_layout.xml`)
 *    and a BroadcastReceiver class extending `AppWidgetProvider` in Kotlin.
 *
 * HOW THIS IS SOLVED IN OUR STACK:
 * 1. We provide this `widgetDataService` which writes today's verse to storage
 *    so it is always ready to bridge to native shared storage.
 * 2. When moving from Expo Go to production standalone builds using
 *    `npx expo prebuild` (Expo Prebuild / EAS Build), a config plugin
 *    (e.g., `@bittingz/expo-widgets`) or custom native target reads from this
 *    exact payload without requiring any changes to the core app logic!
 */

export interface WidgetPayload {
  reference: string;
  bookCode: string;
  chapter: number;
  verse: number;
  text: string;
  theme: string;
  lastUpdated: string;
}

/**
 * Syncs the Verse of the Day to local widget storage.
 */
export async function syncVerseOfTheDayToWidgetStorage(): Promise<WidgetPayload> {
  const votd: VerseOfTheDayData = getVerseOfTheDay();
  const payload: WidgetPayload = {
    reference: votd.reference,
    bookCode: votd.bookCode,
    chapter: votd.chapter,
    verse: votd.verse,
    text: votd.text,
    theme: votd.theme,
    lastUpdated: new Date().toISOString(),
  };

  try {
    await AsyncStorage.setItem(WIDGET_STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.error('Failed to sync verse of the day to widget storage:', err);
  }

  return payload;
}

export async function getWidgetVersePayload(): Promise<WidgetPayload | null> {
  try {
    const raw = await AsyncStorage.getItem(WIDGET_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as WidgetPayload;
  } catch {
    return null;
  }
}

/**
 * Format date for widget display (e.g., "Wednesday, Sep 23")
 */
export function formatWidgetDate(date: Date = new Date()): string {
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Returns structural explanation of native widget limitations in Expo Go vs. EAS Prebuild.
 */
export function getWidgetLimitationReport(): {
  expoGoSupported: boolean;
  easPrebuildSupported: boolean;
  iosRequirements: string;
  androidRequirements: string;
} {
  return {
    expoGoSupported: false,
    easPrebuildSupported: true,
    iosRequirements:
      'Separate Xcode Target with WidgetKit, SwiftUI, App Group (UserDefaults sharing).',
    androidRequirements:
      'AppWidgetProvider BroadcastReceiver in Kotlin with XML RemoteViews layout.',
  };
}
