import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  Share,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { useBible } from '../context/BibleContext';
import { useTheme } from '../context/ThemeContext';
import { THEME_LABELS, THEMES, ThemeName, FONT_STYLES, FontStyleId } from '../theme';
import { hapticLight, hapticMedium, hapticSelection } from '../utils/haptics';
import { BibleNavigationPicker } from '../components/BibleNavigationPicker';
import { AudioPlayerBar } from '../components/AudioPlayerBar';
import { ShareScriptureModal } from '../components/ShareScriptureModal';
import { VerseCardModal } from '../components/VerseCardModal';
import { VerseDataForCard } from '../services/export/verseCardService';
import { ttsService } from '../services/audio/ttsService';
import { Footnote } from '../services/bible/types';
import {
  getLocalHighlights,
  getLocalBookmarks,
  LocalHighlightRow,
  LocalBookmarkRow,
} from '../database/sqlite';

const HIGHLIGHT_COLORS = [
  { name: 'Yellow', hex: '#FEF08A' },
  { name: 'Green', hex: '#BBF7D0' },
  { name: 'Blue', hex: '#BFDBFE' },
  { name: 'Pink', hex: '#FBCFE8' },
  { name: 'Orange', hex: '#FED7AA' },
];

export const ReadScreen: React.FC = () => {
  const {
    currentTranslation,
    currentBook,
    currentChapterNum,
    targetVerse,
    chapterData,
    isLoading,
    error,
    isParallelMode,
    secondaryTranslation,
    secondaryChapterData,
    secondaryLoading,
    toggleParallelMode,
    setSecondaryTranslation,
    availableTranslations,
    setTranslation,
    navigateTo,
    nextChapter,
    prevChapter,
    bookmarkVerse,
    highlightVerse,
    addNoteToVerse,
  } = useBible();

  const {
    colors,
    spacing,
    radii,
    fonts,
    fontSizes,
    fontWeights,
    scriptureFontSize,
    setScriptureFontSize,
    scriptureLineHeight,
    readingColumn,
    themeName,
    setThemeName,
    scriptureFontStyle,
    setScriptureFontStyle,
    activeScriptureFontFamily,
  } = useTheme();

  // Appearance (font size & theme) modal
  const [appearanceModalVisible, setAppearanceModalVisible] = useState(false);

  // Navigation picker modal
  const [navPickerVisible, setNavPickerVisible] = useState(false);

  // Translation dropdown modal
  const [primaryTrModalVisible, setPrimaryTrModalVisible] = useState(false);
  const [secondaryTrModalVisible, setSecondaryTrModalVisible] = useState(false);

  // Tap-and-hold Action Sheet
  const [actionSheetVerse, setActionSheetVerse] = useState<number | null>(null);
  const [actionSheetVerseText, setActionSheetVerseText] = useState<string>('');

  // Active highlights & bookmarks for this chapter
  const [chapterHighlights, setChapterHighlights] = useState<Map<number, string>>(new Map());
  const [chapterBookmarks, setChapterBookmarks] = useState<Set<number>>(new Set());

  // Note Modal
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [noteText, setNoteText] = useState('');

  // Footnote Bottom Sheet
  const [activeFootnote, setActiveFootnote] = useState<Footnote | null>(null);

  // Multi-Platform Share & 3-Design Verse Card Modals
  const [selectedVerseForAction, setSelectedVerseForAction] = useState<VerseDataForCard | null>(null);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [cardModalVisible, setCardModalVisible] = useState(false);

  // Load chapter highlights & bookmarks
  const refreshUserAnnotations = async () => {
    try {
      const [allHl, allBm] = await Promise.all([
        getLocalHighlights(),
        getLocalBookmarks(),
      ]);

      const hlMap = new Map<number, string>();
      allHl.forEach((h: LocalHighlightRow) => {
        if (
          (h.book === chapterData?.bookName || h.book === chapterData?.bookCode) &&
          h.chapter === currentChapterNum
        ) {
          hlMap.set(h.verse, h.color);
        }
      });
      setChapterHighlights(hlMap);

      const bmSet = new Set<number>();
      allBm.forEach((b: LocalBookmarkRow) => {
        if (
          (b.book === chapterData?.bookName || b.book === chapterData?.bookCode) &&
          b.chapter === currentChapterNum
        ) {
          bmSet.add(b.verse);
        }
      });
      setChapterBookmarks(bmSet);
    } catch (e) {
      console.error('Failed to load annotations:', e);
    }
  };

  useEffect(() => {
    if (chapterData) {
      refreshUserAnnotations();
    }
  }, [chapterData, currentChapterNum]);

  // Audio Playback handler
  const handleStartAudio = () => {
    if (!chapterData?.verses || chapterData.verses.length === 0) return;
    const title = `${chapterData.bookName} ${chapterData.chapter} (${currentTranslation})`;
    ttsService.playChapter(title, chapterData.verses);
  };

  // Tap-and-hold handler
  const handleLongPressVerse = (verseNum: number, verseText: string) => {
    setActionSheetVerse(verseNum);
    setActionSheetVerseText(verseText);
  };

  const handleCopyVerse = async () => {
    if (actionSheetVerse === null) return;
    const ref = `${chapterData?.bookName} ${currentChapterNum}:${actionSheetVerse} (${currentTranslation})`;
    const formatted = `"${actionSheetVerseText}" — ${ref}`;
    await Clipboard.setStringAsync(formatted);
    Alert.alert('Copied to Clipboard', formatted);
    setActionSheetVerse(null);
  };

  const handleShareVerse = () => {
    if (actionSheetVerse === null) return;
    const ref = `${chapterData?.bookName} ${currentChapterNum}:${actionSheetVerse}`;
    setSelectedVerseForAction({
      text: actionSheetVerseText,
      reference: ref,
      translation: currentTranslation,
    });
    setActionSheetVerse(null);
    setShareModalVisible(true);
  };

  const handleApplyHighlight = async (color: string) => {
    if (actionSheetVerse === null) return;
    hapticMedium();
    await highlightVerse(actionSheetVerse, color);
    await refreshUserAnnotations();
    setActionSheetVerse(null);
  };

  const handleToggleBookmark = async () => {
    if (actionSheetVerse === null) return;
    hapticLight();
    await bookmarkVerse(actionSheetVerse);
    await refreshUserAnnotations();
    Alert.alert('Bookmarked', `Verse ${actionSheetVerse} saved to your library.`);
    setActionSheetVerse(null);
  };

  const handleSaveNote = async () => {
    if (actionSheetVerse !== null && noteText.trim()) {
      await addNoteToVerse(actionSheetVerse, noteText.trim());
      setNoteModalVisible(false);
      setNoteText('');
      setActionSheetVerse(null);
      Alert.alert('Note Saved', `Note attached to verse ${actionSheetVerse}.`);
    }
  };

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    topHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderColor: colors.borderLight,
      backgroundColor: colors.surface,
    },
    pickerPill: {
      minHeight: 44,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.md,
      borderRadius: radii.pill,
      gap: spacing.xs,
    },
    pickerPillText: { fontSize: fontSizes.sm, fontWeight: fontWeights.bold, color: colors.textPrimary, fontFamily: fonts.sans },
    headerRightActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    headerIconBtn: {
      minWidth: 44,
      minHeight: 44,
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.sm,
      borderRadius: radii.xl,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerIconLabel: { fontSize: fontSizes.xs, fontWeight: fontWeights.semibold, color: colors.textSecondary },
    activeHeaderBtn: { backgroundColor: colors.textPrimary, borderColor: colors.textPrimary },
    activeHeaderLabel: { color: colors.surface },
    transPill: {
      minHeight: 44,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.textPrimary,
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.md,
      borderRadius: radii.xl,
    },
    transPillText: { color: colors.surface, fontSize: fontSizes.xs, fontWeight: fontWeights.bold, fontFamily: fonts.sans },
    scrollArea: { flex: 1 },
    versesContainer: {
      paddingHorizontal: readingColumn?.paddingHorizontal || spacing.xl,
      paddingTop: spacing.xl,
      paddingBottom: 80,
      maxWidth: readingColumn?.maxWidth,
      alignSelf: 'center',
      width: '100%',
    },
    verseItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: spacing.sm,
      paddingHorizontal: spacing.xs,
      paddingVertical: spacing.xs / 2,
      borderRadius: radii.sm,
    },
    targetVerseHighlight: {
      backgroundColor: colors.warningLight,
      borderColor: colors.warning,
      borderWidth: 1,
    },
    verseHeaderInline: {
      width: 24,
      flexDirection: 'row',
      alignItems: 'center',
      paddingTop: spacing.xs,
    },
    superscript: {
      fontSize: scriptureFontSize * 0.6,
      fontWeight: fontWeights.extrabold,
      color: colors.verseNumber,
      lineHeight: (scriptureFontSize * 0.6) * 1.2,
      fontFamily: fonts.sans,
    },
    verseBody: {
      flex: 1,
      fontSize: scriptureFontSize,
      lineHeight: scriptureLineHeight,
      color: colors.scriptureText,
      fontFamily: activeScriptureFontFamily || fonts.serif,
      letterSpacing: 0.15,
    },
    footnoteMarker: {
      fontSize: fontSizes.xs,
      fontWeight: fontWeights.extrabold,
      color: colors.primary,
      lineHeight: 14,
      fontFamily: fonts.sans,
    },
    parallelContainer: { flexDirection: 'row', gap: spacing.md },
    parallelColumn: { flex: 1 },
    parallelDivider: { width: 1, backgroundColor: colors.borderLight },
    parallelColHeader: {
      paddingBottom: spacing.sm,
      marginBottom: spacing.md,
      borderBottomWidth: 1,
      borderColor: colors.borderLight,
    },
    parallelColTitle: { fontSize: fontSizes.sm, fontWeight: fontWeights.extrabold, color: colors.textSecondary, fontFamily: fonts.sans },
    secondaryTrPicker: {
      backgroundColor: colors.surfaceElevated,
      alignSelf: 'flex-start',
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.sm,
      borderRadius: radii.md,
    },
    secondaryTrText: { fontSize: fontSizes.xs, fontWeight: fontWeights.bold, color: colors.textPrimary, fontFamily: fonts.sans },
    copyrightText: {
      fontSize: fontSizes.xs,
      color: colors.textTertiary,
      marginTop: spacing.xl,
      fontStyle: 'italic',
      fontFamily: fonts.sans,
    },
    navRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: spacing.xxl,
    },
    navBtn: {
      backgroundColor: colors.surfaceElevated,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    disabledBtn: { opacity: 0.35 },
    navBtnText: { fontSize: fontSizes.sm, fontWeight: fontWeights.semibold, color: colors.textPrimary, fontFamily: fonts.sans },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
    loadingText: { marginTop: spacing.md, fontSize: fontSizes.sm, color: colors.textSecondary, fontFamily: fonts.sans },
    errorTitle: { fontSize: fontSizes.lg, fontWeight: fontWeights.bold, color: colors.error, marginBottom: spacing.sm },
    errorDesc: { fontSize: fontSizes.sm, color: colors.error, textAlign: 'center', marginBottom: spacing.md, fontFamily: fonts.sans },
    retryBtn: { backgroundColor: colors.textPrimary, paddingVertical: spacing.md, paddingHorizontal: spacing.lg, borderRadius: radii.md },
    retryBtnText: { color: colors.surface, fontWeight: fontWeights.semibold, fontFamily: fonts.sans },
    emptyText: { textAlign: 'center', marginTop: 40, color: colors.textTertiary, fontFamily: fonts.sans },
    modalOverlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: 'flex-end',
    },
    actionSheetContent: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: radii.xl,
      borderTopRightRadius: radii.xl,
      padding: spacing.xl,
      paddingBottom: spacing.xxxl,
    },
    sheetTopBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    sheetVerseRef: { fontSize: fontSizes.lg, fontWeight: fontWeights.extrabold, color: colors.textPrimary, fontFamily: fonts.sans },
    sheetVersePreview: { fontSize: fontSizes.sm, color: colors.textSecondary, fontStyle: 'italic', marginBottom: spacing.lg, fontFamily: fonts.sans },
    sheetSectionLabel: { fontSize: fontSizes.xs, fontWeight: fontWeights.extrabold, color: colors.textTertiary, letterSpacing: 0.6, marginBottom: spacing.sm, fontFamily: fonts.sans },
    paletteRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
    paletteDot: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: colors.borderLight },
    clearPaletteDot: {
      width: 34,
      height: 34,
      borderRadius: 17,
      borderWidth: 1,
      borderColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    sheetActionsList: { borderTopWidth: 1, borderColor: colors.borderLight, paddingTop: spacing.md, gap: spacing.sm },
    sheetActionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.md,
      gap: spacing.md,
    },
    sheetActionText: { fontSize: fontSizes.md, fontWeight: fontWeights.semibold, color: colors.textPrimary, fontFamily: fonts.sans },
    footnoteSheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: radii.lg,
      borderTopRightRadius: radii.lg,
      padding: spacing.xl,
      paddingBottom: spacing.xxxl,
    },
    footnoteBody: { fontSize: fontSizes.md, color: colors.textPrimary, lineHeight: 22, marginVertical: spacing.lg, fontFamily: fonts.sans },
    doneBtn: {
      backgroundColor: colors.textPrimary,
      paddingVertical: spacing.md,
      borderRadius: radii.md,
      alignItems: 'center',
    },
    doneBtnText: { color: colors.surface, fontWeight: fontWeights.bold, fontSize: fontSizes.sm, fontFamily: fonts.sans },
    noteModalContent: {
      backgroundColor: colors.surface,
      borderRadius: radii.xl,
      padding: spacing.xl,
      margin: spacing.xl,
    },
    noteModalTitle: { fontSize: fontSizes.lg, fontWeight: fontWeights.bold, color: colors.textPrimary, marginBottom: spacing.md, fontFamily: fonts.sans },
    noteInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.md,
      padding: spacing.md,
      height: 110,
      textAlignVertical: 'top',
      fontSize: fontSizes.sm,
      marginBottom: spacing.md,
      fontFamily: fonts.sans,
      color: colors.textPrimary,
    },
    noteButtonsRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm },
    cancelBtn: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
    cancelBtnText: { color: colors.textSecondary, fontWeight: fontWeights.semibold, fontFamily: fonts.sans },
    saveBtn: { backgroundColor: colors.textPrimary, paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, borderRadius: radii.sm },
    saveBtnText: { color: colors.surface, fontWeight: fontWeights.semibold, fontFamily: fonts.sans },
    trModalContent: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: radii.xl,
      borderTopRightRadius: radii.xl,
      padding: spacing.xl,
      paddingBottom: spacing.xxxl,
    },
    trModalTitle: { fontSize: fontSizes.lg, fontWeight: fontWeights.extrabold, color: colors.textPrimary, marginBottom: spacing.lg, fontFamily: fonts.sans },
    trRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderColor: colors.borderLight,
    },
    selectedTrRow: { backgroundColor: colors.surfaceElevated, borderRadius: radii.md, paddingHorizontal: spacing.sm },
    trRowName: { fontSize: fontSizes.sm, fontWeight: fontWeights.bold, color: colors.textPrimary, fontFamily: fonts.sans },
    trRowDesc: { fontSize: fontSizes.xs, color: colors.textSecondary, marginTop: 2, fontFamily: fonts.sans },
    freePill: {
      backgroundColor: colors.successLight,
      color: colors.success,
      fontWeight: fontWeights.extrabold,
      fontSize: fontSizes.xs,
      paddingVertical: 3,
      paddingHorizontal: spacing.sm,
      borderRadius: radii.sm,
      overflow: 'hidden',
    },
    closeTrBtn: {
      marginTop: spacing.lg,
      backgroundColor: colors.textPrimary,
      paddingVertical: spacing.md,
      borderRadius: radii.md,
      alignItems: 'center',
    },
    closeTrBtnText: { color: colors.surface, fontWeight: fontWeights.bold, fontSize: fontSizes.sm, fontFamily: fonts.sans },
    appearanceBtnText: {
      fontSize: fontSizes.sm,
      fontWeight: fontWeights.bold,
      color: colors.textPrimary,
      fontFamily: fonts.serif,
    },
    appearanceModalContent: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: radii.xl,
      borderTopRightRadius: radii.xl,
      padding: spacing.xl,
      paddingBottom: spacing.xxxl,
    },
    appearanceSectionTitle: {
      fontSize: fontSizes.xs,
      fontWeight: fontWeights.bold,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      marginBottom: spacing.md,
    },
    fontSizeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surfaceElevated,
      borderRadius: radii.lg,
      padding: spacing.sm,
      marginBottom: spacing.xl,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    fontAdjustBtn: {
      width: 44,
      height: 44,
      borderRadius: radii.md,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    fontSizeDisplay: {
      alignItems: 'center',
    },
    fontSizeNumber: {
      fontSize: fontSizes.bodyLarge,
      fontWeight: fontWeights.bold,
      color: colors.textPrimary,
    },
    fontSizeLabel: {
      fontSize: fontSizes.caption,
      color: colors.textTertiary,
      marginTop: 2,
    },
    themeSelectorRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
      marginBottom: spacing.xl,
    },
    themeChip: {
      width: '31%',
      paddingVertical: spacing.sm,
      paddingHorizontal: 4,
      borderRadius: radii.md,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceElevated,
    },
    themeChipActive: {
      borderColor: colors.textPrimary,
      backgroundColor: colors.surface,
      borderWidth: 2,
    },
    themeChipText: {
      fontSize: fontSizes.xs,
      fontWeight: fontWeights.semibold,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    themeChipTextActive: {
      color: colors.textPrimary,
      fontWeight: fontWeights.bold,
    },
    fontStyleSelectorRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
      marginBottom: spacing.md,
    },
    fontStyleModalChip: {
      paddingVertical: 6,
      paddingHorizontal: spacing.sm,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceElevated,
    },
    fontStyleModalChipActive: {
      borderColor: colors.primary,
      backgroundColor: colors.surface,
      borderWidth: 2,
    },
    fontStyleModalChipText: {
      fontSize: fontSizes.caption,
      fontWeight: fontWeights.semibold,
      color: colors.textSecondary,
    },
    fontStyleModalChipTextActive: {
      color: colors.textPrimary,
      fontWeight: fontWeights.bold,
    },
    samplePreviewText: {
      fontFamily: activeScriptureFontFamily || fonts.serif,
      fontSize: scriptureFontSize,
      lineHeight: scriptureLineHeight,
      color: colors.scriptureText,
      textAlign: 'center',
      marginVertical: spacing.md,
      fontStyle: 'italic',
    },
  }), [colors, spacing, radii, fonts, fontSizes, fontWeights, scriptureFontSize, scriptureLineHeight, readingColumn, activeScriptureFontFamily]);

  return (
    <View style={styles.container}>
      {/* Sleek, Uncluttered Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.pickerPill}
          onPress={() => setNavPickerVisible(true)}
          accessibilityRole="button"
          accessibilityLabel={`Select book and chapter. Currently reading ${chapterData?.bookName || currentBook} chapter ${currentChapterNum}`}
        >
          <Text style={styles.pickerPillText}>
            {chapterData?.bookName || currentBook} {currentChapterNum}
          </Text>
          <Ionicons name="chevron-down" size={12} color={colors.textSecondary} />
        </TouchableOpacity>

        <View style={styles.headerRightActions}>
          {/* Appearance / Font Size & Theme */}
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => setAppearanceModalVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Adjust reading appearance, font size, and themes"
          >
            <Text style={styles.appearanceBtnText}>Aa</Text>
          </TouchableOpacity>

          {/* Audio Button */}
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={handleStartAudio}
            accessibilityRole="button"
            accessibilityLabel="Listen to audio Bible narration of current chapter"
          >
            <Ionicons name="volume-high-outline" size={16} color={colors.textPrimary} />
          </TouchableOpacity>

          {/* Parallel Mode Toggle */}
          <TouchableOpacity
            style={[styles.headerIconBtn, isParallelMode && styles.activeHeaderBtn]}
            onPress={toggleParallelMode}
            accessibilityRole="button"
            accessibilityLabel="Toggle parallel translation view"
          >
            <Text style={[styles.headerIconLabel, isParallelMode && styles.activeHeaderLabel]}>
              || Parallel
            </Text>
          </TouchableOpacity>

          {/* Primary Translation Pill */}
          <TouchableOpacity
            style={styles.transPill}
            onPress={() => setPrimaryTrModalVisible(true)}
            accessibilityRole="button"
            accessibilityLabel={`Select translation. Currently reading ${currentTranslation}`}
          >
            <Text style={styles.transPillText}>{currentTranslation}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Chapter Content */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.textPrimary} />
          <Text style={styles.loadingText}>Loading chapter...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorTitle}>Error Loading Chapter</Text>
          <Text style={styles.errorDesc}>{error}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => navigateTo('GEN', 1, 'KJV')}
          >
            <Text style={styles.retryBtnText}>Read Free Offline KJV</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.scrollArea} contentContainerStyle={styles.versesContainer}>
          {/* Single or Parallel Mode Rendering */}
          {isParallelMode ? (
            <View style={styles.parallelContainer}>
              {/* Primary Column */}
              <View style={styles.parallelColumn}>
                <View style={styles.parallelColHeader}>
                  <Text style={styles.parallelColTitle}>{currentTranslation}</Text>
                </View>
                {chapterData?.verses.map(v => renderVerseRow(v, currentTranslation))}
              </View>

              <View style={styles.parallelDivider} />

              {/* Secondary Column */}
              <View style={styles.parallelColumn}>
                <View style={styles.parallelColHeader}>
                  <TouchableOpacity
                    style={styles.secondaryTrPicker}
                    onPress={() => setSecondaryTrModalVisible(true)}
                  >
                    <Text style={styles.secondaryTrText}>{secondaryTranslation} ▾</Text>
                  </TouchableOpacity>
                </View>

                {secondaryLoading ? (
                  <ActivityIndicator size="small" color={colors.textPrimary} style={{ marginTop: 20 }} />
                ) : (
                  secondaryChapterData?.verses.map(v =>
                    renderVerseRow(v, secondaryTranslation, true)
                  )
                )}
              </View>
            </View>
          ) : (
            <View>
              {chapterData?.verses && chapterData.verses.length > 0 ? (
                chapterData.verses.map(v => renderVerseRow(v, currentTranslation))
              ) : (
                <Text style={styles.emptyText}>No verses available for this chapter.</Text>
              )}
            </View>
          )}

          {chapterData?.copyright && (
            <Text style={styles.copyrightText}>{chapterData.copyright}</Text>
          )}

          {/* Chapter Navigation Buttons */}
          <View style={styles.navRow}>
            <TouchableOpacity
              style={[styles.navBtn, currentChapterNum <= 1 && styles.disabledBtn]}
              onPress={prevChapter}
              disabled={currentChapterNum <= 1}
              accessibilityRole="button"
              accessibilityLabel="Previous Chapter"
              accessibilityState={{ disabled: currentChapterNum <= 1 }}
            >
              <Text style={styles.navBtnText}>‹ Previous Chapter</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navBtn}
              onPress={nextChapter}
              accessibilityRole="button"
              accessibilityLabel="Next Chapter"
            >
              <Text style={styles.navBtnText}>Next Chapter ›</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* Floating Audio Player */}
      <AudioPlayerBar />

      {/* Book / Chapter / Verse Picker Modal */}
      <BibleNavigationPicker
        visible={navPickerVisible}
        currentBookCode={currentBook}
        currentChapter={currentChapterNum}
        onClose={() => setNavPickerVisible(false)}
        onSelect={(bk, ch, v) => navigateTo(bk, ch, currentTranslation, v)}
      />

      {/* Tap-and-Hold Quick Action Sheet */}
      <Modal visible={actionSheetVerse !== null} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.actionSheetContent}>
            <View style={styles.sheetTopBar}>
              <Text style={styles.sheetVerseRef}>
                {chapterData?.bookName} {currentChapterNum}:{actionSheetVerse}
              </Text>
              <TouchableOpacity onPress={() => setActionSheetVerse(null)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.sheetVersePreview} numberOfLines={2}>
              "{actionSheetVerseText}"
            </Text>

            {/* Highlight Color Palette */}
            <Text style={styles.sheetSectionLabel}>HIGHLIGHT</Text>
            <View style={styles.paletteRow}>
              {HIGHLIGHT_COLORS.map(c => (
                <TouchableOpacity
                  key={c.name}
                  style={[styles.paletteDot, { backgroundColor: c.hex }]}
                  onPress={() => handleApplyHighlight(c.hex)}
                />
              ))}
              <TouchableOpacity
                style={styles.clearPaletteDot}
                onPress={() => handleApplyHighlight('transparent')}
              >
                <Ionicons name="close" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Quick Actions List */}
            <View style={styles.sheetActionsList}>
              <TouchableOpacity style={styles.sheetActionBtn} onPress={handleToggleBookmark}>
                <Ionicons name={chapterBookmarks.has(actionSheetVerse || 0) ? "bookmark" : "bookmark-outline"} size={22} color={colors.textPrimary} />
                <Text style={styles.sheetActionText}>
                  {chapterBookmarks.has(actionSheetVerse || 0)
                    ? 'Remove Bookmark'
                    : 'Bookmark Verse'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sheetActionBtn}
                onPress={() => setNoteModalVisible(true)}
              >
                <Ionicons name="create-outline" size={22} color={colors.textPrimary} />
                <Text style={styles.sheetActionText}>Add Note</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.sheetActionBtn} onPress={handleCopyVerse}>
                <Ionicons name="copy-outline" size={22} color={colors.textPrimary} />
                <Text style={styles.sheetActionText}>Copy Reference & Text</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.sheetActionBtn} onPress={handleShareVerse}>
                <Ionicons name="share-social-outline" size={22} color={colors.textPrimary} />
                <Text style={styles.sheetActionText}>Share Scripture</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sheetActionBtn}
                onPress={() => {
                  const ref = `${chapterData?.bookName} ${currentChapterNum}:${actionSheetVerse}`;
                  setSelectedVerseForAction({
                    text: actionSheetVerseText,
                    reference: ref,
                    translation: currentTranslation,
                  });
                  setActionSheetVerse(null);
                  setCardModalVisible(true);
                }}
              >
                <Ionicons name="images-outline" size={22} color={colors.accent} />
                <Text style={[styles.sheetActionText, { color: colors.accent }]}>
                  Download Card (3 Designs)
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Footnote Sheet */}
      <Modal visible={activeFootnote !== null} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.footnoteSheet}>
            <View style={styles.sheetTopBar}>
              <Text style={styles.sheetVerseRef}>Footnote [{activeFootnote?.marker}]</Text>
              <TouchableOpacity onPress={() => setActiveFootnote(null)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.footnoteBody}>{activeFootnote?.text}</Text>
            <TouchableOpacity
              style={styles.doneBtn}
              onPress={() => setActiveFootnote(null)}
            >
              <Text style={styles.doneBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Note Composer Modal */}
      <Modal visible={noteModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.noteModalContent}>
            <Text style={styles.noteModalTitle}>
              Note on {chapterData?.bookName} {currentChapterNum}:{actionSheetVerse}
            </Text>
            <TextInput
              style={styles.noteInput}
              multiline
              placeholder="Record your insights, prayer, or study reflections..."
              placeholderTextColor={colors.textTertiary}
              value={noteText}
              onChangeText={setNoteText}
            />
            <View style={styles.noteButtonsRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setNoteModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveNote}>
                <Text style={styles.saveBtnText}>Save Note</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Appearance / Font Size & Theme Bottom Sheet Modal */}
      <Modal visible={appearanceModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.appearanceModalContent}>
            <View style={styles.sheetTopBar}>
              <Text style={styles.sheetVerseRef}>Reading Appearance</Text>
              <TouchableOpacity onPress={() => setAppearanceModalVisible(false)}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Font Size Stepper / Slider */}
            <Text style={styles.appearanceSectionTitle}>Scripture Text Size</Text>
            <View style={styles.fontSizeRow}>
              <TouchableOpacity
                style={styles.fontAdjustBtn}
                onPress={() => setScriptureFontSize(Math.max(15, scriptureFontSize - 1))}
              >
                <Ionicons name="remove" size={20} color={colors.textPrimary} />
              </TouchableOpacity>

              <View style={styles.fontSizeDisplay}>
                <Text style={styles.fontSizeNumber}>{scriptureFontSize}px</Text>
                <Text style={styles.fontSizeLabel}>Comfort Scale</Text>
              </View>

              <TouchableOpacity
                style={styles.fontAdjustBtn}
                onPress={() => setScriptureFontSize(Math.min(28, scriptureFontSize + 1))}
              >
                <Ionicons name="add" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Typeface / Font Style Selector */}
            <Text style={styles.appearanceSectionTitle}>Typeface (Font Style)</Text>
            <View style={styles.fontStyleSelectorRow}>
              {(Object.keys(FONT_STYLES) as FontStyleId[]).map(styleKey => {
                const opt = FONT_STYLES[styleKey];
                const isActive = scriptureFontStyle === styleKey;
                return (
                  <TouchableOpacity
                    key={styleKey}
                    style={[styles.fontStyleModalChip, isActive && styles.fontStyleModalChipActive]}
                    onPress={() => {
                      hapticSelection();
                      setScriptureFontStyle(styleKey);
                    }}
                  >
                    <Text
                      style={[
                        styles.fontStyleModalChipText,
                        isActive && styles.fontStyleModalChipTextActive,
                        opt.fontFamily ? { fontFamily: opt.fontFamily } : undefined,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Live Sample Preview */}
            <Text style={styles.samplePreviewText} numberOfLines={2}>
              "Thy word is a lamp unto my feet, and a light unto my path."
            </Text>

            {/* Theme Selector (6 Eye-Friendly Modes) */}
            <Text style={styles.appearanceSectionTitle}>Theme & Contrast</Text>
            <View style={styles.themeSelectorRow}>
              {(Object.keys(THEMES) as ThemeName[]).map(t => (
                <TouchableOpacity
                  key={t}
                  style={[styles.themeChip, themeName === t && styles.themeChipActive]}
                  onPress={() => {
                    hapticSelection();
                    setThemeName(t);
                  }}
                >
                  <Text
                    style={[styles.themeChipText, themeName === t && styles.themeChipTextActive]}
                    numberOfLines={1}
                  >
                    {THEME_LABELS[t]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.doneBtn}
              onPress={() => setAppearanceModalVisible(false)}
            >
              <Text style={styles.doneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Primary Translation Picker Modal */}
      {renderTranslationModal(
        primaryTrModalVisible,
        () => setPrimaryTrModalVisible(false),
        (tr) => setTranslation(tr, true),
        currentTranslation,
        'Select Primary Translation'
      )}

      {/* Secondary Translation Picker Modal (for Parallel Mode) */}
      {renderTranslationModal(
        secondaryTrModalVisible,
        () => setSecondaryTrModalVisible(false),
        (tr) => setSecondaryTranslation(tr),
        secondaryTranslation,
        'Select Secondary Parallel Translation'
      )}

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
    </View>
  );

  // Helper to render individual verse rows with superscripts and highlights
  function renderVerseRow(
    v: { verse: number; text: string; cleanText?: string; footnotes?: Footnote[] },
    tr: string,
    isSecondary = false
  ) {
    const isTarget = targetVerse === v.verse;
    const highlightColor = chapterHighlights.get(v.verse);
    const isBookmarked = chapterBookmarks.has(v.verse);
    const displayBody = v.cleanText || v.text;

    return (
      <TouchableOpacity
        key={`${tr}_${v.verse}`}
        activeOpacity={0.7}
        onLongPress={() => handleLongPressVerse(v.verse, displayBody)}
        accessibilityRole="button"
        accessibilityLabel={`Verse ${v.verse}. ${displayBody}. Long press for actions.`}
        accessibilityHint="Long press to bookmark, highlight, add note, or share this verse"
        style={[
          styles.verseItem,
          highlightColor && highlightColor !== 'transparent' && { backgroundColor: highlightColor },
          isTarget && styles.targetVerseHighlight,
        ]}
      >
        <View style={styles.verseHeaderInline}>
          {/* Small Superscript Verse Number */}
          <Text style={styles.superscript}>{v.verse}</Text>
          {isBookmarked && !isSecondary && <Ionicons name="bookmark" size={10} color={colors.textSecondary} style={{ marginLeft: 2 }} />}
        </View>

        <Text style={styles.verseBody}>
          {displayBody}
          {/* Footnote Markers */}
          {v.footnotes &&
            v.footnotes.map(fn => (
              <Text
                key={fn.id}
                style={styles.footnoteMarker}
                onPress={() => setActiveFootnote(fn)}
              >
                {' '}[{fn.marker}]
              </Text>
            ))}
        </Text>
      </TouchableOpacity>
    );
  }

  // Translation Modal helper
  function renderTranslationModal(
    visible: boolean,
    onClose: () => void,
    onSelect: (id: string) => void,
    currentSelectedId: string,
    title: string
  ) {
    return (
      <Modal visible={visible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.trModalContent}>
            <Text style={styles.trModalTitle}>{title}</Text>
            <ScrollView style={{ maxHeight: 360 }}>
              {availableTranslations.map(tr => (
                <TouchableOpacity
                  key={tr.id}
                  style={[
                    styles.trRow,
                    currentSelectedId === tr.id && styles.selectedTrRow,
                  ]}
                  onPress={() => {
                    onSelect(tr.id);
                    onClose();
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.trRowName}>
                      {tr.abbreviation} • {tr.name}
                    </Text>
                    <Text style={styles.trRowDesc}>
                      {tr.isLocal ? 'Bundled Offline (SQLite)' : 'API.Bible REST API'}
                    </Text>
                  </View>
                  {tr.isLocal && <Text style={styles.freePill}>OFFLINE</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.closeTrBtn} onPress={onClose}>
              <Text style={styles.closeTrBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }
};
