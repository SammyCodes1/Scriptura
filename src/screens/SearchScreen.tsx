import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { useBible } from '../context/BibleContext';
import { useTheme } from '../context/ThemeContext';
import { EmptyState } from '../components/EmptyState';
import { Ionicons } from '@expo/vector-icons';
import { bibleProvider } from '../services/bible/BibleProvider';
import { SearchVerseResult } from '../services/bible/types';
import { parseScriptureReference } from '../utils/referenceParser';
import { ShareScriptureModal } from '../components/ShareScriptureModal';
import { VerseCardModal } from '../components/VerseCardModal';
import { VerseDataForCard } from '../services/export/verseCardService';
import { hapticLight, hapticSelection } from '../utils/haptics';

export const SearchScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { currentTranslation, navigateTo } = useBible();
  const { colors, spacing, radii, fontSizes, fontWeights, fonts } = useTheme();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchVerseResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [searchAllTranslations, setSearchAllTranslations] = useState(false);
  const [activeTestamentFilter, setActiveTestamentFilter] = useState<'ALL' | 'OT' | 'NT'>('ALL');

  // Modals for sharing & card downloading
  const [selectedVerseForAction, setSelectedVerseForAction] = useState<VerseDataForCard | null>(null);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [cardModalVisible, setCardModalVisible] = useState(false);

  const directRef = useMemo(() => {
    return parseScriptureReference(query);
  }, [query]);

  const handleSearch = async () => {
    if (!query.trim() || query.trim().length < 2) return;
    setIsSearching(true);
    setSearched(true);
    try {
      const res = await bibleProvider.search(
        currentTranslation,
        query.trim(),
        150,
        searchAllTranslations
      );
      setResults(res);
      setActiveTestamentFilter('ALL');
    } catch (e) {
      console.error('Search error:', e);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleJumpDirect = async () => {
    if (directRef) {
      await navigateTo(directRef.book.code, directRef.chapter, currentTranslation, directRef.verse);
      navigation.navigate('Read');
    }
  };

  const handleSelectResult = async (item: SearchVerseResult) => {
    await navigateTo(item.bookCode, item.chapter, item.translation, item.verse);
    navigation.navigate('Read');
  };

  // Old and New Testament separation
  const otResults = useMemo(() => results.filter(r => r.testament === 'OT'), [results]);
  const ntResults = useMemo(() => results.filter(r => r.testament === 'NT'), [results]);

  const filteredResults = useMemo(() => {
    if (activeTestamentFilter === 'OT') return otResults;
    if (activeTestamentFilter === 'NT') return ntResults;
    return results;
  }, [results, otResults, ntResults, activeTestamentFilter]);

  const groupedResults = useMemo(() => {
    const groups: Record<
      string,
      { bookName: string; testament?: 'OT' | 'NT'; items: SearchVerseResult[] }
    > = {};
    for (const r of filteredResults) {
      if (!groups[r.bookName]) {
        groups[r.bookName] = { bookName: r.bookName, testament: r.testament, items: [] };
      }
      groups[r.bookName].items.push(r);
    }
    return groups;
  }, [filteredResults]);

  const groupKeys = Object.keys(groupedResults);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.background },
        searchBar: {
          flexDirection: 'row',
          padding: spacing.lg,
          backgroundColor: colors.surface,
          borderBottomWidth: 1,
          borderColor: colors.border,
          gap: spacing.sm,
        },
        input: {
          flex: 1,
          backgroundColor: colors.surfaceElevated,
          borderRadius: radii.md,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          fontSize: fontSizes.sm,
          color: colors.textPrimary,
        },
        searchBtn: {
          backgroundColor: colors.primary,
          minHeight: 44,
          paddingHorizontal: spacing.lg,
          justifyContent: 'center',
          borderRadius: radii.md,
        },
        searchBtnText: { color: colors.primaryText, fontWeight: fontWeights.semibold, fontSize: fontSizes.sm },
        directJumpCard: {
          backgroundColor: colors.primary,
          marginHorizontal: spacing.lg,
          marginTop: spacing.md,
          padding: spacing.md,
          borderRadius: radii.md,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
        directJumpContent: { flex: 1 },
        directJumpLabel: { color: colors.warning, fontSize: fontSizes.xs, fontWeight: fontWeights.extrabold, letterSpacing: 0.6 },
        directJumpTitle: { color: colors.primaryText, fontSize: fontSizes.sm, fontWeight: fontWeights.bold, marginTop: 2 },
        filterBar: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.sm,
          backgroundColor: colors.surface,
          borderBottomWidth: 1,
          borderColor: colors.border,
        },
        filterText: { fontSize: fontSizes.xs, color: colors.textSecondary, fontWeight: fontWeights.semibold },
        testamentStatsBar: {
          backgroundColor: colors.surfaceElevated,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.sm,
          borderBottomWidth: 1,
          borderColor: colors.borderLight,
        },
        statsText: {
          fontSize: fontSizes.xs,
          color: colors.textSecondary,
          fontWeight: fontWeights.medium,
          marginBottom: spacing.xs,
        },
        testamentTabsRow: {
          flexDirection: 'row',
          gap: spacing.xs,
        },
        testamentTab: {
          minHeight: 44,
          justifyContent: 'center',
          paddingVertical: 5,
          paddingHorizontal: spacing.md,
          borderRadius: radii.pill,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
        },
        testamentTabActive: {
          backgroundColor: colors.primary,
          borderColor: colors.primary,
        },
        testamentTabText: {
          fontSize: fontSizes.xs,
          fontWeight: fontWeights.semibold,
          color: colors.textSecondary,
        },
        testamentTabTextActive: {
          color: colors.primaryText,
          fontWeight: fontWeights.bold,
        },
        scrollArea: { flex: 1 },
        listContainer: { padding: spacing.lg, paddingBottom: spacing.xxxl },
        center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
        searchingText: { marginTop: 10, color: colors.textSecondary, fontSize: fontSizes.sm },
        bookGroup: { marginBottom: spacing.lg },
        bookGroupHeader: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: spacing.sm,
          paddingBottom: 4,
          borderBottomWidth: 1,
          borderColor: colors.borderLight,
        },
        bookTitleRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xs,
        },
        bookGroupTitle: { fontSize: fontSizes.md, fontWeight: fontWeights.extrabold, color: colors.textPrimary },
        bookGroupBadge: { fontSize: fontSizes.xs, color: colors.textSecondary, fontWeight: fontWeights.semibold },
        resultCard: {
          backgroundColor: colors.surface,
          borderRadius: radii.lg,
          padding: spacing.md,
          marginBottom: spacing.sm,
          borderWidth: 1,
          borderColor: colors.border,
        },
        resultHeader: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 6,
        },
        refBadge: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xs,
          flexWrap: 'wrap',
        },
        reference: {
          fontWeight: fontWeights.bold,
          color: colors.textPrimary,
          fontSize: fontSizes.sm,
        },
        testamentPill: {
          paddingHorizontal: 6,
          paddingVertical: 2,
          borderRadius: radii.sm,
        },
        testamentPillText: {
          fontSize: 10,
          fontWeight: fontWeights.bold,
        },
        otPill: {
          backgroundColor: colors.warningLight,
        },
        otPillText: {
          color: colors.warningText,
          fontSize: 10,
          fontWeight: fontWeights.bold,
        },
        ntPill: {
          backgroundColor: colors.accentLight,
        },
        ntPillText: {
          color: colors.accent,
          fontSize: 10,
          fontWeight: fontWeights.bold,
        },
        trBadge: {
          backgroundColor: colors.surfaceElevated,
          paddingHorizontal: 6,
          paddingVertical: 2,
          borderRadius: radii.sm,
          borderWidth: 1,
          borderColor: colors.borderLight,
        },
        trBadgeText: {
          fontSize: 10,
          fontWeight: fontWeights.bold,
          color: colors.textSecondary,
        },
        verseText: {
          fontSize: fontSizes.sm,
          color: colors.scriptureText,
          lineHeight: 20,
          fontFamily: fonts.serif,
          marginBottom: spacing.sm,
        },
        resultActionsBar: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: spacing.sm,
          paddingTop: spacing.xs,
          borderTopWidth: 1,
          borderTopColor: colors.borderLight,
        },
        actionBtn: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 44,
          gap: 4,
          paddingVertical: 4,
          paddingHorizontal: spacing.md,
          borderRadius: radii.sm,
          backgroundColor: colors.surfaceElevated,
        },
        actionBtnText: {
          fontSize: fontSizes.caption,
          fontWeight: fontWeights.semibold,
          color: colors.textPrimary,
        },
      }),
    [colors, spacing, radii, fontSizes, fontWeights, fonts]
  );

  return (
    <View style={styles.container}>
      {/* Search Header Bar */}
      <View style={styles.searchBar}>
        <TextInput
          style={styles.input}
          placeholder={`Search keywords e.g. "love", "peace" or "John 3:16"...`}
          placeholderTextColor={colors.textTertiary}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
          clearButtonMode="while-editing"
          accessibilityLabel="Search keywords or scripture reference input"
        />
        <TouchableOpacity
          style={styles.searchBtn}
          onPress={handleSearch}
          accessibilityRole="button"
          accessibilityLabel="Search scripture text"
        >
          <Text style={styles.searchBtnText}>Search</Text>
        </TouchableOpacity>
      </View>

      {/* Direct Verse Reference Match Card */}
      {directRef && (
        <TouchableOpacity
          style={styles.directJumpCard}
          onPress={handleJumpDirect}
          accessibilityRole="button"
          accessibilityLabel={`Direct match: Jump straight to ${directRef.displayText} in ${currentTranslation}`}
        >
          <View style={styles.directJumpContent}>
            <Text style={styles.directJumpLabel}>DIRECT SCRIPTURE MATCH</Text>
            <Text style={styles.directJumpTitle}>
              Jump straight to {directRef.displayText} ({currentTranslation})
            </Text>
          </View>
          <Ionicons name="arrow-forward" size={18} color={colors.primaryText} />
        </TouchableOpacity>
      )}

      {/* Search All Translations Switch */}
      <View style={styles.filterBar}>
        <Text style={styles.filterText}>
          Search all downloaded versions:
        </Text>
        <Switch
          value={searchAllTranslations}
          onValueChange={setSearchAllTranslations}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={colors.surface}
          accessibilityLabel="Search across all downloaded translations"
        />
      </View>

      {/* Keyword Breakdown: Old Testament & New Testament Segment Filter Bar */}
      {results.length > 0 && (
        <View style={styles.testamentStatsBar}>
          <Text style={styles.statsText}>
            Found {results.length} verses • {otResults.length} in Old Testament, {ntResults.length} in New Testament
          </Text>
          <View style={styles.testamentTabsRow}>
            <TouchableOpacity
              style={[
                styles.testamentTab,
                activeTestamentFilter === 'ALL' && styles.testamentTabActive,
              ]}
              accessibilityRole="tab"
              accessibilityLabel={`Show all ${results.length} verses`}
              accessibilityState={{ selected: activeTestamentFilter === 'ALL' }}
              onPress={() => {
                hapticSelection();
                setActiveTestamentFilter('ALL');
              }}
            >
              <Text
                style={[
                  styles.testamentTabText,
                  activeTestamentFilter === 'ALL' && styles.testamentTabTextActive,
                ]}
              >
                All ({results.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.testamentTab,
                activeTestamentFilter === 'OT' && styles.testamentTabActive,
              ]}
              accessibilityRole="tab"
              accessibilityLabel={`Filter to Old Testament: ${otResults.length} verses`}
              accessibilityState={{ selected: activeTestamentFilter === 'OT' }}
              onPress={() => {
                hapticSelection();
                setActiveTestamentFilter('OT');
              }}
            >
              <Text
                style={[
                  styles.testamentTabText,
                  activeTestamentFilter === 'OT' && styles.testamentTabTextActive,
                ]}
              >
                Old Testament ({otResults.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.testamentTab,
                activeTestamentFilter === 'NT' && styles.testamentTabActive,
              ]}
              accessibilityRole="tab"
              accessibilityLabel={`Filter to New Testament: ${ntResults.length} verses`}
              accessibilityState={{ selected: activeTestamentFilter === 'NT' }}
              onPress={() => {
                hapticSelection();
                setActiveTestamentFilter('NT');
              }}
            >
              <Text
                style={[
                  styles.testamentTabText,
                  activeTestamentFilter === 'NT' && styles.testamentTabTextActive,
                ]}
              >
                New Testament ({ntResults.length})
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Main Results Scroll Area */}
      {isSearching ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.searchingText}>Searching Holy Scriptures...</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollArea} contentContainerStyle={styles.listContainer}>
          {searched && results.length === 0 && !directRef && (
            <EmptyState
              icon="search-outline"
              title="No results found"
              message={`No scriptures found containing "${query}". Try another word or translation.`}
            />
          )}

          {!searched && !directRef && (
            <EmptyState
              icon="search-outline"
              title="Search the Scriptures"
              message="Enter any keyword (e.g. 'faith', 'love', 'grace') to search across both Old and New Testaments."
            />
          )}

          {groupKeys.map(bookName => {
            const group = groupedResults[bookName];
            return (
              <View key={bookName} style={styles.bookGroup}>
                {/* Book Header with Testament Indicator */}
                <View style={styles.bookGroupHeader}>
                  <View style={styles.bookTitleRow}>
                    <Text style={styles.bookGroupTitle}>{bookName}</Text>
                    <View
                      style={[
                        styles.testamentPill,
                        group.testament === 'OT' ? styles.otPill : styles.ntPill,
                      ]}
                    >
                      <Text
                        style={[
                          styles.testamentPillText,
                          group.testament === 'OT' ? styles.otPillText : styles.ntPillText,
                        ]}
                      >
                        {group.testament === 'OT' ? 'Old Testament' : 'New Testament'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.bookGroupBadge}>{group.items.length} verses</Text>
                </View>

                {/* Verse Cards */}
                {group.items.map(item => (
                  <View
                    key={`${item.translation}_${item.bookCode}_${item.chapter}_${item.verse}`}
                    style={styles.resultCard}
                  >
                    {/* Header Row */}
                    <View style={styles.resultHeader}>
                      <View style={styles.refBadge}>
                        <Text style={styles.reference}>
                          {item.bookName} {item.chapter}:{item.verse}
                        </Text>
                      </View>
                      <View style={styles.trBadge}>
                        <Text style={styles.trBadgeText}>{item.translation}</Text>
                      </View>
                    </View>

                    {/* Verse Body text (Tapping navigates directly to Reader) */}
                    <TouchableOpacity
                      onPress={() => handleSelectResult(item)}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel={`${item.bookName} ${item.chapter}:${item.verse}. ${item.text}. Tap to read in context.`}
                    >
                      <Text style={styles.verseText}>{item.text}</Text>
                    </TouchableOpacity>

                    {/* Result Actions Bar: Read, Share to Platforms, Download Card (3 Designs) */}
                    <View style={styles.resultActionsBar}>
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => handleSelectResult(item)}
                        accessibilityRole="button"
                        accessibilityLabel={`Read ${item.bookName} ${item.chapter}:${item.verse} in Reader`}
                      >
                        <Ionicons name="book-outline" size={13} color={colors.textPrimary} />
                        <Text style={styles.actionBtnText}>Read</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => {
                          hapticLight();
                          setSelectedVerseForAction({
                            text: item.text,
                            reference: `${item.bookName} ${item.chapter}:${item.verse}`,
                            translation: item.translation,
                          });
                          setShareModalVisible(true);
                        }}
                        accessibilityRole="button"
                        accessibilityLabel={`Share ${item.bookName} ${item.chapter}:${item.verse} to platforms`}
                      >
                        <Ionicons name="share-social-outline" size={13} color={colors.textPrimary} />
                        <Text style={styles.actionBtnText}>Share</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: colors.accentLight }]}
                        onPress={() => {
                          hapticLight();
                          setSelectedVerseForAction({
                            text: item.text,
                            reference: `${item.bookName} ${item.chapter}:${item.verse}`,
                            translation: item.translation,
                          });
                          setCardModalVisible(true);
                        }}
                        accessibilityRole="button"
                        accessibilityLabel={`Download graphic verse card for ${item.bookName} ${item.chapter}:${item.verse}`}
                      >
                        <Ionicons name="images-outline" size={13} color={colors.accent} />
                        <Text style={[styles.actionBtnText, { color: colors.accent }]}>
                          Download Card
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            );
          })}
        </ScrollView>
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
};
