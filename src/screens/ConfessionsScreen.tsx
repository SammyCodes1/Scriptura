import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  PREBUILT_CONFESSION_DECKS,
  ConfessionDeck,
} from '../config/confessionDecks';
import {
  getLocalCustomConfessionDecks,
  getLocalConfessionProgress,
  deleteCustomConfessionDeck,
} from '../database/sqlite';
import {
  getConfessionReminderConfig,
  setConfessionReminder,
  ReminderConfig,
} from '../services/notifications/reminderService';
import { ConfessionReaderModal } from '../components/ConfessionReaderModal';
import { CreateCustomDeckModal } from '../components/CreateCustomDeckModal';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { hapticSuccess } from '../utils/haptics';
import { EmptyState } from '../components/EmptyState';

type ThemeFilter =
  | 'All'
  | 'Identity'
  | 'Healing'
  | 'Provision/Finance'
  | 'Family'
  | 'Peace/Anxiety'
  | 'Purpose'
  | 'Protection'
  | 'Custom';

const THEME_PILLS: ThemeFilter[] = [
  'All',
  'Identity',
  'Healing',
  'Provision/Finance',
  'Family',
  'Peace/Anxiety',
  'Purpose',
  'Protection',
  'Custom',
];

const REMINDER_PRESETS = [
  { label: '7:00 AM', time: '07:00' },
  { label: '8:00 AM', time: '08:00' },
  { label: '12:00 PM', time: '12:00' },
  { label: '8:00 PM', time: '20:00' },
  { label: '9:00 PM', time: '21:00' },
];

