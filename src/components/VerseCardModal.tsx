import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import {
  VERSE_CARD_DESIGNS,
  VerseCardDesignId,
  VerseDataForCard,
  downloadVerseCard,
  formatScriptureForShare,
} from '../services/export/verseCardService';
import { shareScriptureToPlatform } from '../services/export/sharingService';
import { hapticSelection, hapticSuccess } from '../utils/haptics';

interface VerseCardModalProps {
  visible: boolean;
  verse: VerseDataForCard | null;
  onClose: () => void;
}

export const VerseCardModal: React.FC<VerseCardModalProps> = ({
  visible,
  verse,
  onClose,
}) => {
  const { colors, spacing, radii, fontSizes, fontWeights, fonts } = useTheme();
  const [selectedDesign, setSelectedDesign] = useState<VerseCardDesignId>('classic');
  const [isDownloading, setIsDownloading] = useState(false);

  const activeDesign = VERSE_CARD_DESIGNS[selectedDesign];

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
          maxHeight: '92%',
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
        designSelectorLabel: {
          fontSize: fontSizes.xs,
          fontWeight: fontWeights.bold,
          color: colors.textSecondary,
          textTransform: 'uppercase',
          letterSpacing: 0.6,
          marginBottom: spacing.xs,
        },
        designTabsRow: {
          flexDirection: 'row',
          gap: spacing.xs,
          marginBottom: spacing.md,
        },
        designTab: {
          flex: 1,
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.xs,
          borderRadius: radii.md,
          borderWidth: 1.5,
          borderColor: colors.borderLight,
          backgroundColor: colors.surfaceElevated,
          alignItems: 'center',
        },
        designTabActive: {
          borderColor: colors.primary,
          backgroundColor: colors.surface,
        },
        swatchDot: {
          width: 14,
          height: 14,
          borderRadius: 7,
          marginBottom: 4,
          borderWidth: 1,
        },
        designTabText: {
          fontSize: 11,
          fontWeight: fontWeights.semibold,
          color: colors.textSecondary,
          textAlign: 'center',
        },
        designTabTextActive: {
          color: colors.textPrimary,
          fontWeight: fontWeights.bold,
        },
        previewOuterContainer: {
          alignItems: 'center',
          marginVertical: spacing.sm,
        },
        cardVisual: {
          width: '100%',
          aspectRatio: 1,
          borderRadius: radii.xl,
          padding: spacing.lg,
          justifyContent: 'space-between',
          borderWidth: 2,
          position: 'relative',
          overflow: 'hidden',
        },
        cardInnerBorder: {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          margin: 12,
          borderRadius: radii.lg,
          borderWidth: 1,
          borderStyle: 'dashed',
          pointerEvents: 'none',
        },
        cardTopTag: {
          alignSelf: 'center',
          paddingVertical: 3,
          paddingHorizontal: spacing.sm,
          borderRadius: radii.pill,
          borderWidth: 1,
        },
        cardTopTagText: {
          fontSize: 9,
          fontWeight: fontWeights.bold,
          letterSpacing: 1.5,
          textTransform: 'uppercase',
        },
        cardBody: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: spacing.sm,
        },
        quoteMark: {
          fontSize: 32,
          fontWeight: fontWeights.bold,
          marginBottom: -10,
        },
        verseText: {
          textAlign: 'center',
          fontSize: 15,
          lineHeight: 22,
          fontWeight: fontWeights.medium,
        },
        cardBottom: {
          alignItems: 'center',
        },
        refDivider: {
          width: 60,
          height: 1,
          marginBottom: 6,
        },
        referenceText: {
          fontSize: fontSizes.sm,
          fontWeight: fontWeights.bold,
          marginBottom: 4,
        },
        transTag: {
          paddingVertical: 2,
          paddingHorizontal: spacing.sm,
          borderRadius: radii.sm,
          borderWidth: 0.5,
          marginBottom: 6,
        },
        transTagText: {
          fontSize: 9,
          fontWeight: fontWeights.bold,
        },
        watermarkText: {
          fontSize: 9,
          letterSpacing: 2,
          opacity: 0.5,
          fontWeight: fontWeights.semibold,
        },
        actionsRow: {
          flexDirection: 'row',
          gap: spacing.sm,
          marginTop: spacing.md,
          marginBottom: spacing.xs,
        },
        downloadBtn: {
          flex: 1,
          backgroundColor: colors.primary,
          paddingVertical: spacing.md,
          borderRadius: radii.md,
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          gap: spacing.xs,
        },
        downloadBtnText: {
          color: colors.primaryText,
          fontWeight: fontWeights.bold,
          fontSize: fontSizes.sm,
        },
        shareImageBtn: {
          backgroundColor: colors.surfaceElevated,
          borderWidth: 1,
          borderColor: colors.border,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.md,
          borderRadius: radii.md,
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xs,
        },
        shareImageBtnText: {
          color: colors.textPrimary,
          fontWeight: fontWeights.semibold,
          fontSize: fontSizes.sm,
        },
        captionTip: {
          fontSize: fontSizes.caption,
          color: colors.textTertiary,
          textAlign: 'center',
          marginTop: spacing.xs,
        },
      }),
    [colors, spacing, radii, fontSizes, fontWeights, fonts]
  );

  if (!verse) return null;

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const res = await downloadVerseCard(verse, selectedDesign);
      if (res.success) {
        hapticSuccess();
        Alert.alert(
          'Verse Card Ready',
          `"${verse.reference}" card in ${activeDesign.name} design has been prepared for download.`
        );
      } else {
        Alert.alert('Download Error', res.error || 'Failed to download card');
      }
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopyFormatted = async () => {
    await shareScriptureToPlatform(verse, 'copy');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>Download Verse Card</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Design Selector (3 Specific Designs) */}
            <Text style={styles.designSelectorLabel}>Select Design (3 Specific Styles)</Text>
            <View style={styles.designTabsRow}>
              {(['classic', 'celestial', 'botanical'] as VerseCardDesignId[]).map((dId) => {
                const d = VERSE_CARD_DESIGNS[dId];
                const isActive = selectedDesign === dId;
                return (
                  <TouchableOpacity
                    key={dId}
                    style={[styles.designTab, isActive && styles.designTabActive]}
                    activeOpacity={0.7}
                    onPress={() => {
                      hapticSelection();
                      setSelectedDesign(dId);
                    }}
                  >
                    <View
                      style={[
                        styles.swatchDot,
                        {
                          backgroundColor: d.cardBg,
                          borderColor: d.borderColor,
                        },
                      ]}
                    />
                    <Text
                      style={[styles.designTabText, isActive && styles.designTabTextActive]}
                      numberOfLines={1}
                    >
                      {d.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Live Visual Card Rendering */}
            <View style={styles.previewOuterContainer}>
              <View
                style={[
                  styles.cardVisual,
                  {
                    backgroundColor: activeDesign.cardBg,
                    borderColor: activeDesign.borderColor,
                  },
                ]}
              >
                {/* Decorative Dashed Inner Frame */}
                <View
                  style={[
                    styles.cardInnerBorder,
                    { borderColor: activeDesign.ornamentColor, opacity: 0.4 },
                  ]}
                />

                {/* Holy Scripture Pill */}
                <View
                  style={[
                    styles.cardTopTag,
                    {
                      backgroundColor: activeDesign.badgeBg,
                      borderColor: activeDesign.accentColor,
                    },
                  ]}
                >
                  <Text style={[styles.cardTopTagText, { color: activeDesign.badgeText }]}>
                    Holy Scripture
                  </Text>
                </View>

                {/* Verse Text Body */}
                <View style={styles.cardBody}>
                  <Text style={[styles.quoteMark, { color: activeDesign.accentColor }]}>“</Text>
                  <Text
                    style={[
                      styles.verseText,
                      {
                        color: activeDesign.textColor,
                        fontFamily: selectedDesign === 'celestial' ? fonts.sans : fonts.serif,
                      },
                    ]}
                    numberOfLines={6}
                  >
                    {verse.text.trim()}
                  </Text>
                </View>

                {/* Reference & Watermark */}
                <View style={styles.cardBottom}>
                  <View
                    style={[styles.refDivider, { backgroundColor: activeDesign.accentColor }]}
                  />
                  <Text style={[styles.referenceText, { color: activeDesign.textColor }]}>
                    — {verse.reference} —
                  </Text>
                  <View
                    style={[
                      styles.transTag,
                      {
                        backgroundColor: activeDesign.badgeBg,
                        borderColor: activeDesign.accentColor,
                      },
                    ]}
                  >
                    <Text style={[styles.transTagText, { color: activeDesign.badgeText }]}>
                      {verse.translation}
                    </Text>
                  </View>
                  <Text style={[styles.watermarkText, { color: activeDesign.textColor }]}>
                    SCRIPTURA BIBLE
                  </Text>
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.downloadBtn}
                activeOpacity={0.8}
                onPress={handleDownload}
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <ActivityIndicator size="small" color={colors.primaryText} />
                ) : (
                  <>
                    <Ionicons name="download-outline" size={18} color={colors.primaryText} />
                    <Text style={styles.downloadBtnText}>Download Card</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.shareImageBtn}
                activeOpacity={0.7}
                onPress={handleCopyFormatted}
              >
                <Ionicons name="copy-outline" size={17} color={colors.textPrimary} />
                <Text style={styles.shareImageBtnText}>Copy Text</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.captionTip}>
              Exported as high-resolution vector graphic ready for social posts or saving to device.
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
