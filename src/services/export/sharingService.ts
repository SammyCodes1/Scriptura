import { Linking, Platform, Share, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { hapticLight, hapticSuccess } from '../../utils/haptics';
import { formatScriptureForShare, VerseDataForCard } from './verseCardService';

export interface ShareResult {
  success: boolean;
  channel: string;
  error?: string;
}

/**
 * Direct platform sharing helper for Scriptures.
 */
export async function shareScriptureToPlatform(
  verse: VerseDataForCard,
  platform: 'whatsapp' | 'twitter' | 'sms' | 'system' | 'copy'
): Promise<ShareResult> {
  const formatted = formatScriptureForShare(verse);
  const encodedText = encodeURIComponent(formatted);

  try {
    switch (platform) {
      case 'whatsapp': {
        hapticLight();
        const whatsappUrl = `whatsapp://send?text=${encodedText}`;
        const canOpen = await Linking.canOpenURL(whatsappUrl);
        if (canOpen) {
          await Linking.openURL(whatsappUrl);
          return { success: true, channel: 'whatsapp' };
        } else {
          // Web or fallback link
          const webUrl = `https://api.whatsapp.com/send?text=${encodedText}`;
          await Linking.openURL(webUrl);
          return { success: true, channel: 'whatsapp-web' };
        }
      }

      case 'twitter': {
        hapticLight();
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodedText}`;
        await Linking.openURL(twitterUrl);
        return { success: true, channel: 'twitter' };
      }

      case 'sms': {
        hapticLight();
        const separator = Platform.OS === 'ios' ? '&' : '?';
        const smsUrl = `sms:${separator}body=${encodedText}`;
        await Linking.openURL(smsUrl);
        return { success: true, channel: 'sms' };
      }

      case 'copy': {
        hapticSuccess();
        await Clipboard.setStringAsync(formatted);
        Alert.alert('Copied to Clipboard', `"${verse.reference}" copied and ready to share.`);
        return { success: true, channel: 'copy' };
      }

      case 'system':
      default: {
        hapticLight();
        await Share.share({
          message: formatted,
          title: verse.reference,
        });
        return { success: true, channel: 'system' };
      }
    }
  } catch (err: any) {
    console.error(`Failed to share via ${platform}:`, err);
    // Fallback to system share if specific deep link fails
    try {
      await Share.share({ message: formatted, title: verse.reference });
      return { success: true, channel: 'system-fallback' };
    } catch {
      return { success: false, channel: platform, error: err?.message };
    }
  }
}
