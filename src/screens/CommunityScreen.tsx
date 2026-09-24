import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { EmptyState } from '../components/EmptyState';

export const CommunityScreen: React.FC = () => {
  const { isGuest, user } = useAuth();
  const { colors, spacing, radii, fonts } = useTheme();
  const [activeSegment, setActiveSegment] = useState<'prayers' | 'posts'>('prayers');
  const [newPrayerTitle, setNewPrayerTitle] = useState('');
  const [newPrayerDesc, setNewPrayerDesc] = useState('');

  // Local sample community state
  const [prayerRequests, setPrayerRequests] = useState([
    {
      id: '1',
      author: 'David M.',
      title: 'Healing for my father',
      description: 'Please pray for my dad undergoing surgery tomorrow morning.',
      prayedCount: 14,
    },
    {
      id: '2',
      author: 'Sarah K.',
      title: 'Guidance in new career path',
      description: 'Seeking discernment on whether to accept a mission or corporate offer.',
      prayedCount: 22,
    },
  ]);

  const [communityPosts] = useState([
    {
      id: '1',
      author: 'Pastor John',
      scriptureTag: 'Romans 8:28',
      content: 'Remember today: All things work together for good for those who love God and are called according to His purpose!',
      createdAt: '2 hours ago',
    },
  ]);

  const handleAddPrayer = () => {
    if (!newPrayerTitle.trim() || !newPrayerDesc.trim()) return;
    const item = {
      id: String(Date.now()),
      author: user?.email ? user.email.split('@')[0] : 'Guest User',
      title: newPrayerTitle.trim(),
      description: newPrayerDesc.trim(),
      prayedCount: 1,
    };
    setPrayerRequests([item, ...prayerRequests]);
    setNewPrayerTitle('');
    setNewPrayerDesc('');
    Alert.alert('Prayer Request Submitted', 'Your prayer request is now visible to the community.');
  };

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.lg },
    segmentedControl: {
      flexDirection: 'row',
      backgroundColor: colors.surfaceElevated,
      borderRadius: radii.md,
      padding: spacing.xs,
      marginBottom: spacing.lg,
    },
    segmentBtn: { flex: 1, minHeight: 44, justifyContent: 'center', paddingVertical: spacing.sm, alignItems: 'center', borderRadius: radii.sm },
    activeSegmentBtn: { backgroundColor: colors.surface },
    segmentText: { fontSize: 13, color: colors.textSecondary, fontWeight: '500', fontFamily: fonts.sans },
    activeSegmentText: { color: colors.textPrimary, fontWeight: '700' },
    card: {
      backgroundColor: colors.surface,
      padding: spacing.lg,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.borderLight,
      marginBottom: spacing.lg,
    },
    formTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.xs, fontFamily: fonts.sans },
    publicNotice: { fontSize: 11, color: colors.textTertiary, marginBottom: spacing.md, fontFamily: fonts.sans, lineHeight: 15 },
    input: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.borderLight,
      borderRadius: radii.md,
      padding: spacing.md,
      fontSize: 14,
      marginBottom: spacing.md,
      fontFamily: fonts.sans,
      color: colors.textPrimary,
      minHeight: 44,
    },
    submitBtn: {
      backgroundColor: colors.primary,
      minHeight: 44,
      justifyContent: 'center',
      paddingVertical: spacing.md,
      borderRadius: radii.md,
      alignItems: 'center',
    },
    submitBtnText: { color: colors.primaryText, fontWeight: '600', fontSize: 13, fontFamily: fonts.sans },
    list: { gap: spacing.md },
    prayerCard: {
      backgroundColor: colors.surface,
      padding: spacing.lg,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    author: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, marginBottom: spacing.xs, fontFamily: fonts.sans },
    itemTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.xs, fontFamily: fonts.sans },
    itemDesc: { fontSize: 14, color: colors.textPrimary, lineHeight: 20, fontFamily: fonts.sans },
    cardFooter: { marginTop: spacing.md, flexDirection: 'row' },
    prayedBtn: {
      backgroundColor: colors.background,
      minHeight: 44,
      minWidth: 44,
      justifyContent: 'center',
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: radii.sm,
      borderWidth: 1,
      borderColor: colors.borderLight,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    prayedBtnText: { fontSize: 12, fontWeight: '600', color: colors.textPrimary, fontFamily: fonts.sans },
    postHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
    scriptureTag: { fontSize: 12, fontWeight: '700', color: colors.primary, fontFamily: fonts.sans },
    timestamp: { fontSize: 11, color: colors.textTertiary, marginTop: spacing.md, fontFamily: fonts.sans },
  }), [colors, spacing, radii, fonts]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Segment Switcher */}
      <View style={styles.segmentedControl}>
        <TouchableOpacity
          style={[styles.segmentBtn, activeSegment === 'prayers' && styles.activeSegmentBtn]}
          onPress={() => setActiveSegment('prayers')}
          accessibilityRole="tab"
          accessibilityLabel="Prayer Requests Tab"
          accessibilityState={{ selected: activeSegment === 'prayers' }}
        >
          <Text style={[styles.segmentText, activeSegment === 'prayers' && styles.activeSegmentText]}>
            Prayer Requests
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segmentBtn, activeSegment === 'posts' && styles.activeSegmentBtn]}
          onPress={() => setActiveSegment('posts')}
          accessibilityRole="tab"
          accessibilityLabel="Discussions Tab"
          accessibilityState={{ selected: activeSegment === 'posts' }}
        >
          <Text style={[styles.segmentText, activeSegment === 'posts' && styles.activeSegmentText]}>
            Discussions
          </Text>
        </TouchableOpacity>
      </View>

      {/* New Prayer Form */}
      {activeSegment === 'prayers' && (
        <View style={styles.card}>
          <Text style={styles.formTitle}>Submit a Prayer Request</Text>
          <Text style={styles.publicNotice}>
            Prayer requests are shared publicly with the Scriptura community so others may stand in faith with you.
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Prayer topic..."
            placeholderTextColor={colors.textTertiary}
            value={newPrayerTitle}
            onChangeText={setNewPrayerTitle}
            accessibilityLabel="Prayer topic title"
          />
          <TextInput
            style={[styles.input, { height: 70, textAlignVertical: 'top' }]}
            placeholder="Details / request..."
            placeholderTextColor={colors.textTertiary}
            multiline
            value={newPrayerDesc}
            onChangeText={setNewPrayerDesc}
            accessibilityLabel="Prayer request description"
          />
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleAddPrayer}
            accessibilityRole="button"
            accessibilityLabel="Post Prayer Request"
          >
            <Text style={styles.submitBtnText}>Post Prayer Request</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Prayer List */}
      {activeSegment === 'prayers' && (
        <View style={styles.list}>
          {prayerRequests.length === 0 ? (
            <EmptyState
              icon="heart-outline"
              title="No prayer requests yet"
              description="Share a prayer with the community."
            />
          ) : (
            prayerRequests.map(item => (
              <View key={item.id} style={styles.prayerCard}>
                <Text style={styles.author}>{item.author}</Text>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemDesc}>{item.description}</Text>
                <View style={styles.cardFooter}>
                  <TouchableOpacity
                    style={styles.prayedBtn}
                    accessibilityRole="button"
                    accessibilityLabel={`Pray for this request. Currently prayed by ${item.prayedCount} believers.`}
                    onPress={() => {
                      setPrayerRequests(
                        prayerRequests.map(p =>
                          p.id === item.id ? { ...p, prayedCount: p.prayedCount + 1 } : p
                        )
                      );
                    }}
                  >
                    <Ionicons name="heart-outline" size={14} color={colors.textPrimary} />
                    <Text style={styles.prayedBtnText}>Prayed ({item.prayedCount})</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      )}

      {/* Posts List */}
      {activeSegment === 'posts' && (
        <View style={styles.list}>
          {communityPosts.length === 0 ? (
            <EmptyState
              icon="chatbubbles-outline"
              title="No discussions yet"
              description="Start a discussion with the community."
            />
          ) : (
            communityPosts.map(post => (
              <View key={post.id} style={styles.prayerCard}>
                <View style={styles.postHeader}>
                  <Text style={styles.author}>{post.author}</Text>
                  <Text style={styles.scriptureTag}>{post.scriptureTag}</Text>
                </View>
                <Text style={styles.itemDesc}>{post.content}</Text>
                <Text style={styles.timestamp}>{post.createdAt}</Text>
              </View>
            ))
          )}
        </View>
      )}
    </ScrollView>
  );
};
