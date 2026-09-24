import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Haptic feedback helpers. Only fire on iOS/Android (no-op on web).
 * Use for key user actions: bookmark, highlight, mark-as-done.
 */

const isNative = Platform.OS === 'ios' || Platform.OS === 'android';

/** Light tap — bookmark, select, toggle. */
export const hapticLight = () => {
  if (isNative) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }
};

/** Medium tap — highlight, confirm action. */
export const hapticMedium = () => {
  if (isNative) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  }
};

/** Heavy tap — destructive actions, delete account. */
export const hapticHeavy = () => {
  if (isNative) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
  }
};

/** Success feedback — mark-as-done, completion. */
export const hapticSuccess = () => {
  if (isNative) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  }
};

/** Selection tick — slider, picker changes. */
export const hapticSelection = () => {
  if (isNative) {
    Haptics.selectionAsync().catch(() => {});
  }
};
