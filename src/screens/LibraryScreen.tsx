import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useBible } from '../context/BibleContext';
import { useTheme } from '../context/ThemeContext';
import { EmptyState } from '../components/EmptyState';
import { Ionicons } from '@expo/vector-icons';
import { hapticSuccess } from '../utils/haptics';
import {
  getLocalBookmarks,
  getLocalHighlights,
  getLocalNotes,
  getLocalReadingHistory,
  removeLocalBookmark,
  removeLocalHighlight,
  removeLocalNote,
  saveLocalReadingPlanProgress,
  getLocalReadingPlanProgress,
  LocalBookmarkRow,
  LocalHighlightRow,
  LocalNoteRow,
  LocalReadingHistoryRow,
} from '../database/sqlite';
import { STARTER_READING_PLANS, ReadingPlan } from '../config/readingPlans';

type LibraryTab = 'bookmarks' | 'highlights' | 'notes' | 'history' | 'plans';
type BookmarkGrouping = 'date' | 'book';

const COLOR_FILTERS = [
  { label: 'All', hex: 'ALL' },
  { label: 'Yellow', hex: '#FEF08A' },
  { label: 'Green', hex: '#BBF7D0' },
  { label: 'Blue', hex: '#BFDBFE' },
  { label: 'Pink', hex: '#FBCFE8' },
  { label: 'Orange', hex: '#FED7AA' },
];

