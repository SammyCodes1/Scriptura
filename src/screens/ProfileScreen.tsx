import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ENV } from '../config/env';
import { isSupabaseConfigured } from '../services/supabase/client';
import { Ionicons } from '@expo/vector-icons';
import { THEME_LABELS, THEME_DETAILS, THEMES, ThemeName, FONT_STYLES, FontStyleId } from '../theme';
import { hapticSelection } from '../utils/haptics';

export const ProfileScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const {
    user,
    isGuest,
    signInWithEmail,
    signUpWithEmail,
    signInWithOAuth,
    signOut,
    deleteAccountAndAllData,
    triggerSync,
  } = useAuth();
  const {
    colors,
    spacing,
    radii,
    fontSizes,
    fontWeights,
    themeName,
    setThemeName,
    scriptureFontSize,
    setScriptureFontSize,
    scriptureLineHeight,
    scriptureFontStyle,
    setScriptureFontStyle,
    activeScriptureFontFamily,
  } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const handleEmailAuth = async () => {
    if (!email || !password) {
      Alert.alert('Required Fields', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      const res = isSignUp
        ? await signUpWithEmail(email, password)
        : await signInWithEmail(email, password);

      if (res.error) {
        Alert.alert('Authentication Error', res.error.message);
      } else {
        Alert.alert(
          isSignUp ? 'Account Created' : 'Signed In',
          isSignUp ? 'Please check your email if confirmation is required.' : 'Welcome back!'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'apple') => {
    setLoading(true);
    try {
      const { error } = await signInWithOAuth(provider);
      if (error) {
        Alert.alert('OAuth Error', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleManualSync = async () => {
    setSyncStatus('Syncing local highlights, bookmarks, and notes to Supabase...');
    try {
      await triggerSync();
      setSyncStatus('Sync completed successfully.');
    } catch (e: any) {
      setSyncStatus(`Sync error: ${e.message}`);
    }
  };

  const handleDeleteAccountPrompt = () => {
    Alert.alert(
      'Delete Account & All Data',
      'This will permanently delete all your personal notes, highlights, bookmarks, reading history, plan progress, and confessions. This action cannot be undone.\n\nAre you sure you want to proceed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Permanently Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccountAndAllData();
              Alert.alert(
                'Data Erased',
                'All personal data, notes, and account records have been permanently wiped from this device.',
                [{ text: 'OK', onPress: () => navigation.navigate('Home') }]
              );
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to delete data.');
            }
          },
        },
      ]
    );
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.background },
        content: { padding: spacing.lg },
        title: { fontSize: fontSizes.xl, fontWeight: fontWeights.bold, color: colors.textPrimary, marginBottom: spacing.lg },
        card: {
          backgroundColor: colors.surface,
          padding: spacing.lg,
          borderRadius: radii.lg,
          borderWidth: 1,
          borderColor: colors.border,
          marginBottom: spacing.lg,
        },
        cardHeading: { fontSize: fontSizes.md, fontWeight: fontWeights.bold, color: colors.textPrimary, marginBottom: spacing.md },
        statusRow: { fontSize: fontSizes.sm, color: colors.textSecondary, marginBottom: 6 },
        userEmail: { fontSize: fontSizes.md, fontWeight: fontWeights.semibold, color: colors.textPrimary, marginBottom: 4 },
        userId: { fontSize: fontSizes.xs, color: colors.textTertiary, marginBottom: spacing.lg },
        syncBtn: {
          backgroundColor: colors.success,
          paddingVertical: spacing.md,
          borderRadius: radii.md,
          alignItems: 'center',
          marginBottom: spacing.md,
        },
        syncBtnText: { color: colors.surface, fontWeight: fontWeights.semibold, fontSize: fontSizes.sm },
        syncStatus: { fontSize: fontSizes.xs, color: colors.success, marginBottom: spacing.md, textAlign: 'center' },
        signOutBtn: {
          backgroundColor: colors.errorLight,
          paddingVertical: spacing.md,
          borderRadius: radii.md,
          alignItems: 'center',
        },
        signOutBtnText: { color: colors.error, fontWeight: fontWeights.semibold, fontSize: fontSizes.sm },
        guestNotice: {
          backgroundColor: colors.warningLight,
          padding: spacing.md,
          borderRadius: radii.md,
          marginBottom: spacing.lg,
        },
        guestNoticeTitle: { fontSize: fontSizes.sm, fontWeight: fontWeights.bold, color: colors.warning, marginBottom: 4 },
        guestNoticeText: { fontSize: fontSizes.sm, color: colors.warning, lineHeight: 18 },
        authTitle: { fontSize: fontSizes.md, fontWeight: fontWeights.bold, color: colors.textPrimary, marginBottom: spacing.md },
        input: {
          backgroundColor: colors.surfaceElevated,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radii.md,
          padding: spacing.md,
          fontSize: fontSizes.sm,
          color: colors.textPrimary,
          marginBottom: spacing.md,
        },
        primaryBtn: {
          backgroundColor: colors.primary,
          paddingVertical: spacing.md,
          borderRadius: radii.md,
          alignItems: 'center',
          marginTop: 6,
        },
        primaryBtnText: { color: colors.primaryText, fontWeight: fontWeights.semibold, fontSize: fontSizes.sm },
        toggleBtn: { alignItems: 'center', marginTop: spacing.md },
        toggleBtnText: { color: colors.textSecondary, fontSize: fontSizes.sm },
        divider: { flexDirection: 'row', alignItems: 'center', marginVertical: spacing.lg },
        dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
        dividerText: { marginHorizontal: 10, color: colors.textTertiary, fontSize: fontSizes.xs },
        socialButtons: { flexDirection: 'row', gap: 10 },
        socialBtn: {
          flex: 1,
          backgroundColor: colors.surfaceElevated,
          borderWidth: 1,
          borderColor: colors.border,
          paddingVertical: spacing.md,
          borderRadius: radii.md,
          alignItems: 'center',
        },
        socialBtnText: { fontWeight: fontWeights.semibold, color: colors.textPrimary },
        themeGrid: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: spacing.sm,
          marginTop: spacing.xs,
        },
        themeCard: {
          width: '48%',
          padding: spacing.md,
          borderRadius: radii.lg,
          borderWidth: 1.5,
          borderColor: colors.border,
          backgroundColor: colors.surfaceElevated,
        },
        themeCardActive: {
          borderColor: colors.primary,
          backgroundColor: colors.surface,
          borderWidth: 2,
        },
        themeCardHeader: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: spacing.xs,
        },
        themeSwatch: {
          width: 34,
          height: 24,
          borderRadius: radii.sm,
          borderWidth: 1,
          justifyContent: 'center',
          alignItems: 'center',
        },
        themeSwatchLetter: {
          fontSize: 11,
          fontWeight: fontWeights.bold,
        },
        themeCardLabel: {
          fontSize: fontSizes.sm,
          fontWeight: fontWeights.bold,
          color: colors.textPrimary,
          marginBottom: 3,
        },
        themeCardDesc: {
          fontSize: 11,
          color: colors.textSecondary,
          lineHeight: 14,
        },
        fontControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm },
        fontBtn: {
          backgroundColor: colors.surfaceElevated,
          padding: spacing.md,
          borderRadius: radii.md,
          borderWidth: 1,
          borderColor: colors.border,
        },
        fontValueText: { fontSize: fontSizes.md, fontWeight: fontWeights.bold, color: colors.textPrimary },
        fontStyleSelector: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: spacing.sm,
          marginTop: spacing.xs,
        },
        fontStyleChip: {
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.md,
          borderRadius: radii.md,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surfaceElevated,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
        },
        fontStyleChipActive: {
          borderColor: colors.primary,
          backgroundColor: colors.surface,
          borderWidth: 2,
        },
        fontStyleChipText: {
          fontSize: fontSizes.sm,
          fontWeight: fontWeights.semibold,
          color: colors.textSecondary,
        },
        fontStyleChipTextActive: {
          color: colors.textPrimary,
          fontWeight: fontWeights.bold,
        },
        fontPresetRow: {
          flexDirection: 'row',
          gap: spacing.xs,
          marginTop: spacing.sm,
        },
        fontPresetBtn: {
          flex: 1,
          paddingVertical: 8,
          alignItems: 'center',
          borderRadius: radii.sm,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surfaceElevated,
        },
        fontPresetBtnActive: {
          backgroundColor: colors.primary,
          borderColor: colors.primary,
        },
        fontPresetText: {
          fontSize: fontSizes.caption,
          fontWeight: fontWeights.medium,
          color: colors.textSecondary,
        },
        fontPresetTextActive: {
          color: colors.primaryText,
          fontWeight: fontWeights.bold,
        },
        previewContainer: {
          marginTop: spacing.lg,
          padding: spacing.md,
          borderRadius: radii.lg,
          backgroundColor: colors.surfaceElevated,
          borderWidth: 1,
          borderColor: colors.borderLight,
        },
        previewLabel: {
          fontSize: fontSizes.caption,
          fontWeight: fontWeights.bold,
          color: colors.textTertiary,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          marginBottom: spacing.xs,
        },
        previewVerseText: {
          color: colors.scriptureText,
        },
        previewRefText: {
          fontSize: fontSizes.caption,
          color: colors.textSecondary,
          fontStyle: 'italic',
          marginTop: spacing.xs,
          textAlign: 'right',
        },
        manageDownloadsBtn: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: colors.surfaceElevated,
          padding: spacing.md,
          minHeight: 48,
          borderRadius: radii.md,
          borderWidth: 1,
          borderColor: colors.border,
          marginTop: spacing.md,
        },
        manageDownloadsText: { fontSize: fontSizes.sm, fontWeight: fontWeights.semibold, color: colors.textPrimary },
        deleteAccountBtn: {
          backgroundColor: colors.error,
          minHeight: 48,
          borderRadius: radii.md,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.sm,
          paddingVertical: spacing.md,
          marginTop: spacing.md,
        },
        deleteAccountBtnText: {
          color: '#FFFFFF',
          fontSize: fontSizes.sm,
          fontWeight: fontWeights.bold,
        },
      }),
    [colors, spacing, radii, fontSizes, fontWeights, scriptureFontSize, scriptureLineHeight, activeScriptureFontFamily]
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Account & Settings</Text>

      {/* Reading Appearance & Typography Settings */}
      <View style={styles.card}>
        <Text style={styles.cardHeading}>Typography & Reading Appearance</Text>

        {/* 1. Theme Selection */}
        <Text style={[styles.statusRow, { marginTop: spacing.sm, fontWeight: fontWeights.bold }]}>
          Theme & Contrast (6 Eye-Friendly Modes)
        </Text>
        <View style={styles.themeGrid}>
          {(Object.keys(THEMES) as ThemeName[]).map(t => {
            const detail = THEME_DETAILS[t];
            const isActive = themeName === t;
            return (
              <TouchableOpacity
                key={t}
                style={[styles.themeCard, isActive && styles.themeCardActive]}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel={`${detail.label} theme. ${detail.description}`}
                accessibilityState={{ selected: isActive }}
                onPress={() => {
                  hapticSelection();
                  setThemeName(t);
                }}
              >
                <View style={styles.themeCardHeader}>
                  <View
                    style={[
                      styles.themeSwatch,
                      {
                        backgroundColor: detail.previewBg,
                        borderColor: isActive ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text style={[styles.themeSwatchLetter, { color: detail.previewText }]}>
                      Aa
                    </Text>
                  </View>
                  <Ionicons
                    name={isActive ? 'checkmark-circle' : 'ellipse-outline'}
                    size={18}
                    color={isActive ? colors.primary : colors.textTertiary}
                  />
                </View>
                <Text style={styles.themeCardLabel}>{detail.label}</Text>
                <Text style={styles.themeCardDesc} numberOfLines={2}>
                  {detail.description}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 2. Typeface / Font Style Selection */}
        <Text style={[styles.statusRow, { marginTop: spacing.lg, fontWeight: fontWeights.bold }]}>
          Scripture Typeface (Font Style)
        </Text>
        <View style={styles.fontStyleSelector}>
          {(Object.keys(FONT_STYLES) as FontStyleId[]).map(styleKey => {
            const opt = FONT_STYLES[styleKey];
            const isActive = scriptureFontStyle === styleKey;
            return (
              <TouchableOpacity
                key={styleKey}
                style={[styles.fontStyleChip, isActive && styles.fontStyleChipActive]}
                accessibilityRole="button"
                accessibilityLabel={`${opt.label} typeface, ${opt.category}`}
                accessibilityState={{ selected: isActive }}
                onPress={() => {
                  hapticSelection();
                  setScriptureFontStyle(styleKey);
                }}
              >
                <Ionicons
                  name={isActive ? 'checkmark-circle' : 'ellipse-outline'}
                  size={16}
                  color={isActive ? colors.primary : colors.textTertiary}
                />
                <Text
                  style={[
                    styles.fontStyleChipText,
                    isActive && styles.fontStyleChipTextActive,
                    opt.fontFamily ? { fontFamily: opt.fontFamily } : undefined,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 3. Scripture Font Size Controller & Presets */}
        <Text style={[styles.statusRow, { marginTop: spacing.lg, fontWeight: fontWeights.bold }]}>
          Scripture Font Size
        </Text>
        <View style={styles.fontControls}>
          <TouchableOpacity
            style={styles.fontBtn}
            accessibilityRole="button"
            accessibilityLabel="Decrease scripture font size"
            onPress={() => {
              hapticSelection();
              setScriptureFontSize(Math.max(15, scriptureFontSize - 1));
            }}
          >
            <Ionicons name="remove" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.fontValueText} accessibilityLabel={`Current font size ${scriptureFontSize} pixels`}>
            {scriptureFontSize}px
          </Text>
          <TouchableOpacity
            style={styles.fontBtn}
            accessibilityRole="button"
            accessibilityLabel="Increase scripture font size"
            onPress={() => {
              hapticSelection();
              setScriptureFontSize(Math.min(28, scriptureFontSize + 1));
            }}
          >
            <Ionicons name="add" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Quick Size Presets */}
        <View style={styles.fontPresetRow}>
          {[
            { label: '15 Compact', size: 15 },
            { label: '17 Standard', size: 17 },
            { label: '20 Comfort', size: 20 },
            { label: '24 Large', size: 24 },
            { label: '28 XL', size: 28 },
          ].map(p => {
            const isPresetActive = scriptureFontSize === p.size;
            return (
              <TouchableOpacity
                key={p.size}
                style={[styles.fontPresetBtn, isPresetActive && styles.fontPresetBtnActive]}
                accessibilityRole="button"
                accessibilityLabel={`Set font size to ${p.label}`}
                accessibilityState={{ selected: isPresetActive }}
                onPress={() => {
                  hapticSelection();
                  setScriptureFontSize(p.size);
                }}
              >
                <Text
                  style={[styles.fontPresetText, isPresetActive && styles.fontPresetTextActive]}
                >
                  {p.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 4. Live Scripture Preview Card */}
        <View style={styles.previewContainer}>
          <Text style={styles.previewLabel}>Live Reading Preview</Text>
          <Text
            style={[
              styles.previewVerseText,
              {
                fontSize: scriptureFontSize,
                lineHeight: scriptureLineHeight,
                fontFamily: activeScriptureFontFamily,
              },
            ]}
          >
            "Your word is a lamp to my feet and a light to my path."
          </Text>
          <Text style={styles.previewRefText}>— Psalm 119:105</Text>
        </View>

        {/* Offline Translations Navigation */}
        <TouchableOpacity
          style={styles.manageDownloadsBtn}
          onPress={() => navigation.navigate('Downloads')}
          accessibilityRole="button"
          accessibilityLabel="Manage offline translations"
          accessibilityHint="View and download offline Bible translations"
        >
          <Text style={styles.manageDownloadsText}>Manage Offline Translations</Text>
          <Ionicons name="arrow-forward" size={18} color={colors.textTertiary} />
        </TouchableOpacity>

        {/* Privacy Policy & Data Rights Navigation */}
        <TouchableOpacity
          style={styles.manageDownloadsBtn}
          onPress={() => navigation.navigate('PrivacyPolicy')}
          accessibilityRole="button"
          accessibilityLabel="Privacy Policy and Data Protection"
          accessibilityHint="View what is stored, prayer wall disclosures, and data rights"
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <Ionicons name="shield-checkmark-outline" size={18} color={colors.primary} />
            <Text style={styles.manageDownloadsText}>Privacy Policy & Data Rights</Text>
          </View>
          <Ionicons name="arrow-forward" size={18} color={colors.textTertiary} />
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardHeading}>System Configuration</Text>
        <Text style={styles.statusRow}>
          Supabase Backend:{' '}
          <Text style={{ fontWeight: '700', color: isSupabaseConfigured ? colors.success : colors.warning }}>
            {isSupabaseConfigured ? 'Configured' : 'Offline / Standalone Mode'}
          </Text>
        </Text>
        <Text style={styles.statusRow}>
          Commercial Flag (IS_COMMERCIAL):{' '}
          <Text style={{ fontWeight: '700', color: ENV.IS_COMMERCIAL ? colors.error : colors.primary }}>
            {ENV.IS_COMMERCIAL ? 'TRUE (NIV Excluded)' : 'FALSE (Free Key Mode)'}
          </Text>
        </Text>
        <Text style={styles.statusRow}>
          API.Bible Key:{' '}
          <Text style={{ fontWeight: '700', color: ENV.API_BIBLE_KEY ? colors.success : colors.textTertiary }}>
            {ENV.API_BIBLE_KEY ? 'Set via Environment' : 'Demo / Mock Fallback'}
          </Text>
        </Text>
      </View>

      {user ? (
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Signed In Account</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          <Text style={styles.userId}>ID: {user.id}</Text>

          <TouchableOpacity
            style={styles.syncBtn}
            onPress={handleManualSync}
            accessibilityRole="button"
            accessibilityLabel="Sync local data to Supabase cloud"
          >
            <Text style={styles.syncBtnText}>Sync Local Data to Supabase</Text>
          </TouchableOpacity>

          {syncStatus && <Text style={styles.syncStatus}>{syncStatus}</Text>}

          <TouchableOpacity
            style={styles.signOutBtn}
            onPress={signOut}
            accessibilityRole="button"
            accessibilityLabel="Sign out of account"
          >
            <Text style={styles.signOutBtnText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.card}>
          <View style={styles.guestNotice}>
            <Text style={styles.guestNoticeTitle}>Guest Mode</Text>
            <Text style={styles.guestNoticeText}>
              You are currently using Scriptura in local guest mode. Bookmarking, notes, and reading
              history work offline. Create an account to sync your library across all devices.
            </Text>
          </View>

          <Text style={styles.authTitle}>
            {isSignUp ? 'Create a Free Account' : 'Sign In with Email'}
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Email address"
            placeholderTextColor={colors.textTertiary}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            accessibilityLabel="Email address input"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={colors.textTertiary}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            accessibilityLabel="Password input"
          />

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={handleEmailAuth}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel={isSignUp ? 'Sign up for free account' : 'Sign in to account'}
          >
            {loading ? (
              <ActivityIndicator color={colors.primaryText} />
            ) : (
              <Text style={styles.primaryBtnText}>{isSignUp ? 'Sign Up' : 'Sign In'}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setIsSignUp(!isSignUp)}
            style={styles.toggleBtn}
            accessibilityRole="button"
            accessibilityLabel={isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          >
            <Text style={styles.toggleBtnText}>
              {isSignUp
                ? 'Already have an account? Sign In'
                : "Don't have an account? Sign Up"}
            </Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.socialButtons}>
            <TouchableOpacity
              style={styles.socialBtn}
              onPress={() => handleSocialLogin('google')}
              accessibilityRole="button"
              accessibilityLabel="Continue with Google"
            >
              <Text style={styles.socialBtnText}>Google</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.socialBtn}
              onPress={() => handleSocialLogin('apple')}
              accessibilityRole="button"
              accessibilityLabel="Continue with Apple"
            >
              <Text style={styles.socialBtnText}>Apple</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Privacy, Data Rights & Account Deletion Card */}
      <View style={[styles.card, { borderColor: colors.borderLight }]}>
        <Text style={styles.cardHeading}>Data Rights & Account Deletion</Text>
        <Text style={styles.statusRow}>
          Scriptura is built privacy-first. Your personal notes, highlights, bookmarks, and confessions stay on your device.
        </Text>
        <Text style={[styles.statusRow, { fontSize: fontSizes.caption, color: colors.textTertiary, lineHeight: 18 }]}>
          • Personal notes & highlights: Private to your device / account{'\n'}
          • Prayer Wall requests: Public to community members{'\n'}
          • Self-service erasure: Wipe all personal data anytime
        </Text>

        <TouchableOpacity
          style={styles.deleteAccountBtn}
          onPress={handleDeleteAccountPrompt}
          accessibilityRole="button"
          accessibilityLabel="Permanently Delete Account and Wipe All Data"
          accessibilityHint="Erases all notes, bookmarks, highlights, and deletes account records"
        >
          <Ionicons name="trash-outline" size={16} color="#FFFFFF" />
          <Text style={styles.deleteAccountBtnText}>Delete Account & Wipe All Data</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};
