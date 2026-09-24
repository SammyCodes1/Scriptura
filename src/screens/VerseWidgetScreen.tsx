import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { useBible } from '../context/BibleContext';
import { useTheme } from '../context/ThemeContext';
import {
  formatWidgetDate,
  getWidgetLimitationReport,
  getWidgetVersePayload,
  syncVerseOfTheDayToWidgetStorage,
  WidgetPayload,
} from '../services/widget/widgetDataService';

export const VerseWidgetScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors, spacing, radii, fonts, fontSizes, fontWeights, scriptureFontSize, scriptureLineHeight } = useTheme();
  const { currentTranslation, navigateTo } = useBible();
  const [payload, setPayload] = useState<WidgetPayload | null>(null);
  const widgetReport = getWidgetLimitationReport();

  const refreshWidgetPayload = async () => {
    const synced = await syncVerseOfTheDayToWidgetStorage();
    setPayload(synced);
  };

  useEffect(() => {
    getWidgetVersePayload().then(existing => {
      if (existing) {
        setPayload(existing);
      } else {
        refreshWidgetPayload();
      }
    });
  }, []);

  const handleCopyPayload = async () => {
    if (!payload) return;
    await Clipboard.setStringAsync(JSON.stringify(payload, null, 2));
    Alert.alert('Widget payload copied', 'The current Verse of the Day widget payload is ready for native widget integration.');
  };

  const handleReadVerse = async () => {
    if (!payload) return;
    await navigateTo(payload.bookCode, payload.chapter, currentTranslation, payload.verse);
    navigation.navigate('Read');
  };

  const lastUpdatedText = payload?.lastUpdated
    ? new Date(payload.lastUpdated).toLocaleString()
    : 'Not synced yet';

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
    eyebrow: {
      color: colors.primary,
      fontSize: fontSizes.xs,
      fontWeight: fontWeights.extrabold,
      letterSpacing: 0.7,
      marginBottom: spacing.xs,
    },
    title: {
      color: colors.textPrimary,
      fontSize: fontSizes.xxl,
      fontWeight: fontWeights.extrabold,
      marginBottom: spacing.xs,
      fontFamily: fonts.sans,
    },
    subtitle: {
      color: colors.textSecondary,
      fontSize: fontSizes.sm,
      lineHeight: 20,
      marginBottom: spacing.lg,
      fontFamily: fonts.sans,
    },
    widgetFrame: {
      backgroundColor: colors.textPrimary,
      borderRadius: radii.xl,
      padding: spacing.lg,
      marginBottom: spacing.lg,
      minHeight: 210,
      justifyContent: 'space-between',
      shadowColor: colors.overlay,
      shadowOpacity: 0.14,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 3,
    },
    widgetTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    widgetLabel: {
      color: colors.warning,
      fontSize: fontSizes.xs,
      fontWeight: fontWeights.extrabold,
      letterSpacing: 0.8,
    },
    datePill: {
      backgroundColor: colors.overlay,
      paddingVertical: 4,
      paddingHorizontal: spacing.sm,
      borderRadius: radii.pill,
    },
    datePillText: { color: colors.surface, fontSize: fontSizes.xs, fontWeight: fontWeights.semibold },
    verseText: {
      color: colors.surface,
      fontFamily: fonts.serif,
      fontSize: Math.max(18, scriptureFontSize),
      lineHeight: Math.max(28, scriptureLineHeight),
      fontStyle: 'italic',
      marginBottom: spacing.md,
    },
    widgetBottomRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: spacing.sm,
    },
    reference: {
      color: colors.borderLight,
      fontSize: fontSizes.md,
      fontWeight: fontWeights.bold,
      flex: 1,
    },
    themePill: {
      backgroundColor: colors.surface,
      paddingVertical: 5,
      paddingHorizontal: spacing.sm,
      borderRadius: radii.pill,
    },
    themeText: { color: colors.textPrimary, fontSize: fontSizes.xs, fontWeight: fontWeights.bold },
    panel: {
      backgroundColor: colors.surfaceElevated,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.borderLight,
      padding: spacing.lg,
      marginBottom: spacing.lg,
    },
    panelTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.sm },
    panelTitle: { color: colors.textPrimary, fontSize: fontSizes.lg, fontWeight: fontWeights.extrabold },
    panelText: { color: colors.textSecondary, fontSize: fontSizes.sm, lineHeight: 20, fontFamily: fonts.sans },
    statusRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    statusLabel: { color: colors.textSecondary, fontSize: fontSizes.sm, fontFamily: fonts.sans },
    statusValue: { color: colors.textPrimary, fontSize: fontSizes.sm, fontWeight: fontWeights.bold, flex: 1, textAlign: 'right' },
    actionRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
    primaryButton: {
      flex: 1,
      minHeight: 46,
      borderRadius: radii.md,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
    },
    primaryButtonText: { color: colors.primaryText, fontSize: fontSizes.sm, fontWeight: fontWeights.bold },
    secondaryButton: {
      flex: 1,
      minHeight: 46,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
    },
    secondaryButtonText: { color: colors.textPrimary, fontSize: fontSizes.sm, fontWeight: fontWeights.bold },
  }), [colors, spacing, radii, fonts, fontSizes, fontWeights, scriptureFontSize, scriptureLineHeight]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>VERSE OF THE DAY WIDGET</Text>
      <Text style={styles.title}>Daily scripture at a glance</Text>
      <Text style={styles.subtitle}>
        Scriptura keeps today&apos;s verse synced in a widget-ready payload so a production iOS or Android widget can render it without opening the app.
      </Text>

      <View style={styles.widgetFrame}>
        <View>
          <View style={styles.widgetTopRow}>
            <Text style={styles.widgetLabel}>SCRIPTURA TODAY</Text>
            <View style={styles.datePill}>
              <Text style={styles.datePillText}>{formatWidgetDate()}</Text>
            </View>
          </View>
          <Text style={styles.verseText} numberOfLines={6}>
            &quot;{payload?.text || 'Syncing today\'s verse...'}&quot;
          </Text>
        </View>
        <View style={styles.widgetBottomRow}>
          <Text style={styles.reference}>{payload?.reference || 'Verse of the Day'}</Text>
          <View style={styles.themePill}>
            <Text style={styles.themeText}>{payload?.theme || 'Daily'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.panel}>
        <View style={styles.panelTitleRow}>
          <Ionicons name="sync-circle-outline" size={22} color={colors.primary} />
          <Text style={styles.panelTitle}>Widget Sync</Text>
        </View>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Last updated</Text>
          <Text style={styles.statusValue}>{lastUpdatedText}</Text>
        </View>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Expo Go native widget</Text>
          <Text style={styles.statusValue}>{widgetReport.expoGoSupported ? 'Supported' : 'Not supported'}</Text>
        </View>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>EAS production widget</Text>
          <Text style={styles.statusValue}>{widgetReport.easPrebuildSupported ? 'Ready' : 'Unavailable'}</Text>
        </View>
        <Text style={[styles.panelText, { marginTop: spacing.md }]}>The app payload is ready for WidgetKit on iOS and AppWidgetProvider on Android when Scriptura moves through EAS prebuild.</Text>
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.primaryButton} onPress={refreshWidgetPayload} accessibilityRole="button" accessibilityLabel="Sync Verse of the Day widget payload now">
            <Ionicons name="refresh" size={16} color={colors.primaryText} />
            <Text style={styles.primaryButtonText}>Sync Now</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleCopyPayload} accessibilityRole="button" accessibilityLabel="Copy Verse of the Day widget payload">
            <Ionicons name="copy-outline" size={16} color={colors.textPrimary} />
            <Text style={styles.secondaryButtonText}>Copy Payload</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.panel}>
        <View style={styles.panelTitleRow}>
          <Ionicons name="book-outline" size={20} color={colors.primary} />
          <Text style={styles.panelTitle}>Read Today&apos;s Verse</Text>
        </View>
        <Text style={styles.panelText}>Open the verse in context using your current translation, then continue reading from the full chapter.</Text>
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleReadVerse} accessibilityRole="button" accessibilityLabel="Read today's Verse of the Day in context">
            <Text style={styles.primaryButtonText}>Read in Context</Text>
            <Ionicons name="arrow-forward" size={16} color={colors.primaryText} />
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};