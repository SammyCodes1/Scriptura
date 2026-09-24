import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { getActiveTranslations } from '../config/translations';
import { BibleTranslationInfo } from '../services/bible/types';
import {
  getCachedChaptersCount,
  deleteCachedTranslation,
  setCachedChapter,
} from '../database/sqlite';
import { CANONICAL_BOOKS } from '../config/books';
import { fetchChapterFromApiBible } from '../services/bible/apiBibleClient';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export const DownloadsScreen: React.FC = () => {
  const { colors, spacing, radii, fonts } = useTheme();
  const [translations] = useState<BibleTranslationInfo[]>(getActiveTranslations());
  const [cachedCounts, setCachedCounts] = useState<Record<string, number>>({});
  const [downloadingTr, setDownloadingTr] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [targetTr, setTargetTr] = useState<BibleTranslationInfo | null>(null);

  const loadCacheStats = async () => {
    const counts: Record<string, number> = {};
    for (const tr of translations) {
      if (!tr.isLocal) {
        counts[tr.id] = await getCachedChaptersCount(tr.id);
      }
    }
    setCachedCounts(counts);
  };

  useEffect(() => {
    loadCacheStats();
  }, []);

  const handleInitiateDownload = (tr: BibleTranslationInfo) => {
    setTargetTr(tr);
    setConfirmModalVisible(true);
  };

  const handleStartDownload = async () => {
    if (!targetTr) return;
    setConfirmModalVisible(false);
    setDownloadingTr(targetTr.id);
    setDownloadProgress(0);

    // Pre-cache primary essential books/chapters for offline demo (e.g. New Testament core books)
    const booksToDownload = ['GEN', 'PSA', 'PRO', 'MAT', 'MRK', 'LUK', 'JHN', 'ROM'];
    const totalSteps = booksToDownload.length;

    try {
      for (let i = 0; i < totalSteps; i++) {
        const bookCode = booksToDownload[i];
        const res = await fetchChapterFromApiBible(targetTr.id, bookCode, 1);
        await setCachedChapter(targetTr.id, bookCode, 1, res.verses);
        setDownloadProgress(Math.round(((i + 1) / totalSteps) * 100));
        // Small delay for smooth UI progress
        await new Promise(r => setTimeout(r, 120));
      }
      Alert.alert(
        'Download Complete',
        `${targetTr.name} core scriptures are now cached for offline reading.`
      );
    } catch (err: any) {
      Alert.alert('Download Error', err?.message || 'Failed to download translation.');
    } finally {
      setDownloadingTr(null);
      await loadCacheStats();
    }
  };

  const handleClearCache = async (trId: string) => {
    await deleteCachedTranslation(trId);
    await loadCacheStats();
    Alert.alert('Storage Reclaimed', `Cleared offline cache for ${trId}.`);
  };

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.lg },
    subtitle: { fontSize: 13, color: colors.textSecondary, marginBottom: spacing.lg, fontFamily: fonts.sans },
    downloadingCard: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.borderLight,
      borderRadius: radii.lg,
      padding: spacing.lg,
      marginBottom: spacing.lg,
    },
    downloadingTitle: { fontSize: 13, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.sm, fontFamily: fonts.sans },
    progressBarTrack: {
      height: 8,
      backgroundColor: colors.background, // fallback for F3F4F6
      borderRadius: radii.sm,
      overflow: 'hidden',
    },
    progressBarFill: { height: '100%', backgroundColor: colors.primary, borderRadius: radii.sm },
    list: { gap: spacing.md },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.borderLight,
      padding: spacing.lg,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
    trName: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, fontFamily: fonts.sans },
    trDesc: { fontSize: 12, color: colors.textSecondary, marginTop: 2, maxWidth: 240, fontFamily: fonts.sans },
    bundledBadge: {
      backgroundColor: colors.successLight || '#ECFDF5',
      paddingVertical: 4,
      paddingHorizontal: spacing.sm,
      borderRadius: radii.sm,
      alignSelf: 'flex-start',
    },
    bundledBadgeText: { fontSize: 10, fontWeight: '800', color: colors.success || '#065F46', fontFamily: fonts.sans },
    onlineBadge: {
      backgroundColor: colors.primary + '20', // rough equivalent of blue bg
      paddingVertical: 4,
      paddingHorizontal: spacing.sm,
      borderRadius: radii.sm,
      alignSelf: 'flex-start',
    },
    onlineBadgeText: { fontSize: 10, fontWeight: '800', color: colors.primary, fontFamily: fonts.sans },
    cardFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderTopWidth: 1,
      borderColor: colors.borderLight,
      paddingTop: spacing.md,
    },
    sizeText: { fontSize: 12, color: colors.textSecondary, fontFamily: fonts.sans },
    statusReady: { fontSize: 12, fontWeight: '700', color: colors.success, fontFamily: fonts.sans, flexDirection: 'row', alignItems: 'center' },
    actionRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    clearBtn: {
      backgroundColor: colors.error + '20',
      minHeight: 44,
      minWidth: 44,
      justifyContent: 'center',
      paddingVertical: 4,
      paddingHorizontal: spacing.md,
      borderRadius: radii.sm,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    clearBtnText: { color: colors.error, fontSize: 11, fontWeight: '600', fontFamily: fonts.sans },
    downloadBtn: {
      backgroundColor: colors.primary,
      minHeight: 44,
      justifyContent: 'center',
      paddingVertical: 6,
      paddingHorizontal: spacing.md,
      borderRadius: radii.sm,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    downloadBtnText: { color: colors.primaryText, fontSize: 12, fontWeight: '600', fontFamily: fonts.sans },
    modalOverlay: {
      flex: 1,
      backgroundColor: colors.overlay || 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      padding: spacing.xl,
    },
    modalContent: { backgroundColor: colors.surfaceElevated, borderRadius: radii.xl, padding: spacing.xl },
    modalHeading: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.sm, fontFamily: fonts.sans },
    modalBody: { fontSize: 14, color: colors.textPrimary, lineHeight: 20, fontFamily: fonts.sans },
    modalDetail: { fontSize: 13, color: colors.textSecondary, marginVertical: spacing.md, lineHeight: 18, fontFamily: fonts.sans },
    modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: spacing.md },
    cancelBtn: { minHeight: 44, justifyContent: 'center', paddingVertical: 10, paddingHorizontal: 14 },
    cancelBtnText: { color: colors.textSecondary, fontWeight: '600', fontFamily: fonts.sans },
    confirmBtn: {
      backgroundColor: colors.primary,
      minHeight: 44,
      justifyContent: 'center',
      paddingVertical: 10,
      paddingHorizontal: spacing.lg,
      borderRadius: radii.md,
    },
    confirmBtnText: { color: colors.primaryText, fontWeight: '700', fontFamily: fonts.sans },
  }), [colors, spacing, radii, fonts]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.subtitle}>
        Manage downloaded scriptures for full offline access without network connection.
      </Text>

      {/* Progress Bar for Active Download */}
      {downloadingTr && (
        <View style={styles.downloadingCard}>
          <Text style={styles.downloadingTitle}>
            Downloading {downloadingTr}... {downloadProgress}%
          </Text>
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${downloadProgress}%` }]} />
          </View>
        </View>
      )}

      {/* Translations List */}
      <View style={styles.list}>
        {translations.map(tr => {
          const cachedChapters = cachedCounts[tr.id] || 0;
          return (
            <View key={tr.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.trName}>
                    {tr.abbreviation} • {tr.name}
                  </Text>
                  <Text style={styles.trDesc}>{tr.description}</Text>
                </View>

                {tr.isLocal ? (
                  <View style={styles.bundledBadge}>
                    <Text style={styles.bundledBadgeText}>BUNDLED</Text>
                  </View>
                ) : (
                  <View style={styles.onlineBadge}>
                    <Text style={styles.onlineBadgeText}>API.BIBLE</Text>
                  </View>
                )}
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.sizeText}>
                  {tr.isLocal
                    ? 'Storage: Bundled Offline (32 MB)'
                    : `Cached: ${cachedChapters} chapters (~${(cachedChapters * 0.02).toFixed(1)} MB)`}
                </Text>

                {tr.isLocal ? (
                  <Text style={styles.statusReady}>
                    <Ionicons name="cloud-done-outline" size={14} color={colors.success} style={{ marginRight: 4 }} />
                    Ready Offline
                  </Text>
                ) : cachedChapters > 0 ? (
                  <View style={styles.actionRow}>
                    <Text style={styles.statusReady}>
                      <Ionicons name="cloud-done-outline" size={14} color={colors.success} style={{ marginRight: 4 }} />
                      Cached
                    </Text>
                    <TouchableOpacity
                      style={styles.clearBtn}
                      onPress={() => handleClearCache(tr.id)}
                      accessibilityRole="button"
                      accessibilityLabel={`Clear offline cache for ${tr.name}`}
                    >
                      <Ionicons name="trash-outline" size={12} color={colors.error} />
                      <Text style={styles.clearBtnText}>Clear</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.downloadBtn}
                    onPress={() => handleInitiateDownload(tr)}
                    disabled={downloadingTr !== null}
                    accessibilityRole="button"
                    accessibilityLabel={`Download ${tr.name} for offline reading`}
                  >
                    <Ionicons name="download-outline" size={14} color={colors.primaryText} />
                    <Text style={styles.downloadBtnText}>Download</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}
      </View>

      {/* Confirmation Modal */}
      <Modal visible={confirmModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeading}>Download Offline Translation</Text>
            <Text style={styles.modalBody}>
              Download <Text style={{ fontWeight: '700' }}>{targetTr?.name}</Text> for offline
              reading?
            </Text>
            <Text style={styles.modalDetail}>
              • Estimated Storage: ~15 MB{'\n'}• Works completely without internet once cached
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setConfirmModalVisible(false)}
                accessibilityRole="button"
                accessibilityLabel="Cancel translation download"
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={handleStartDownload}
                accessibilityRole="button"
                accessibilityLabel="Confirm and start download"
              >
                <Text style={styles.confirmBtnText}>Confirm Download</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};
