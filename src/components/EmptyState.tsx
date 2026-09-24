import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message?: string;
  description?: string;
}

/**
 * Designed empty state — never show a blank screen.
 * Uses outline icon + short title + supportive message.
 */
export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, message, description }) => {
  const { colors, spacing, fontSizes } = useTheme();

  return (
    <View style={[styles.container, { paddingVertical: spacing.xxxl }]}>
      <Ionicons name={icon} size={48} color={colors.textTertiary} style={styles.icon} />
      <Text style={[styles.title, { color: colors.textSecondary, fontSize: fontSizes.bodyLarge }]}>
        {title}
      </Text>
      <Text style={[styles.message, { color: colors.textTertiary, fontSize: fontSizes.body }]}>
        {message || description || ''}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  icon: {
    marginBottom: 12,
  },
  title: {
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 6,
  },
  message: {
    textAlign: 'center',
    lineHeight: 20,
  },
});
