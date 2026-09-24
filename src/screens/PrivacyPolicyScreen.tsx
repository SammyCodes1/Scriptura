import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { hapticHeavy } from '../utils/haptics';

export const PrivacyPolicyScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors, spacing, radii, fontSizes, fontWeights, fonts } = useTheme();
  const { user, isGuest, deleteAccountAndAllData } = useAuth();

  const handleDeleteDataPrompt = () => {
    Alert.alert(
      'Delete Account & All Data',
      'This will permanently delete all your personal notes, verse highlights, bookmarks, reading history, and confession progress from this device and our servers. This action cannot be undone.\n\nAre you sure you want to proceed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Permanently Delete',
          style: 'destructive',
          onPress: async () => {
            hapticHeavy();
            try {
              await deleteAccountAndAllData();
              Alert.alert(
                'Data Erased',
                'All personal data, notes, and account records have been permanently wiped.',
                [{ text: 'OK', onPress: () => navigation.navigate('Home') }]
              );
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to delete all data.');
            }
          },
        },
      ]
    );
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        content: {
          padding: spacing.lg,
          paddingBottom: spacing.xxxl * 2,
        },
        badgeRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          alignSelf: 'flex-start',
          backgroundColor: colors.surfaceElevated,
          paddingVertical: 4,
          paddingHorizontal: spacing.sm,
          borderRadius: radii.sm,
          marginBottom: spacing.sm,
        },
        badgeText: {
          fontSize: fontSizes.caption,
          fontWeight: fontWeights.bold,
          color: colors.primary,
        },
        title: {
          fontSize: fontSizes.xxl,
          fontWeight: fontWeights.extrabold,
          color: colors.textPrimary,
          marginBottom: 4,
          fontFamily: fonts.sans,
        },
        lastUpdated: {
          fontSize: fontSizes.caption,
          color: colors.textTertiary,
          marginBottom: spacing.xl,
          fontFamily: fonts.sans,
        },
        sectionCard: {
          backgroundColor: colors.surface,
          borderRadius: radii.lg,
          padding: spacing.lg,
          borderWidth: 1,
          borderColor: colors.borderLight,
          marginBottom: spacing.lg,
        },
        sectionHeading: {
          fontSize: fontSizes.md,
          fontWeight: fontWeights.bold,
          color: colors.textPrimary,
          marginBottom: spacing.sm,
          fontFamily: fonts.sans,
        },
        bodyText: {
          fontSize: fontSizes.sm,
          lineHeight: 22,
          color: colors.textSecondary,
          fontFamily: fonts.sans,
          marginBottom: spacing.sm,
        },
        bulletItem: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: spacing.sm,
          marginBottom: spacing.sm,
        },
        bulletDot: {
          marginTop: 6,
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: colors.primary,
        },
        bulletText: {
          flex: 1,
          fontSize: fontSizes.sm,
          lineHeight: 20,
          color: colors.textSecondary,
          fontFamily: fonts.sans,
        },
        strong: {
          fontWeight: fontWeights.bold,
          color: colors.textPrimary,
        },
        noticeBox: {
          backgroundColor: colors.warningLight,
          borderRadius: radii.md,
          padding: spacing.md,
          marginTop: spacing.sm,
          borderLeftWidth: 4,
          borderLeftColor: colors.warning,
        },
        noticeText: {
          fontSize: fontSizes.caption,
          lineHeight: 18,
          color: colors.warning,
          fontFamily: fonts.sans,
        },
        dangerZone: {
          backgroundColor: colors.errorLight,
          borderRadius: radii.lg,
          padding: spacing.lg,
          borderWidth: 1,
          borderColor: colors.error,
          marginTop: spacing.md,
          marginBottom: spacing.xl,
        },
        dangerTitle: {
          fontSize: fontSizes.md,
          fontWeight: fontWeights.bold,
          color: colors.error,
          marginBottom: spacing.xs,
        },
        dangerDesc: {
          fontSize: fontSizes.caption,
          lineHeight: 18,
          color: colors.textPrimary,
          marginBottom: spacing.md,
        },
        deleteBtn: {
          backgroundColor: colors.error,
          minHeight: 44,
          minWidth: 44,
          borderRadius: radii.md,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.sm,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.lg,
        },
        deleteBtnText: {
          color: '#FFFFFF',
          fontSize: fontSizes.sm,
          fontWeight: fontWeights.bold,
          fontFamily: fonts.sans,
        },
      }),
    [colors, spacing, radii, fontSizes, fontWeights, fonts]
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.badgeRow}>
        <Ionicons name="shield-checkmark-outline" size={14} color={colors.primary} />
        <Text style={styles.badgeText}>DATA PROTECTION & PRIVACY</Text>
      </View>

      <Text style={styles.title}>Privacy Policy</Text>
      <Text style={styles.lastUpdated}>Effective Date: September 24, 2026</Text>

      {/* Philosophy */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionHeading}>Our Privacy Commitment</Text>
        <Text style={styles.bodyText}>
          Scriptura is designed as a calm, quiet, and reverent space for reading, meditating on, and studying the Holy Scriptures. We believe your spiritual reflections, prayers, and study notes are intensely personal.
        </Text>
        <Text style={styles.bodyText}>
          We do not sell your personal data. We do not deploy third-party advertising tracking SDKs, data brokers, or behavioral ad profiling.
        </Text>
      </View>

      {/* 1. What Information Is Stored */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionHeading}>1. What Information Is Stored</Text>

        <View style={styles.bulletItem}>
          <View style={styles.bulletDot} />
          <Text style={styles.bulletText}>
            <Text style={styles.strong}>Personal Notes & Reflections:</Text> Notes you write on any scripture verse are stored in an encrypted local SQLite database on your device. When signed into an account, they sync over TLS 1.3 to private cloud storage secured with Row-Level Security (RLS).
          </Text>
        </View>

        <View style={styles.bulletItem}>
          <View style={styles.bulletDot} />
          <Text style={styles.bulletText}>
            <Text style={styles.strong}>Highlights & Bookmarks:</Text> Color-coded verse highlights and saved bookmarks remain private to your local device and account.
          </Text>
        </View>

        <View style={styles.bulletItem}>
          <View style={styles.bulletDot} />
          <Text style={styles.bulletText}>
            <Text style={styles.strong}>Reading History & Streaks:</Text> Chapters you read and low-guilt milestone streaks are tracked to help you resume where you left off.
          </Text>
        </View>

        <View style={styles.bulletItem}>
          <View style={styles.bulletDot} />
          <Text style={styles.bulletText}>
            <Text style={styles.strong}>Daily Confessions & Decks:</Text> Your recitation milestones and custom declaration decks are stored privately.
          </Text>
        </View>

        <View style={styles.bulletItem}>
          <View style={styles.bulletDot} />
          <Text style={styles.bulletText}>
            <Text style={styles.strong}>Account Credentials:</Text> If you choose to create an account, only your email address and authentication tokens are stored to sync your library across devices. Guest mode operates 100% locally with zero required signup.
          </Text>
        </View>
      </View>

      {/* 2. Prayer Wall & Community Posts */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionHeading}>2. Community & Prayer Wall Disclosure</Text>
        <Text style={styles.bodyText}>
          Scriptura includes an optional Community Prayer Wall where believers can pray for one another and share testimonies.
        </Text>

        <View style={styles.noticeBox}>
          <Text style={styles.noticeText}>
            <Text style={styles.strong}>Public Sharing Notice:</Text> Any prayer request or testimony you choose to submit to the Prayer Wall is public to all members of the Scriptura community so that others may pray in agreement with you. Do not include sensitive private details, medical identifiers, or third-party private information in public prayer posts. Personal study notes and verse highlights are never posted to the prayer wall.
          </Text>
        </View>
      </View>

      {/* 3. Offline Mode & Remote APIs */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionHeading}>3. Offline Reading & Remote APIs</Text>
        <Text style={styles.bodyText}>
          Scriptura is engineered with offline-first local SQLite architecture. Bundled public-domain Bibles (KJV, ASV, WEB, YLT, BBE), personal notes, bookmarks, and sacred geography maps operate 100% offline without sending network requests.
        </Text>
        <Text style={styles.bodyText}>
          When requesting remote translations or streaming audio via partner services (e.g. API.Bible or Faith Comes By Hearing Bible Brain), queries request only the scripture chapter identifier. Your personal identity, annotations, and reading streaks are never shared with these external API providers.
        </Text>
      </View>

      {/* 4. How to Delete Account and Data */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionHeading}>4. Account & Data Deletion (Right to Erasure)</Text>
        <Text style={styles.bodyText}>
          You maintain full ownership and control over your data. In full compliance with Apple App Store guidelines, Google Play policies, GDPR, and CCPA, you can completely erase your data at any time:
        </Text>

        <View style={styles.bulletItem}>
          <View style={styles.bulletDot} />
          <Text style={styles.bulletText}>
            <Text style={styles.strong}>Self-Service Instant Erasure:</Text> Tap the "Delete Account & All Data" button below. This immediately purges all local SQLite databases, clears local device storage, removes cached files, and deletes your cloud account record.
          </Text>
        </View>

        <View style={styles.bulletItem}>
          <View style={styles.bulletDot} />
          <Text style={styles.bulletText}>
            <Text style={styles.strong}>Support Contact:</Text> You may also submit a data deletion request by emailing <Text style={styles.strong}>privacy@scriptura.app</Text> or via the in-app support channel.
          </Text>
        </View>
      </View>

      {/* 5. Security & Retention */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionHeading}>5. Data Security & Storage</Text>
        <Text style={styles.bodyText}>
          All network communications utilize industry-standard TLS 1.3 encryption. Cloud-synced user records are protected by database row-level security policies preventing unauthorized access. We retain your data only for as long as your account remains active or until you request deletion.
        </Text>
      </View>

      {/* Danger Zone: Erase Data Button */}
      <View style={styles.dangerZone}>
        <Text style={styles.dangerTitle}>Erase Personal Data & Account</Text>
        <Text style={styles.dangerDesc}>
          {user
            ? `Signed in as ${user.email}. Deleting will permanently wipe your cloud account and all local notes, highlights, bookmarks, and history on this device.`
            : 'You are in Guest Mode. Deleting will permanently erase all local notes, bookmarks, highlights, reading history, and custom decks on this device.'}
        </Text>

        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={handleDeleteDataPrompt}
          accessibilityRole="button"
          accessibilityLabel="Delete Account and Permanently Wipe All Data"
          accessibilityHint="Wipes all notes, bookmarks, reading history, and deletes your user account"
        >
          <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
          <Text style={styles.deleteBtnText}>Delete Account & All Data</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};
