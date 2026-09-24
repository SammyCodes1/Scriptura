import React, { useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { VerseDataForCard } from '../services/export/verseCardService';
import { shareScriptureToPlatform } from '../services/export/sharingService';
import { hapticSelection } from '../utils/haptics';

interface ShareScriptureModalProps {
  visible: boolean;
  verse: VerseDataForCard | null;
  onClose: () => void;
  onOpenCardDesigner?: (verse: VerseDataForCard) => void;
}

export const ShareScriptureModal: React.FC<ShareScriptureModalProps> = ({
  visible,
  verse,
  onClose,
  onOpenCardDesigner,
}) => {
  const { colors, spacing, radii, fontSizes, fontWeights, fonts } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        overlay: {
          flex: 1,
          backgroundColor: colors.overlay,
          justifyContent: 'flex-end',
        },
        sheet: {
          backgroundColor: colors.surface,
          borderTopLeftRadius: radii.xl,
          borderTopRightRadius: radii.xl,
          padding: spacing.xl,
          maxHeight: '88%',
        },
        headerRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: spacing.md,
        },
        headerTitle: {
          fontSize: fontSizes.lg,
          fontWeight: fontWeights.bold,
          color: colors.textPrimary,
        },
        closeBtn: {
          padding: spacing.xs,
          borderRadius: radii.pill,
          backgroundColor: colors.surfaceElevated,
        },
        previewCard: {
          backgroundColor: colors.surfaceElevated,
          borderRadius: radii.lg,
          padding: spacing.md,
          borderWidth: 1,
          borderColor: colors.borderLight,
          marginBottom: spacing.lg,
          borderLeftWidth: 3,
          borderLeftColor: colors.primary,
        },
        previewText: {
          fontSize: fontSizes.sm,
          lineHeight: 20,
          color: colors.scriptureText,
          fontFamily: fonts.serif,
          fontStyle: 'italic',
          marginBottom: spacing.xs,
        },
        previewRefRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        },
        previewRef: {
          fontSize: fontSizes.xs,
          fontWeight: fontWeights.bold,
          color: colors.textPrimary,
        },
        transPill: {
          backgroundColor: colors.primary,
          paddingHorizontal: spacing.sm,
          paddingVertical: 2,
          borderRadius: radii.sm,
        },
        transPillText: {
          fontSize: fontSizes.xs - 2,
          fontWeight: fontWeights.bold,
          color: colors.primaryText,
        },
        sectionHeading: {
          fontSize: fontSizes.xs,
          fontWeight: fontWeights.bold,
          color: colors.textSecondary,
          textTransform: 'uppercase',
          letterSpacing: 0.6,
          marginBottom: spacing.sm,
        },
        cardDesignerBanner: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: colors.primary,
          padding: spacing.md,
          borderRadius: radii.lg,
          marginBottom: spacing.lg,
        },
        bannerLeft: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          flex: 1,
        },
        bannerIconCircle: {
          width: 36,
          height: 36,
          borderRadius: radii.pill,
          backgroundColor: colors.surface,
          justifyContent: 'center',
          alignItems: 'center',
        },
        bannerTitle: {
          color: colors.primaryText,
          fontWeight: fontWeights.bold,
          fontSize: fontSizes.sm,
        },
        bannerSubtitle: {
          color: colors.primaryText,
          opacity: 0.85,
          fontSize: fontSizes.xs,
        },
        platformsGrid: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: spacing.sm,
          marginBottom: spacing.lg,
        },
        platformBtn: {
          width: '48%',
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          backgroundColor: colors.surfaceElevated,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.md,
          borderRadius: radii.md,
          borderWidth: 1,
          borderColor: colors.borderLight,
        },
        platformIconBubble: {
          width: 32,
          height: 32,
          borderRadius: radii.pill,
          justifyContent: 'center',
          alignItems: 'center',
        },
        platformInfo: {
          flex: 1,
        },
        platformTitle: {
          fontSize: fontSizes.sm,
          fontWeight: fontWeights.bold,
          color: colors.textPrimary,
        },
        platformDesc: {
          fontSize: 10,
          color: colors.textSecondary,
        },
      }),
    [colors, spacing, radii, fontSizes, fontWeights, fonts]
  );

  if (!verse) return null;

  const handleShare = async (platform: 'whatsapp' | 'twitter' | 'sms' | 'system' | 'copy') => {
    await shareScriptureToPlatform(verse, platform);
    if (platform === 'copy') {
      onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>Share Scripture</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Verse Snippet Preview */}
            <View style={styles.previewCard}>
              <Text style={styles.previewText} numberOfLines={3}>
                "{verse.text.trim()}"
              </Text>
              <View style={styles.previewRefRow}>
                <Text style={styles.previewRef}>— {verse.reference}</Text>
                <View style={styles.transPill}>
                  <Text style={styles.transPillText}>{verse.translation}</Text>
                </View>
              </View>
            </View>

            {/* Featured: Create & Download Verse Card (3 Designs) */}
            {onOpenCardDesigner && (
              <TouchableOpacity
                style={styles.cardDesignerBanner}
                activeOpacity={0.85}
                onPress={() => {
                  hapticSelection();
                  onClose();
                  onOpenCardDesigner(verse);
                }}
              >
                <View style={styles.bannerLeft}>
                  <View style={styles.bannerIconCircle}>
                    <Ionicons name="images-outline" size={20} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.bannerTitle}>Download Verse Card</Text>
                    <Text style={styles.bannerSubtitle}>
                      Choose from 3 specific handcrafted designs
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.primaryText} />
              </TouchableOpacity>
            )}

            {/* Share to Various Platforms */}
            <Text style={styles.sectionHeading}>Share to Platforms</Text>
            <View style={styles.platformsGrid}>
              {/* WhatsApp */}
              <TouchableOpacity
                style={styles.platformBtn}
                activeOpacity={0.7}
                onPress={() => handleShare('whatsapp')}
              >
                <View style={[styles.platformIconBubble, { backgroundColor: '#25D366' }]}>
                  <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" />
                </View>
                <View style={styles.platformInfo}>
                  <Text style={styles.platformTitle}>WhatsApp</Text>
                  <Text style={styles.platformDesc}>Chat & Status</Text>
                </View>
              </TouchableOpacity>

              {/* X / Twitter */}
              <TouchableOpacity
                style={styles.platformBtn}
                activeOpacity={0.7}
                onPress={() => handleShare('twitter')}
              >
                <View style={[styles.platformIconBubble, { backgroundColor: '#1DA1F2' }]}>
                  <Ionicons name="logo-twitter" size={18} color="#FFFFFF" />
                </View>
                <View style={styles.platformInfo}>
                  <Text style={styles.platformTitle}>X / Twitter</Text>
                  <Text style={styles.platformDesc}>Post to feed</Text>
                </View>
              </TouchableOpacity>

              {/* SMS / Messages */}
              <TouchableOpacity
                style={styles.platformBtn}
                activeOpacity={0.7}
                onPress={() => handleShare('sms')}
              >
                <View style={[styles.platformIconBubble, { backgroundColor: colors.accent }]}>
                  <Ionicons name="chatbubble-ellipses" size={18} color="#FFFFFF" />
                </View>
                <View style={styles.platformInfo}>
                  <Text style={styles.platformTitle}>Messages</Text>
                  <Text style={styles.platformDesc}>SMS / iMessage</Text>
                </View>
              </TouchableOpacity>

              {/* Copy Text */}
              <TouchableOpacity
                style={styles.platformBtn}
                activeOpacity={0.7}
                onPress={() => handleShare('copy')}
              >
                <View style={[styles.platformIconBubble, { backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border }]}>
                  <Ionicons name="copy-outline" size={18} color={colors.textPrimary} />
                </View>
                <View style={styles.platformInfo}>
                  <Text style={styles.platformTitle}>Copy Text</Text>
                  <Text style={styles.platformDesc}>Ready to paste</Text>
                </View>
              </TouchableOpacity>

              {/* System Share (All Apps) */}
              <TouchableOpacity
                style={[styles.platformBtn, { width: '100%' }]}
                activeOpacity={0.7}
                onPress={() => handleShare('system')}
              >
                <View style={[styles.platformIconBubble, { backgroundColor: colors.primary }]}>
                  <Ionicons name="share-social-outline" size={18} color={colors.primaryText} />
                </View>
                <View style={styles.platformInfo}>
                  <Text style={styles.platformTitle}>More Apps (System Share)</Text>
                  <Text style={styles.platformDesc}>
                    Instagram Stories, Telegram, Email, Notes, AirDrop
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