export const ConfessionsScreen: React.FC = () => {
  const { colors, spacing, radii, fonts } = useTheme();
  const [selectedTheme, setSelectedTheme] = useState<ThemeFilter>('All');
  const [customDecks, setCustomDecks] = useState<ConfessionDeck[]>([]);
  const [deckProgress, setDeckProgress] = useState<
    Record<string, { streak: number; timesRecited: number; completedToday: boolean }>
  >({});
  const [loading, setLoading] = useState(true);

  // Modals state
  const [activeDeckForReader, setActiveDeckForReader] = useState<ConfessionDeck | null>(null);
  const [readerModalVisible, setReaderModalVisible] = useState(false);
  const [createDeckVisible, setCreateDeckVisible] = useState(false);

  // Daily Reminder state
  const [reminderConfig, setReminderConfig] = useState<ReminderConfig>({
    enabled: false,
    timeString: '08:00',
    hour: 8,
    minute: 0,
  });

  const loadAllDecksAndProgress = async () => {
    setLoading(true);
    try {
      const [custom, reminder] = await Promise.all([
        getLocalCustomConfessionDecks(),
        getConfessionReminderConfig(),
      ]);
      setCustomDecks(custom);
      setReminderConfig(reminder);

      const allDecks = [...PREBUILT_CONFESSION_DECKS, ...custom];
      const progressMap: Record<
        string,
        { streak: number; timesRecited: number; completedToday: boolean }
      > = {};

      for (const deck of allDecks) {
        const prog = await getLocalConfessionProgress(deck.id);
        if (prog) {
          progressMap[deck.id] = {
            streak: prog.streak,
            timesRecited: prog.timesRecited,
            completedToday: prog.completedToday,
          };
        } else {
          progressMap[deck.id] = {
            streak: 0,
            timesRecited: 0,
            completedToday: false,
          };
        }
      }
      setDeckProgress(progressMap);
    } catch (err) {
      console.error('Failed to load confession decks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllDecksAndProgress();
  }, []);

  const handleToggleReminder = async (enabled: boolean) => {
    const res = await setConfessionReminder(enabled, reminderConfig.timeString);
    if (res.success) {
      setReminderConfig({ ...reminderConfig, enabled });
      Alert.alert(
        enabled ? 'Daily Reminder Set' : 'Reminder Disabled',
        enabled
          ? `You will receive a daily reminder at ${reminderConfig.timeString} to speak God's word aloud.`
          : 'Daily confession reminder has been turned off.'
      );
    } else {
      Alert.alert('Reminder Notice', res.error || 'Unable to schedule notification.');
    }
  };

  const handleSelectReminderTime = async (time: string) => {
    const res = await setConfessionReminder(reminderConfig.enabled, time);
    if (res.success) {
      setReminderConfig({ ...reminderConfig, timeString: time });
    }
  };

  const handleOpenReader = (deck: ConfessionDeck) => {
    setActiveDeckForReader(deck);
    setReaderModalVisible(true);
  };

  const handleDeleteCustomDeck = (deckId: string) => {
    Alert.alert('Delete Deck', 'Are you sure you want to delete this custom deck?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteCustomConfessionDeck(deckId);
          await loadAllDecksAndProgress();
        },
      },
    ]);
  };

  const allDecks = [...PREBUILT_CONFESSION_DECKS, ...customDecks];
  const filteredDecks = allDecks.filter(d => {
    if (selectedTheme === 'All') return true;
    if (selectedTheme === 'Custom') return d.isCustom;
    return d.theme === selectedTheme;
  });

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.lg, paddingBottom: 40 },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    newDeckBtn: {
      backgroundColor: colors.primary,
      minHeight: 44,
      justifyContent: 'center',
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: radii.md,
    },
    newDeckBtnText: { color: colors.primaryText, fontWeight: '700', fontSize: 12, fontFamily: fonts.sans },
    reminderCard: {
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      padding: spacing.md,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    reminderHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    reminderTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, fontFamily: fonts.sans },
    reminderSub: { fontSize: 11, color: colors.textSecondary, marginTop: 2, fontFamily: fonts.sans },
    presetTimeRow: {
      marginTop: spacing.md,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderColor: colors.borderLight,
      flexDirection: 'row',
      alignItems: 'center',
    },
    timeLabel: { fontSize: 11, color: colors.textSecondary, fontWeight: '600', marginRight: spacing.sm, fontFamily: fonts.sans },
    timeChip: {
      backgroundColor: colors.background,
      minHeight: 44,
      justifyContent: 'center',
      paddingVertical: 4,
      paddingHorizontal: 12,
      borderRadius: radii.pill,
      marginRight: 6,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    activeTimeChip: { backgroundColor: colors.primary, borderColor: colors.primary },
    timeChipText: { fontSize: 11, color: colors.textPrimary, fontWeight: '600', fontFamily: fonts.sans },
    activeTimeChipText: { color: colors.primaryText },
    themeFilterBar: { flexDirection: 'row', marginBottom: spacing.lg },
    themeChip: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.borderLight,
      minHeight: 44,
      justifyContent: 'center',
      paddingVertical: 6,
      paddingHorizontal: spacing.md,
      borderRadius: radii.pill,
      marginRight: spacing.sm,
    },
    activeThemeChip: { backgroundColor: colors.primary, borderColor: colors.primary },
    themeChipText: { fontSize: 12, fontWeight: '600', color: colors.textPrimary, fontFamily: fonts.sans },
    activeThemeChipText: { color: colors.primaryText },
    decksList: { gap: spacing.md },
    deckCard: {
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    deckTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    badgeRow: { flexDirection: 'row', gap: 6 },
    themeBadge: {
      backgroundColor: colors.background,
      paddingVertical: 3,
      paddingHorizontal: spacing.sm,
      borderRadius: radii.sm,
    },
    themeBadgeText: { fontSize: 11, fontWeight: '700', color: colors.textSecondary, fontFamily: fonts.sans },
    customBadge: {
      backgroundColor: colors.primary + '20', // slight transparency for secondary pill
      paddingVertical: 3,
      paddingHorizontal: spacing.sm,
      borderRadius: radii.sm,
    },
    customBadgeText: { fontSize: 11, fontWeight: '800', color: colors.primary, fontFamily: fonts.sans },
    streakPill: {
      backgroundColor: colors.warningLight || '#FEF3C7',
      paddingVertical: 3,
      paddingHorizontal: spacing.sm,
      borderRadius: radii.pill,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    streakPillText: { fontSize: 11, fontWeight: '700', color: colors.warning || '#B45309', fontFamily: fonts.sans },
    deckHeading: { fontSize: 18, fontWeight: '800', color: colors.textPrimary, marginBottom: 4, fontFamily: fonts.sans },
    deckDesc: { fontSize: 13, color: colors.textSecondary, lineHeight: 18, marginBottom: spacing.md, fontFamily: fonts.sans },
    deckMetaRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    verseCountText: { fontSize: 12, color: colors.textSecondary, fontWeight: '500', fontFamily: fonts.sans },
    completedTodayBadge: { fontSize: 12, fontWeight: '700', color: colors.success, fontFamily: fonts.sans, flexDirection: 'row', alignItems: 'center' },
    actionRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
    startBtn: {
      flex: 1,
      backgroundColor: colors.primary,
      minHeight: 44,
      paddingVertical: 11,
      borderRadius: radii.md,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: spacing.xs,
    },
    startBtnText: { color: colors.primaryText, fontWeight: '700', fontSize: 13, fontFamily: fonts.sans },
    practiceAgainBtn: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    practiceAgainBtnText: { color: colors.textPrimary, fontWeight: '700' },
    deleteDeckBtn: {
      minHeight: 44,
      minWidth: 44,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 12,
    },
    deleteDeckText: { color: colors.error, fontSize: 12, fontWeight: '600', fontFamily: fonts.sans },
    emptyText: { textAlign: 'center', color: colors.textTertiary, marginTop: 30, fontSize: 13, fontFamily: fonts.sans },
  }), [colors, spacing, radii, fonts]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Title & Philosophy */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.newDeckBtn}
          onPress={() => setCreateDeckVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Create Custom Confession Deck"
        >
          <Text style={styles.newDeckBtnText}>+ New Deck</Text>
        </TouchableOpacity>
      </View>

      {/* Reminder Card */}
      <View style={styles.reminderCard}>
        <View style={styles.reminderHeader}>
          <View>
            <Text style={styles.reminderTitle}>Daily Declaration Reminder</Text>
            <Text style={styles.reminderSub}>
              {reminderConfig.enabled
                ? `Active: Scheduled for ${reminderConfig.timeString} daily`
                : 'Receive a peaceful daily notification to speak the Word'}
            </Text>
          </View>
          <Switch
            value={reminderConfig.enabled}
            onValueChange={handleToggleReminder}
            trackColor={{ false: colors.borderLight, true: colors.primary }}
            thumbColor={colors.primaryText}
            accessibilityLabel="Daily declaration reminder toggle"
          />
        </View>

        {reminderConfig.enabled && (
          <View style={styles.presetTimeRow}>
            <Text style={styles.timeLabel}>Reminder Time:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {REMINDER_PRESETS.map(p => (
                <TouchableOpacity
                  key={p.time}
                  style={[
                    styles.timeChip,
                    reminderConfig.timeString === p.time && styles.activeTimeChip,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Set reminder time to ${p.label}`}
                  accessibilityState={{ selected: reminderConfig.timeString === p.time }}
                  onPress={() => handleSelectReminderTime(p.time)}
                >
                  <Text
                    style={[
                      styles.timeChipText,
                      reminderConfig.timeString === p.time && styles.activeTimeChipText,
                    ]}
                  >
                    {p.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Theme Filter Bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.themeFilterBar}>
        {THEME_PILLS.map(theme => (
          <TouchableOpacity
            key={theme}
            style={[styles.themeChip, selectedTheme === theme && styles.activeThemeChip]}
            onPress={() => setSelectedTheme(theme)}
          >
            <Text
              style={[
                styles.themeChipText,
                selectedTheme === theme && styles.activeThemeChipText,
              ]}
            >
              {theme}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Decks List */}
      {loading ? (
        <ActivityIndicator style={{ marginTop: 30 }} color={colors.primary} />
      ) : (
        <View style={styles.decksList}>
          {filteredDecks.map(deck => {
            const prog = deckProgress[deck.id] || {
              streak: 0,
              timesRecited: 0,
              completedToday: false,
            };
            return (
              <View key={deck.id} style={styles.deckCard}>
                <View style={styles.deckTopRow}>
                  <View style={styles.badgeRow}>
                    <View style={styles.themeBadge}>
                      <Text style={styles.themeBadgeText}>{deck.theme}</Text>
                    </View>
                    {deck.isCustom && (
                      <View style={styles.customBadge}>
                        <Text style={styles.customBadgeText}>PERSONAL</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.streakPill}>
                    <Ionicons name="flame-outline" size={12} color={colors.warning || '#B45309'} />
                    <Text style={styles.streakPillText}>
                      {prog.streak} Day Milestone
                    </Text>
                  </View>
                </View>

                <Text style={styles.deckHeading}>{deck.title}</Text>
                <Text style={styles.deckDesc}>{deck.description}</Text>

                <View style={styles.deckMetaRow}>
                  <Text style={styles.verseCountText}>
                    {deck.items.length} Scripture Declarations
                  </Text>
                  {prog.completedToday && (
                    <Text style={styles.completedTodayBadge}>
                      <Ionicons name="checkmark" size={12} color={colors.success} style={{ marginRight: 4 }} />
                      Done Today
                    </Text>
                  )}
                </View>

                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[styles.startBtn, prog.completedToday && styles.practiceAgainBtn]}
                    onPress={() => handleOpenReader(deck)}
                    accessibilityRole="button"
                    accessibilityLabel={`${prog.completedToday ? 'Practice again' : 'Speak Declarations'}: ${deck.title}`}
                  >
                    <Text
                      style={[
                        styles.startBtnText,
                        prog.completedToday && styles.practiceAgainBtnText,
                      ]}
                    >
                      {prog.completedToday ? 'Practice Again' : 'Speak Declarations'}
                    </Text>
                    {!prog.completedToday && <Ionicons name="arrow-forward-outline" size={14} color={colors.primaryText} />}
                  </TouchableOpacity>

                  {deck.isCustom && (
                    <TouchableOpacity
                      style={styles.deleteDeckBtn}
                      onPress={() => handleDeleteCustomDeck(deck.id)}
                      accessibilityRole="button"
                      accessibilityLabel={`Delete custom confession deck ${deck.title}`}
                    >
                      <Text style={styles.deleteDeckText}>Delete</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}

          {filteredDecks.length === 0 && (
            <EmptyState
              icon="sparkles-outline"
              title="No decks found"
              description="No decks match this filter."
            />
          )}
        </View>
      )}

      {/* Reader Modal */}
      <ConfessionReaderModal
        visible={readerModalVisible}
        deck={activeDeckForReader}
        onClose={() => setReaderModalVisible(false)}
        onCompleted={async () => {
          hapticSuccess();
          await loadAllDecksAndProgress();
        }}
      />

      {/* Custom Deck Creator Modal */}
      <CreateCustomDeckModal
        visible={createDeckVisible}
        onClose={() => setCreateDeckVisible(false)}
        onDeckCreated={async () => {
          await loadAllDecksAndProgress();
        }}
      />
    </ScrollView>
  );
};
