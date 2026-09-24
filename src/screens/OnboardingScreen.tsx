import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

const ONBOARDING_KEY = '@scriptura_onboarded';

interface OnboardingSlide {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
}

const SLIDES: OnboardingSlide[] = [
  {
    icon: 'book-outline',
    title: 'Read Scripture Offline',
    body: 'Five public-domain translations bundled locally — KJV, ASV, WEB, YLT, and BBE. No internet needed, ever.',
  },
  {
    icon: 'bookmark-outline',
    title: 'Your Personal Library',
    body: 'Bookmark, highlight, and annotate any verse. Everything saves locally and syncs across devices when you sign in.',
  },
  {
    icon: 'sunny-outline',
    title: 'Daily in the Word',
    body: 'Reading plans, verse of the day, and scripture confessions help you stay rooted — at your own pace, no guilt.',
  },
];

interface OnboardingScreenProps {
  onComplete: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const { colors, spacing, radii, fontSizes, fontWeights } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList<OnboardingSlide>>(null);

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
      setCurrentIndex(currentIndex + 1);
    } else {
      handleDone();
    }
  };

  const handleSkip = () => {
    handleDone();
  };

  const handleDone = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true').catch(() => {});
    onComplete();
  };

  const isLast = currentIndex === SLIDES.length - 1;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        skipRow: {
          flexDirection: 'row',
          justifyContent: 'flex-end',
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.xxxl,
        },
        skipText: {
          fontSize: fontSizes.body,
          color: colors.textTertiary,
          fontWeight: fontWeights.semibold,
        },
        slide: {
          width,
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: spacing.xxxl,
        },
        iconWrap: {
          width: 88,
          height: 88,
          borderRadius: 44,
          backgroundColor: colors.surfaceElevated,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing.xxl,
        },
        title: {
          fontSize: fontSizes.h1,
          fontWeight: fontWeights.extrabold,
          color: colors.textPrimary,
          textAlign: 'center',
          marginBottom: spacing.md,
        },
        body: {
          fontSize: fontSizes.bodyLarge,
          color: colors.textSecondary,
          textAlign: 'center',
          lineHeight: 24,
        },
        footer: {
          paddingHorizontal: spacing.xl,
          paddingBottom: spacing.xxxl,
          alignItems: 'center',
        },
        dots: {
          flexDirection: 'row',
          gap: spacing.sm,
          marginBottom: spacing.xl,
        },
        dot: {
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: colors.border,
        },
        dotActive: {
          backgroundColor: colors.primary,
          width: 24,
        },
        nextBtn: {
          backgroundColor: colors.primary,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.xxl,
          borderRadius: radii.md,
          width: '100%',
          alignItems: 'center',
        },
        nextBtnText: {
          color: colors.primaryText,
          fontSize: fontSizes.bodyLarge,
          fontWeight: fontWeights.bold,
        },
      }),
    [colors, spacing, radii, fontSizes, fontWeights],
  );

  return (
    <View style={styles.container}>
      {/* Skip button */}
      <View style={styles.skipRow}>
        {!isLast && (
          <TouchableOpacity onPress={handleSkip}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <View style={styles.iconWrap}>
              <Ionicons name={item.icon} size={40} color={colors.textPrimary} />
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.body}>{item.body}</Text>
          </View>
        )}
      />

      {/* Footer: dots + button */}
      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[styles.dot, i === currentIndex && styles.dotActive]} />
          ))}
        </View>

        <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
          <Text style={styles.nextBtnText}>
            {isLast ? 'Start Reading' : 'Continue'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

/** Check if user has completed onboarding. */
export const hasCompletedOnboarding = async (): Promise<boolean> => {
  try {
    const val = await AsyncStorage.getItem(ONBOARDING_KEY);
    return val === 'true';
  } catch {
    return false;
  }
};
