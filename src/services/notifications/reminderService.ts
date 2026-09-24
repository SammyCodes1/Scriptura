import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const REMINDER_ENABLED_KEY = 'scriptura_confession_reminder_enabled';
const REMINDER_TIME_KEY = 'scriptura_confession_reminder_time'; // format "HH:MM" e.g. "08:00"
const NOTIFICATION_IDENTIFIER = 'scriptura_daily_confession_reminder';

// Configure notification behavior when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPresentAlert: true,
  }),
});

export interface ReminderConfig {
  enabled: boolean;
  timeString: string; // "08:00"
  hour: number;
  minute: number;
}

/**
 * Parses "08:30" into hour & minute.
 */
function parseTimeString(timeStr: string): { hour: number; minute: number } {
  const parts = timeStr.split(':');
  const hour = parseInt(parts[0], 10) || 8;
  const minute = parseInt(parts[1], 10) || 0;
  return { hour, minute };
}

/**
 * Gets the current confession reminder settings.
 */
export async function getConfessionReminderConfig(): Promise<ReminderConfig> {
  try {
    const enabledRaw = await AsyncStorage.getItem(REMINDER_ENABLED_KEY);
    const timeRaw = await AsyncStorage.getItem(REMINDER_TIME_KEY);
    const enabled = enabledRaw === 'true';
    const timeString = timeRaw || '08:00';
    const { hour, minute } = parseTimeString(timeString);
    return { enabled, timeString, hour, minute };
  } catch (err) {
    return { enabled: false, timeString: '08:00', hour: 8, minute: 0 };
  }
}

/**
 * Schedules or cancels the daily local notification based on user preference.
 */
export async function setConfessionReminder(
  enabled: boolean,
  timeString = '08:00'
): Promise<{ success: boolean; error?: string }> {
  try {
    await AsyncStorage.setItem(REMINDER_ENABLED_KEY, enabled ? 'true' : 'false');
    await AsyncStorage.setItem(REMINDER_TIME_KEY, timeString);

    if (Platform.OS === 'web') {
      // Local push notifications not applicable in basic web preview
      return { success: true };
    }

    // Cancel existing reminder if scheduled
    try {
      await Notifications.cancelScheduledNotificationAsync(NOTIFICATION_IDENTIFIER);
    } catch {
      // Ignore if not present
    }

    if (!enabled) {
      return { success: true };
    }

    // Request permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return {
        success: false,
        error: 'Notification permissions were not granted. Please enable them in device Settings.',
      };
    }

    const { hour, minute } = parseTimeString(timeString);

    // Schedule daily repeating notification at specified hour and minute
    await Notifications.scheduleNotificationAsync({
      identifier: NOTIFICATION_IDENTIFIER,
      content: {
        title: '🕊️ Daily Confessions & Declarations',
        body: 'Speak life and victory over your day. Declare your daily scriptures now.',
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });

    return { success: true };
  } catch (err: any) {
    console.error('Failed to set confession reminder:', err);
    return { success: false, error: err?.message || 'Failed to schedule notification.' };
  }
}
