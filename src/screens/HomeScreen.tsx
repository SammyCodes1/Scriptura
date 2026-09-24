import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Share,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useBible } from '../context/BibleContext';
import { useTheme } from '../context/ThemeContext';
import {
  getChapterOfTheWeek,
  getVerseOfTheDay,
  isChapterOfWeekNotificationOptedIn,
  setChapterOfWeekNotificationOptIn,
  ChapterOfTheWeekData,
  VerseOfTheDayData,
} from '../services/curated/dailyScriptureService';
import {
  getLocalReadingHistory,
  LocalReadingHistoryRow,
  getLocalReadingPlanProgress,
} from '../database/sqlite';
import { STARTER_READING_PLANS } from '../config/readingPlans';
import { syncVerseOfTheDayToWidgetStorage } from '../services/widget/widgetDataService';
import { bibleProvider } from '../services/bible/BibleProvider';
import { resolveBook } from '../config/books';
import { hapticSelection } from '../utils/haptics';
import { ShareScriptureModal } from '../components/ShareScriptureModal';
import { VerseCardModal } from '../components/VerseCardModal';
import { VerseDataForCard } from '../services/export/verseCardService';

export const HomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { isGuest, user } = useAuth();
  const { currentTranslation, currentBook, currentChapterNum, navigateTo } = useBible();
  const { colors, spacing, radii, fonts, fontSizes, fontWeights, scriptureFontSize, scriptureLineHeight } = useTheme();

  const [chapterOfWeek] = useState<ChapterOfTheWeekData>(getChapterOfTheWeek());
  const [verseOfDay] = useState<VerseOfTheDayData>(getVerseOfTheDay());
  const [notifyChapterOfWeek, setNotifyChapterOfWeek] = useState<boolean>(false);
  const [recentHistory, setRecentHistory] = useState<LocalReadingHistoryRow[]>([]);
  const [activePlanStreak, setActivePlanStreak] = useState<number>(0);
  const [latestVerseData, setLatestVerseData] = useState<{
    bookName: string;
    bookCode: string;
    chapter: number;
    translation: string;
    verseText: string;
    timeAgoText: string;
  } | null>(null);

  // Multi-Platform Share & 3-Design Verse Card Modals
  const [selectedVerseForAction, setSelectedVerseForAction] = useState<VerseDataForCard | null>(null);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [cardModalVisible, setCardModalVisible] = useState(false);

  const formatRelativeTime = (dateString?: string): string => {
    if (!dateString) return 'Pick up where you left off';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      if (diffMs < 0 || isNaN(diffMs)) return 'Recently read';
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Read just now';
      if (diffMins < 60) return `Read ${diffMins}m ago`;
      if (diffHours < 24) return `Read ${diffHours}h ago`;
      if (diffDays === 1) return 'Read yesterday';
      if (diffDays < 7) return `Read ${diffDays}d ago`;
      return `Read on ${date.toLocaleDateString()}`;
    } catch {
      return 'Recently read';
    }
  };

  useEffect(() => {
    isChapterOfWeekNotificationOptedIn().then(setNotifyChapterOfWeek);
    getLocalReadingPlanProgress('plan_psalms_30').then(p => {
      if (p) setActivePlanStreak(p.streak);
    });
    // Sync widget storage
    syncVerseOfTheDayToWidgetStorage();

    // Fetch latest reading history and its scripture snippet
    getLocalReadingHistory(5).then(async history => {
      setRecentHistory(history);
      const topHistory = history.length > 0 ? history[0] : null;
      const targetBookCode = topHistory ? topHistory.book : currentBook;
      const targetChapter = topHistory ? topHistory.chapter : currentChapterNum;
      const targetTranslation = topHistory ? topHistory.translation : currentTranslation;
      const resolved = resolveBook(targetBookCode);
      const bookName = resolved?.name || targetBookCode;
      const bookCode = resolved?.code || targetBookCode;
      const timeAgo = formatRelativeTime(topHistory?.last_read_at);

      try {
        const chapter = await bibleProvider.getChapter(targetTranslation, bookCode, targetChapter);
        const firstVerse = chapter.verses?.[0];
        const verseText = firstVerse ? (firstVerse.cleanText || firstVerse.text) : 'Tap to open and resume reading.';
        setLatestVerseData({
          bookName,
          bookCode,
          chapter: targetChapter,
          translation: targetTranslation,
          verseText,
          timeAgoText: timeAgo,
        });
      } catch {
        setLatestVerseData({
          bookName,
          bookCode,
          chapter: targetChapter,
          translation: targetTranslation,
          verseText: 'Tap anywhere to resume reading your last chapter.',
          timeAgoText: timeAgo,
        });
      }
    });
  }, [currentChapterNum, currentBook, currentTranslation]);

  const handleToggleNotification = async (val: boolean) => {
    setNotifyChapterOfWeek(val);
    await setChapterOfWeekNotificationOptIn(val);
    Alert.alert(
      val ? 'Notifications Enabled' : 'Notifications Disabled',
      val
        ? 'You will be notified every Monday when the new Chapter of the Week is released.'
        : 'Monday Chapter of the Week notifications turned off.'
    );
  };

  const handleShareVotd = () => {
    setSelectedVerseForAction({
      text: verseOfDay.text,
      reference: verseOfDay.reference,
      translation: currentTranslation,
    });
    setShareModalVisible(true);
  };

  const handleResumeReading = async () => {
    hapticSelection();
    if (latestVerseData) {
      await navigateTo(latestVerseData.bookCode, latestVerseData.chapter, latestVerseData.translation);
    } else if (recentHistory.length > 0) {
      const top = recentHistory[0];
      await navigateTo(top.book, top.chapter, top.translation);
    } else {
      await navigateTo(currentBook, currentChapterNum, currentTranslation);
    }
    navigation.navigate('Read');
  };

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
    title: { fontSize: fontSizes.xxl, fontWeight: fontWeights.extrabold, color: colors.textPrimary, marginBottom: spacing.xs / 2 },
    subtitle: { fontSize: fontSizes.sm, color: colors.textSecondary, marginBottom: spacing.lg, fontFamily: fonts.sans },
    guestBanner: {
      backgroundColor: colors.warningLight,
      borderColor: colors.warning,
      borderWidth: 1,
      padding: spacing.md,
      borderRadius: radii.lg,
      marginBottom: spacing.lg,
    },
    guestTitle: { fontWeight: fontWeights.bold, color: colors.warning, fontSize: fontSizes.md, marginBottom: spacing.xs },
    guestText: { fontSize: fontSizes.sm, color: colors.warning, marginBottom: spacing.sm, lineHeight: 17, fontFamily: fonts.sans },
    guestBtn: {
      backgroundColor: colors.warning,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: radii.sm,
      alignSelf: 'flex-start',
    },
    guestBtnText: { color: colors.surface, fontWeight: fontWeights.bold, fontSize: fontSizes.sm },
    card: {
      backgroundColor: colors.surfaceElevated,
      borderRadius: radii.xl,
      padding: spacing.lg,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    lastReadCard: {
      backgroundColor: colors.surface,
      borderRadius: radii.xl,
      padding: spacing.lg,
      marginBottom: spacing.lg,
      borderWidth: 1.5,
      borderColor: colors.border,
      shadowColor: colors.overlay,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    lastReadPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.surfaceElevated,
      paddingVertical: 4,
      paddingHorizontal: spacing.sm,
      borderRadius: radii.pill,
    },
    lastReadPillText: {
      fontSize: fontSizes.xs - 1,
      fontWeight: fontWeights.extrabold,
      color: colors.textSecondary,
      letterSpacing: 0.8,
    },
    translationBadge: {
      backgroundColor: colors.primary,
      paddingVertical: 3,
      paddingHorizontal: spacing.sm,
      borderRadius: radii.sm,
    },
    translationBadgeText: {
      color: colors.primaryText,
      fontSize: fontSizes.xs,
      fontWeight: fontWeights.bold,
    },
    refRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      marginTop: spacing.sm,
      marginBottom: spacing.xs,
    },
    lastReadHeading: {
      fontSize: fontSizes.xl,
      fontWeight: fontWeights.extrabold,
      color: colors.textPrimary,
      fontFamily: fonts.sans,
    },
    timeAgoBadge: {
      fontSize: fontSizes.xs,
      color: colors.textSecondary,
      fontFamily: fonts.sans,
    },
    scriptureQuoteContainer: {
      backgroundColor: colors.surfaceElevated,
      borderRadius: radii.md,
      padding: spacing.md,
      marginVertical: spacing.sm,
      borderLeftWidth: 3,
      borderLeftColor: colors.primary,
    },
    scriptureQuoteText: {
      color: colors.scriptureText,
      fontSize: Math.max(15, scriptureFontSize - 2),
      lineHeight: Math.round(Math.max(15, scriptureFontSize - 2) * 1.55),
      fontFamily: fonts.serif,
      fontStyle: 'italic',
    },
    resumeActionBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: spacing.xs,
      paddingTop: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.borderLight,
    },
    resumeActionText: {
      fontSize: fontSizes.sm,
      fontWeight: fontWeights.semibold,
      color: colors.textPrimary,
    },
    resumeIconBubble: {
      width: 26,
      height: 26,
      borderRadius: radii.pill,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    cardHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    cardLabel: { fontSize: fontSizes.xs, fontWeight: fontWeights.extrabold, color: colors.textSecondary, letterSpacing: 0.6 },
    autoTrackBadge: { fontSize: fontSizes.xs, color: colors.success, fontWeight: fontWeights.bold },
    rotationBadge: { fontSize: fontSizes.xs, color: colors.primary, fontWeight: fontWeights.bold },
    cardHeading: { fontSize: fontSizes.xl, fontWeight: fontWeights.extrabold, color: colors.textPrimary, marginBottom: spacing.sm / 2 },
    timeAgoText: { fontSize: fontSizes.sm, color: colors.textSecondary, marginBottom: spacing.md, fontFamily: fonts.sans },
    primaryActionBtn: {
      backgroundColor: colors.primary,
      minHeight: 44,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderRadius: radii.md,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: spacing.xs,
    },
    primaryActionBtnText: { color: colors.primaryText, fontWeight: fontWeights.bold, fontSize: fontSizes.md },
    votdCard: {
      backgroundColor: colors.textPrimary,
      borderRadius: radii.xl,
      padding: spacing.lg,
      marginBottom: spacing.lg,
    },
    votdLabel: { fontSize: fontSizes.xs, fontWeight: fontWeights.extrabold, color: colors.warning, letterSpacing: 0.8 },
    themePill: {
      backgroundColor: colors.overlay,
      paddingVertical: spacing.xs / 2,
      paddingHorizontal: spacing.sm,
      borderRadius: radii.pill,
    },
    themePillText: { color: colors.surface, fontSize: fontSizes.xs, fontWeight: fontWeights.semibold },
    votdText: {
      color: colors.surface,
      fontSize: scriptureFontSize,
      lineHeight: scriptureLineHeight,
      fontFamily: fonts.serif,
      fontStyle: 'italic',
      marginVertical: spacing.md,
    },
    votdRef: { color: colors.borderLight, fontSize: fontSizes.md, fontWeight: fontWeights.bold, marginBottom: spacing.md },
    votdActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    votdActionBtn: {
      backgroundColor: colors.surface,
      minHeight: 44,
      minWidth: 44,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: radii.sm,
    },
    votdActionText: { color: colors.textPrimary, fontWeight: fontWeights.bold, fontSize: fontSizes.sm },
    votdShareBtn: {
      backgroundColor: colors.overlay,
      minHeight: 44,
      minWidth: 44,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: radii.sm,
      flexDirection: 'row',
      gap: spacing.xs,
    },
    votdShareText: { color: colors.surface, fontWeight: fontWeights.semibold, fontSize: fontSizes.sm },
    cardBlurb: { fontSize: fontSizes.md, color: colors.textSecondary, lineHeight: 21, marginBottom: spacing.md, fontFamily: fonts.sans },
    darkActionBtn: {
      backgroundColor: colors.textPrimary,
      minHeight: 44,
      justifyContent: 'center',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderRadius: radii.md,
      alignItems: 'center',
    },
    darkActionBtnText: { color: colors.surface, fontWeight: fontWeights.bold, fontSize: fontSizes.sm },
    notifyRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: spacing.md,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderColor: colors.borderLight,
    },
    notifyLabel: { fontSize: fontSizes.sm, color: colors.textSecondary, flex: 1, marginRight: spacing.sm, fontFamily: fonts.sans },
    streakPill: {
      backgroundColor: colors.warningLight,
      paddingVertical: spacing.xs / 2,
      paddingHorizontal: spacing.sm,
      borderRadius: radii.pill,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs / 2,
    },
    streakPillText: { color: colors.warning, fontSize: fontSizes.xs, fontWeight: fontWeights.bold },
    lowGuiltNote: {
      fontSize: fontSizes.sm,
      color: colors.success,
      lineHeight: 18,
      marginVertical: spacing.sm,
      fontStyle: 'italic',
      fontFamily: fonts.sans,
    },
    outlineActionBtn: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      minHeight: 44,
      justifyContent: 'center',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderRadius: radii.md,
      alignItems: 'center',
      marginTop: spacing.xs,
    },
    outlineActionBtnText: { color: colors.textPrimary, fontWeight: fontWeights.bold, fontSize: fontSizes.sm },
  }), [colors, spacing, radii, fonts, fontSizes, fontWeights, scriptureFontSize, scriptureLineHeight]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Scriptura</Text>
      <Text style={styles.subtitle}>Holy Scripture • Offline First • Cloud Synced</Text>

      {/* Guest Mode Banner */}
      {isGuest && (
        <View style={styles.guestBanner}>
          <Text style={styles.guestTitle}>Guest Mode Active</Text>
          <Text style={styles.guestText}>
            Bookmarks, highlights, and history are saved locally on this device.
          </Text>
          <TouchableOpacity
            style={styles.guestBtn}
            onPress={() => navigation.navigate('Profile')}
            accessibilityRole="button"
            accessibilityLabel="Create Account to Sync Across Devices"
          >
            <Text style={styles.guestBtnText}>Create Account to Sync Across Devices</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 1. Last Scripture Read Card (Entire Card Clickable to jump instantly) */}
      <TouchableOpacity
        style={styles.lastReadCard}
        onPress={handleResumeReading}
        activeOpacity={0.88}
        accessibilityRole="button"
        accessibilityLabel={`Last scripture read: ${latestVerseData ? `${latestVerseData.bookName} ${latestVerseData.chapter}` : `${currentBook} ${currentChapterNum}`}. Double tap to resume reading.`}
        accessibilityHint="Resumes reading from your last opened chapter"
      >
        <View style={styles.cardHeaderRow}>
          <View style={styles.lastReadPill}>
            <Ionicons name="book-outline" size={13} color={colors.accent} />
            <Text style={styles.lastReadPillText}>LAST SCRIPTURE READ</Text>
          </View>
          <View style={styles.translationBadge}>
            <Text style={styles.translationBadgeText}>
              {latestVerseData?.translation || currentTranslation}
            </Text>
          </View>
        </View>

        {/* Chapter Reference & Relative Time */}
        <View style={styles.refRow}>
          <Text style={styles.lastReadHeading}>
            {latestVerseData
              ? `${latestVerseData.bookName} ${latestVerseData.chapter}`
              : `${currentBook} ${currentChapterNum}`}
          </Text>
          <Text style={styles.timeAgoBadge}>
            {latestVerseData?.timeAgoText || 'Pick up where you left off'}
          </Text>
        </View>

        {/* Scripture Text Excerpt */}
        <View style={styles.scriptureQuoteContainer}>
          <Text style={styles.scriptureQuoteText} numberOfLines={3}>
            "{latestVerseData?.verseText || 'In the beginning God created the heaven and the earth.'}"
          </Text>
        </View>

        {/* Clickable Resume Action Prompt Bar */}
        <View style={styles.resumeActionBar}>
          <Text style={styles.resumeActionText}>Tap anywhere to continue reading</Text>
          <View style={styles.resumeIconBubble}>
            <Ionicons name="arrow-forward" size={15} color={colors.primaryText} />
          </View>
        </View>
      </TouchableOpacity>

      {/* 2. Verse of the Day Card */}
      <View style={styles.votdCard}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.votdLabel}>VERSE OF THE DAY</Text>
          <View style={styles.themePill}>
            <Text style={styles.themePillText}>{verseOfDay.theme}</Text>
          </View>
        </View>

        <Text style={styles.votdText}>"{verseOfDay.text}"</Text>
        <Text style={styles.votdRef}>{verseOfDay.reference}</Text>

        <View style={styles.votdActions}>
          <TouchableOpacity
            style={styles.votdActionBtn}
            onPress={async () => {
              await navigateTo(verseOfDay.bookCode, verseOfDay.chapter, currentTranslation, verseOfDay.verse);
              navigation.navigate('Read');
            }}
            accessibilityRole="button"
            accessibilityLabel={`Read ${verseOfDay.reference} in context`}
          >
            <Text style={styles.votdActionText}>Read in Context</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.votdShareBtn}
            onPress={async () => {
              await syncVerseOfTheDayToWidgetStorage();
              navigation.navigate('VerseWidget');
            }}
            accessibilityRole="button"
            accessibilityLabel="Preview and sync Verse of the Day widget"
          >
            <Text style={styles.votdShareText}>Widget</Text>
            <Ionicons name="phone-portrait-outline" size={14} color={colors.surface} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.votdShareBtn}
            onPress={handleShareVotd}
            accessibilityRole="button"
            accessibilityLabel={`Share ${verseOfDay.reference} verse card`}
          >
            <Text style={styles.votdShareText}>Share</Text>
            <Ionicons name="share-outline" size={14} color={colors.surface} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 3. Chapter of the Week Card */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardLabel}>FEATURED CHAPTER OF THE WEEK</Text>
          <Text style={styles.rotationBadge}>Every Monday</Text>
        </View>
        <Text style={styles.cardHeading}>{chapterOfWeek.title}</Text>
        <Text style={styles.cardBlurb}>{chapterOfWeek.blurb}</Text>

        <TouchableOpacity
          style={styles.darkActionBtn}
          onPress={async () => {
            await navigateTo(chapterOfWeek.bookCode, chapterOfWeek.chapter, currentTranslation);
            navigation.navigate('Read');
          }}
          accessibilityRole="button"
          accessibilityLabel={`Read chapter of the week: ${chapterOfWeek.bookName} chapter ${chapterOfWeek.chapter}`}
        >
          <Text style={styles.darkActionBtnText}>
            Read {chapterOfWeek.bookName} {chapterOfWeek.chapter}
          </Text>
        </TouchableOpacity>

        {/* Notification Opt-in */}
        <View style={styles.notifyRow}>
          <Text style={styles.notifyLabel}>Notify me every Monday when released</Text>
          <Switch
            value={notifyChapterOfWeek}
            onValueChange={handleToggleNotification}
            trackColor={{ false: colors.border, true: colors.textPrimary }}
            thumbColor={colors.surface}
            accessibilityLabel="Notify me every Monday when new chapter of the week is released"
          />
        </View>
      </View>

      {/* 4. Reading Plans Quick Card */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardLabel}>DAILY READING PLAN</Text>
          <View style={styles.streakPill}>
            <Ionicons name="flame-outline" size={12} color={colors.warning} />
            <Text style={styles.streakPillText}>{activePlanStreak} Day Milestone</Text>
          </View>
        </View>
        <Text style={styles.cardHeading}>Psalms in a Month</Text>
        <Text style={styles.lowGuiltNote}>
          Grace on your journey. Missed a day? No rush—pick up right where you left off.
        </Text>

        <TouchableOpacity
          style={styles.outlineActionBtn}
          onPress={() => navigation.navigate('Library', { initialTab: 'plans' })}
          accessibilityRole="button"
          accessibilityLabel="Open daily reading plans"
        >
          <Text style={styles.outlineActionBtnText}>Open Reading Plans</Text>
        </TouchableOpacity>
      </View>

      {/* 5. Biblical Places Interactive Map Card */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardLabel}>SACRED GEOGRAPHY</Text>
          <View style={[styles.streakPill, { backgroundColor: colors.surfaceElevated }]}>
            <Ionicons name="map-outline" size={12} color={colors.textSecondary} />
            <Text style={[styles.streakPillText, { color: colors.textSecondary }]}>1,300+ Sites</Text>
          </View>
        </View>
        <Text style={styles.cardHeading}>Biblical Places Map</Text>
        <Text style={styles.cardBlurb}>
          Explore ancient cities, mountains, and waters with historical photos, archaeological notes, and Scripture references.
        </Text>
        <TouchableOpacity
          style={styles.primaryActionBtn}
          onPress={() => navigation.navigate('BibleMap')}
          accessibilityRole="button"
          accessibilityLabel="Explore Sacred Sites Map with over 1300 biblical locations"
        >
          <Text style={styles.primaryActionBtnText}>Explore Sacred Sites Map</Text>
          <Ionicons name="compass-outline" size={16} color={colors.primaryText} />
        </TouchableOpacity>
      </View>

      {/* 6. Community & Prayer Card */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardLabel}>CONNECT</Text>
        </View>
        <Text style={styles.cardHeading}>Community & Prayer</Text>
        <Text style={styles.cardBlurb}>Join others in prayer and connect with the community.</Text>
        <TouchableOpacity
          style={styles.outlineActionBtn}
          onPress={() => navigation.navigate('Community')}
          accessibilityRole="button"
          accessibilityLabel="Go to Community and Prayer wall"
        >
          <Text style={styles.outlineActionBtnText}>Go to Community</Text>
        </TouchableOpacity>
      </View>

      {/* 7. Daily Confessions Card */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardLabel}>SPEAK THE WORD</Text>
        </View>
        <Text style={styles.cardHeading}>Daily Confessions</Text>
        <Text style={styles.cardBlurb}>Start your day by declaring God's truth over your life.</Text>
        <TouchableOpacity
          style={styles.outlineActionBtn}
          onPress={() => navigation.navigate('Confessions')}
          accessibilityRole="button"
          accessibilityLabel="View Daily Confessions and scripture declarations"
        >
          <Text style={styles.outlineActionBtnText}>View Confessions</Text>
        </TouchableOpacity>
      </View>

      {/* Multi-Platform Sharing Modal */}
      <ShareScriptureModal
        visible={shareModalVisible}
        verse={selectedVerseForAction}
        onClose={() => setShareModalVisible(false)}
        onOpenCardDesigner={(v) => {
          setSelectedVerseForAction(v);
          setCardModalVisible(true);
        }}
      />

      {/* 3-Design Verse Card Downloader Modal */}
      <VerseCardModal
        visible={cardModalVisible}
        verse={selectedVerseForAction}
        onClose={() => setCardModalVisible(false)}
      />
    </ScrollView>
  );
};