export const LibraryScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const { isGuest, user, triggerSync } = useAuth();
  const { navigateTo } = useBible();
  const { colors, spacing, radii, fonts, fontSizes, fontWeights } = useTheme();

  const initialTab = (route?.params?.initialTab as LibraryTab) || 'bookmarks';
  const [activeTab, setActiveTab] = useState<LibraryTab>(initialTab);
  const [loading, setLoading] = useState(true);

  // Data states
  const [bookmarks, setBookmarks] = useState<LocalBookmarkRow[]>([]);
  const [highlights, setHighlights] = useState<LocalHighlightRow[]>([]);
  const [notes, setNotes] = useState<LocalNoteRow[]>([]);
  const [history, setHistory] = useState<LocalReadingHistoryRow[]>([]);

  // Bookmarks state
  const [bmGrouping, setBmGrouping] = useState<BookmarkGrouping>('date');

  // Highlights state
  const [selectedColorFilter, setSelectedColorFilter] = useState<string>('ALL');

  // Notes state
  const [noteSearchQuery, setNoteSearchQuery] = useState<string>('');

  // Reading Plans state
  const [selectedPlan, setSelectedPlan] = useState<ReadingPlan>(STARTER_READING_PLANS[0]);
  const [completedDays, setCompletedDays] = useState<number[]>([]);
  const [streak, setStreak] = useState<number>(0);

  const loadData = async () => {
    setLoading(true);
    try {
      const [bm, hl, nt, rh] = await Promise.all([
        getLocalBookmarks(),
        getLocalHighlights(),
        getLocalNotes(),
        getLocalReadingHistory(),
      ]);
      setBookmarks(bm);
      setHighlights(hl);
      setNotes(nt);
      setHistory(rh);

      const planProgress = await getLocalReadingPlanProgress(selectedPlan.id);
      if (planProgress) {
        setCompletedDays(planProgress.completedDays);
        setStreak(planProgress.streak);
      } else {
        setCompletedDays([]);
        setStreak(0);
      }
    } catch (e) {
      console.error('Failed to load library:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab, selectedPlan]);

  // Remove Bookmark Handler
  const handleRemoveBookmark = async (id: string) => {
    await removeLocalBookmark(id);
    setBookmarks(bookmarks.filter(b => b.id !== id));
  };

  // Remove Highlight Handler
  const handleRemoveHighlight = async (id: string) => {
    await removeLocalHighlight(id);
    setHighlights(highlights.filter(h => h.id !== id));
  };

  // Remove Note Handler
  const handleRemoveNote = async (id: string) => {
    await removeLocalNote(id);
    setNotes(notes.filter(n => n.id !== id));
  };

  // Toggle Reading Plan Day completion
  const handleTogglePlanDay = async (day: number) => {
    const isCompleted = completedDays.includes(day);
    let nextCompleted: number[];
    let nextStreak = streak;

    if (isCompleted) {
      nextCompleted = completedDays.filter(d => d !== day);
      nextStreak = Math.max(0, streak - 1);
    } else {
      nextCompleted = [...completedDays, day].sort((a, b) => a - b);
      nextStreak = streak + 1;
      hapticSuccess();
    }

    setCompletedDays(nextCompleted);
    setStreak(nextStreak);

    await saveLocalReadingPlanProgress(
      selectedPlan.id,
      day,
      nextCompleted,
      nextStreak,
      new Date().toISOString()
    );
  };

  // Grouped Bookmarks
  const groupedBookmarks = useMemo(() => {
    if (bmGrouping === 'book') {
      const groups: Record<string, LocalBookmarkRow[]> = {};
      for (const b of bookmarks) {
        if (!groups[b.book]) groups[b.book] = [];
        groups[b.book].push(b);
      }
      return groups;
    } else {
      const now = new Date();
      const groups: Record<string, LocalBookmarkRow[]> = {
        Today: [],
        Yesterday: [],
        'Last 7 Days': [],
        Earlier: [],
      };

      for (const b of bookmarks) {
        const d = new Date(b.created_at);
        const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 3600 * 24));
        if (diffDays === 0) groups['Today'].push(b);
        else if (diffDays === 1) groups['Yesterday'].push(b);
        else if (diffDays < 7) groups['Last 7 Days'].push(b);
        else groups['Earlier'].push(b);
      }
      return groups;
    }
  }, [bookmarks, bmGrouping]);

  const filteredHighlights = useMemo(() => {
    if (selectedColorFilter === 'ALL') return highlights;
    return highlights.filter(h => h.color.toUpperCase() === selectedColorFilter.toUpperCase());
  }, [highlights, selectedColorFilter]);

  const filteredNotes = useMemo(() => {
    const q = noteSearchQuery.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter(
      n =>
        n.text.toLowerCase().includes(q) ||
        n.book.toLowerCase().includes(q) ||
        `${n.chapter}:${n.verse}`.includes(q)
    );
  }, [notes, noteSearchQuery]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.background },
        guestSyncBanner: {
          backgroundColor: colors.warningLight,
          padding: spacing.sm,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottomWidth: 1,
          borderColor: colors.borderLight,
        },
        guestSyncText: { fontSize: fontSizes.xs, color: colors.warning, flex: 1 },
        guestSyncBtn: {
          backgroundColor: colors.warning,
          paddingVertical: spacing.xs,
          paddingHorizontal: spacing.sm,
          borderRadius: radii.sm,
        },
        guestSyncBtnText: { color: colors.surface, fontSize: fontSizes.xs, fontWeight: fontWeights.bold },
        userSyncBar: {
          backgroundColor: colors.successLight,
          padding: spacing.sm,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottomWidth: 1,
          borderColor: colors.borderLight,
        },
        userSyncText: { fontSize: fontSizes.xs, color: colors.success, fontWeight: fontWeights.semibold },
        userSyncBtn: {
          backgroundColor: colors.success,
          paddingVertical: spacing.xs,
          paddingHorizontal: spacing.sm,
          borderRadius: radii.sm,
        },
        userSyncBtnText: { color: colors.surface, fontSize: fontSizes.xs, fontWeight: fontWeights.bold },
        tabBar: {
          flexDirection: 'row',
          backgroundColor: colors.surface,
          borderBottomWidth: 1,
          borderColor: colors.border,
        },
        tab: { flex: 1, minHeight: 48, justifyContent: 'center', paddingVertical: spacing.sm, alignItems: 'center' },
        activeTab: { borderBottomWidth: 2, borderColor: colors.primary },
        tabText: { fontSize: fontSizes.sm, color: colors.textSecondary, fontWeight: fontWeights.semibold },
        activeTabText: { color: colors.primary, fontWeight: fontWeights.extrabold },
        tabContent: { flex: 1, padding: spacing.md },
        center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
        subToolbar: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: spacing.md,
        },
        subToolbarLabel: { fontSize: fontSizes.sm, color: colors.textSecondary, fontWeight: fontWeights.semibold },
        toggleGroup: { flexDirection: 'row', backgroundColor: colors.surfaceElevated, borderRadius: radii.sm, padding: 2 },
        toggleBtn: { minHeight: 44, minWidth: 44, justifyContent: 'center', alignItems: 'center', paddingVertical: 4, paddingHorizontal: spacing.sm, borderRadius: radii.sm },
        activeToggleBtn: { backgroundColor: colors.surface },
        toggleBtnText: { fontSize: fontSizes.xs, color: colors.textSecondary, fontWeight: fontWeights.semibold },
        activeToggleBtnText: { color: colors.textPrimary, fontWeight: fontWeights.extrabold },
        groupContainer: { marginBottom: spacing.lg },
        groupTitle: { fontSize: fontSizes.md, fontWeight: fontWeights.extrabold, color: colors.textPrimary, marginBottom: spacing.sm },
        itemCard: {
          backgroundColor: colors.surface,
          padding: spacing.md,
          borderRadius: radii.md,
          marginBottom: spacing.sm,
          borderWidth: 1,
          borderColor: colors.border,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
        itemRef: { fontSize: fontSizes.md, fontWeight: fontWeights.bold, color: colors.textPrimary },
        itemSub: { fontSize: fontSizes.xs, color: colors.textTertiary, marginTop: 3 },
        noteText: { fontSize: fontSizes.sm, color: colors.textSecondary, marginVertical: 4, lineHeight: 18 },
        deleteBtn: { minHeight: 44, minWidth: 44, justifyContent: 'center', alignItems: 'center', paddingVertical: 4, paddingHorizontal: spacing.sm },
        deleteBtnText: { fontSize: fontSizes.xs, color: colors.error, fontWeight: fontWeights.semibold },
        colorFilterBar: { flexDirection: 'row', marginBottom: spacing.md },
        colorFilterChip: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 44,
          paddingVertical: 6,
          paddingHorizontal: spacing.md,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radii.pill,
          marginRight: 6,
          gap: 4,
        },
        activeColorFilterChip: { backgroundColor: colors.primary, borderColor: colors.primary },
        colorFilterChipText: { fontSize: fontSizes.xs, color: colors.textSecondary, fontWeight: fontWeights.semibold },
        activeColorFilterChipText: { color: colors.primaryText },
        filterDot: { width: 10, height: 10, borderRadius: 5 },
        notesSearchInput: {
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radii.md,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          fontSize: fontSizes.sm,
          color: colors.textPrimary,
          marginBottom: spacing.md,
        },
        planSelectorRow: { flexDirection: 'row', marginBottom: spacing.md },
        planSelectorChip: {
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          paddingVertical: 6,
          paddingHorizontal: spacing.md,
          borderRadius: radii.pill,
          marginRight: spacing.sm,
        },
        activePlanSelectorChip: { backgroundColor: colors.primary, borderColor: colors.primary },
        planSelectorChipText: { fontSize: fontSizes.sm, fontWeight: fontWeights.semibold, color: colors.textSecondary },
        activePlanSelectorChipText: { color: colors.primaryText },
        planHeaderCard: {
          backgroundColor: colors.surface,
          padding: spacing.lg,
          borderRadius: radii.lg,
          borderWidth: 1,
          borderColor: colors.border,
          marginBottom: spacing.lg,
        },
        planTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
        planCardTitle: { fontSize: fontSizes.lg, fontWeight: fontWeights.extrabold, color: colors.textPrimary },
        planCardSubtitle: { fontSize: fontSizes.sm, color: colors.textSecondary, marginTop: 2 },
        streakBadge: { backgroundColor: colors.warningLight, paddingVertical: 3, paddingHorizontal: spacing.sm, borderRadius: radii.md, flexDirection: 'row', alignItems: 'center', gap: 4 },
        streakBadgeText: { fontSize: fontSizes.xs, fontWeight: fontWeights.bold, color: colors.warning },
        planDesc: { fontSize: fontSizes.sm, color: colors.textSecondary, lineHeight: 19, marginVertical: spacing.sm },
        lowGuiltBanner: {
          backgroundColor: colors.successLight,
          padding: spacing.sm,
          borderRadius: radii.md,
          borderWidth: 1,
          borderColor: colors.borderLight,
        },
        lowGuiltBannerTitle: { fontSize: fontSizes.sm, fontWeight: fontWeights.bold, color: colors.success },
        lowGuiltBannerText: { fontSize: fontSizes.xs, color: colors.success, marginTop: 2, lineHeight: 16 },
        scheduleTitle: { fontSize: fontSizes.md, fontWeight: fontWeights.extrabold, color: colors.textPrimary, marginBottom: spacing.sm },
        dayCard: {
          backgroundColor: colors.surface,
          borderRadius: radii.md,
          padding: spacing.md,
          marginBottom: spacing.sm,
          borderWidth: 1,
          borderColor: colors.border,
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
        },
        checkboxTouch: { minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center', padding: 4 },
        checkbox: {
          width: 22,
          height: 22,
          borderRadius: radii.sm,
          borderWidth: 2,
          borderColor: colors.border,
          justifyContent: 'center',
          alignItems: 'center',
        },
        checkedBox: { backgroundColor: colors.primary, borderColor: colors.primary },
        dayTitle: { fontSize: fontSizes.md, fontWeight: fontWeights.bold, color: colors.textPrimary },
        completedDayTitle: { textDecorationLine: 'line-through', color: colors.textTertiary },
        passageLinksRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
        passageLink: {
          backgroundColor: colors.surfaceElevated,
          paddingVertical: 3,
          paddingHorizontal: spacing.sm,
          borderRadius: 4,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
        },
        passageLinkText: { fontSize: fontSizes.xs, fontWeight: fontWeights.semibold, color: colors.primary },
      }),
    [colors, spacing, radii, fontSizes, fontWeights]
  );

  return (
    <View style={styles.container}>
      {isGuest ? (
        <View style={styles.guestSyncBanner}>
          <Text style={styles.guestSyncText}>
            Local storage active ({bookmarks.length} bookmarks, {highlights.length} highlights).
          </Text>
          <TouchableOpacity
            style={styles.guestSyncBtn}
            onPress={() => navigation.navigate('Profile')}
          >
            <Text style={styles.guestSyncBtnText}>Sync to Cloud</Text>
          </TouchableOpacity>
        </View>
      ) : (
        user && (
          <View style={styles.userSyncBar}>
            <Text style={styles.userSyncText}>Account: {user.email}</Text>
            <TouchableOpacity style={styles.userSyncBtn} onPress={triggerSync}>
              <Text style={styles.userSyncBtnText}>Sync Now</Text>
            </TouchableOpacity>
          </View>
        )
      )}

      <View style={styles.tabBar}>
        {(['bookmarks', 'highlights', 'notes', 'plans', 'history'] as LibraryTab[]).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : (
        <View style={styles.tabContent}>
          {activeTab === 'bookmarks' && (
            <View style={{ flex: 1 }}>
              <View style={styles.subToolbar}>
                <Text style={styles.subToolbarLabel}>Group by:</Text>
                <View style={styles.toggleGroup}>
                  <TouchableOpacity
                    style={[styles.toggleBtn, bmGrouping === 'date' && styles.activeToggleBtn]}
                    onPress={() => setBmGrouping('date')}
                  >
                    <Text
                      style={[
                        styles.toggleBtnText,
                        bmGrouping === 'date' && styles.activeToggleBtnText,
                      ]}
                    >
                      Date
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.toggleBtn, bmGrouping === 'book' && styles.activeToggleBtn]}
                    onPress={() => setBmGrouping('book')}
                  >
                    <Text
                      style={[
                        styles.toggleBtnText,
                        bmGrouping === 'book' && styles.activeToggleBtnText,
                      ]}
                    >
                      Book
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <ScrollView style={{ flex: 1 }}>
                {Object.keys(groupedBookmarks).length === 0 && bookmarks.length === 0 ? (
                  <EmptyState
                    icon="bookmark-outline"
                    title="No bookmarks yet"
                    message="Long-press any verse while reading to save it here."
                  />
                ) : (
                  Object.keys(groupedBookmarks).map(groupName => {
                    const items = groupedBookmarks[groupName];
                    if (!items || items.length === 0) return null;
                    return (
                      <View key={groupName} style={styles.groupContainer}>
                        <Text style={styles.groupTitle}>{groupName}</Text>
                        {items.map(item => (
                          <View key={item.id} style={styles.itemCard}>
                            <TouchableOpacity
                              style={{ flex: 1 }}
                              onPress={async () => {
                                await navigateTo(item.book, item.chapter, item.translation, item.verse);
                                navigation.navigate('Read');
                              }}
                            >
                              <Text style={styles.itemRef}>
                                {item.book} {item.chapter}:{item.verse} ({item.translation})
                              </Text>
                              <Text style={styles.itemSub}>
                                {new Date(item.created_at).toLocaleDateString()}
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.deleteBtn}
                              onPress={() => handleRemoveBookmark(item.id)}
                            >
                              <Text style={styles.deleteBtnText}>Remove</Text>
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    );
                  })
                )}
              </ScrollView>
            </View>
          )}

          {activeTab === 'highlights' && (
            <View style={{ flex: 1 }}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.colorFilterBar}
              >
                {COLOR_FILTERS.map(c => (
                  <TouchableOpacity
                    key={c.hex}
                    style={[
                      styles.colorFilterChip,
                      selectedColorFilter === c.hex && styles.activeColorFilterChip,
                    ]}
                    onPress={() => setSelectedColorFilter(c.hex)}
                  >
                    {c.hex !== 'ALL' && (
                      <View style={[styles.filterDot, { backgroundColor: c.hex }]} />
                    )}
                    <Text
                      style={[
                        styles.colorFilterChipText,
                        selectedColorFilter === c.hex && styles.activeColorFilterChipText,
                      ]}
                    >
                      {c.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <FlatList
                data={filteredHighlights}
                keyExtractor={item => item.id}
                ListEmptyComponent={
                  <EmptyState
                    icon="color-palette-outline"
                    title="No highlights yet"
                    message="Highlight verses with color to find them easily."
                  />
                }
                renderItem={({ item }) => (
                  <View style={styles.itemCard}>
                    <TouchableOpacity
                      style={{ flex: 1 }}
                      onPress={async () => {
                        await navigateTo(item.book, item.chapter, item.translation, item.verse);
                        navigation.navigate('Read');
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View style={[styles.filterDot, { backgroundColor: item.color }]} />
                        <Text style={styles.itemRef}>
                          {item.book} {item.chapter}:{item.verse} ({item.translation})
                        </Text>
                      </View>
                      <Text style={styles.itemSub}>
                        {new Date(item.created_at).toLocaleDateString()}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => handleRemoveHighlight(item.id)}
                    >
                      <Text style={styles.deleteBtnText}>Clear</Text>
                    </TouchableOpacity>
                  </View>
                )}
              />
            </View>
          )}

          {activeTab === 'notes' && (
            <View style={{ flex: 1 }}>
              <TextInput
                style={styles.notesSearchInput}
                placeholder="Search notes or references..."
                placeholderTextColor={colors.textTertiary}
                value={noteSearchQuery}
                onChangeText={setNoteSearchQuery}
                clearButtonMode="while-editing"
              />

              <FlatList
                data={filteredNotes}
                keyExtractor={item => item.id}
                ListEmptyComponent={
                  <EmptyState
                    icon="document-text-outline"
                    title="No notes yet"
                    message="Add notes to any verse to capture your thoughts."
                  />
                }
                renderItem={({ item }) => (
                  <View style={styles.itemCard}>
                    <TouchableOpacity
                      style={{ flex: 1 }}
                      onPress={async () => {
                        await navigateTo(item.book, item.chapter, item.translation, item.verse);
                        navigation.navigate('Read');
                      }}
                    >
                      <Text style={styles.itemRef}>
                        {item.book} {item.chapter}:{item.verse} ({item.translation})
                      </Text>
                      <Text style={styles.noteText}>{item.text}</Text>
                      <Text style={styles.itemSub}>
                        Updated {new Date(item.updated_at || item.created_at).toLocaleDateString()}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => handleRemoveNote(item.id)}
                    >
                      <Text style={styles.deleteBtnText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                )}
              />
            </View>
          )}

          {activeTab === 'plans' && (
            <ScrollView style={{ flex: 1 }}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.planSelectorRow}
              >
                {STARTER_READING_PLANS.map(plan => (
                  <TouchableOpacity
                    key={plan.id}
                    style={[
                      styles.planSelectorChip,
                      selectedPlan.id === plan.id && styles.activePlanSelectorChip,
                    ]}
                    onPress={() => setSelectedPlan(plan)}
                  >
                    <Text
                      style={[
                        styles.planSelectorChipText,
                        selectedPlan.id === plan.id && styles.activePlanSelectorChipText,
                      ]}
                    >
                      {plan.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.planHeaderCard}>
                <View style={styles.planTitleRow}>
                  <View>
                    <Text style={styles.planCardTitle}>{selectedPlan.title}</Text>
                    <Text style={styles.planCardSubtitle}>{selectedPlan.subtitle}</Text>
                  </View>
                  <View style={styles.streakBadge}>
                    <Ionicons name="flame-outline" size={14} color={colors.warning} />
                    <Text style={styles.streakBadgeText}>{streak} Day Streak</Text>
                  </View>
                </View>

                <Text style={styles.planDesc}>{selectedPlan.description}</Text>

                <View style={styles.lowGuiltBanner}>
                  <Text style={styles.lowGuiltBannerTitle}>Grace on Your Journey</Text>
                  <Text style={styles.lowGuiltBannerText}>
                    Life happens. Missed a few days? No guilt, no penalty. Pick up right where you
                    left off.
                  </Text>
                </View>
              </View>

              <Text style={styles.scheduleTitle}>
                Schedule ({completedDays.length}/{selectedPlan.durationDays} completed)
              </Text>

              {selectedPlan.days.map(d => {
                const isChecked = completedDays.includes(d.day);
                return (
                  <View key={d.day} style={styles.dayCard}>
                    <TouchableOpacity
                      style={styles.checkboxTouch}
                      onPress={() => handleTogglePlanDay(d.day)}
                    >
                      <View style={[styles.checkbox, isChecked && styles.checkedBox]}>
                        {isChecked && <Ionicons name="checkmark" size={16} color={colors.primaryText} />}
                      </View>
                    </TouchableOpacity>

                    <View style={{ flex: 1 }}>
                      <Text style={[styles.dayTitle, isChecked && styles.completedDayTitle]}>
                        {d.title}
                      </Text>
                      <View style={styles.passageLinksRow}>
                        {d.passages.map(p => (
                          <TouchableOpacity
                            key={p.label}
                            style={styles.passageLink}
                            onPress={async () => {
                              await navigateTo(p.bookCode, p.chapter);
                              navigation.navigate('Read');
                            }}
                          >
                            <Text style={styles.passageLinkText}>{p.label}</Text>
                            <Ionicons name="arrow-forward" size={12} color={colors.primary} />
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          )}

          {activeTab === 'history' && (
            <FlatList
              data={history}
              keyExtractor={item => item.id}
              ListEmptyComponent={
                <EmptyState
                  icon="time-outline"
                  title="No reading history"
                  message="Chapters you read will appear here automatically."
                />
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.itemCard}
                  onPress={async () => {
                    await navigateTo(item.book, item.chapter, item.translation);
                    navigation.navigate('Read');
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemRef}>
                      {item.book} {item.chapter} ({item.translation})
                    </Text>
                    <Text style={styles.itemSub}>
                      Last opened: {new Date(item.last_read_at).toLocaleString()}
                    </Text>
                  </View>
                  <Ionicons name="arrow-forward" size={16} color={colors.textTertiary} />
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      )}
    </View>
  );
};
