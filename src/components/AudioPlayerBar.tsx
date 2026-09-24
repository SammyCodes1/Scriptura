import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { ttsService, AudioPlaybackState, SleepTimerOption } from '../services/audio/ttsService';

export const AudioPlayerBar: React.FC = () => {
  const [playback, setPlayback] = useState<AudioPlaybackState>(ttsService.getState());
  const [timerModalVisible, setTimerModalVisible] = useState(false);

  useEffect(() => {
    const unsubscribe = ttsService.subscribe(setPlayback);
    return () => unsubscribe();
  }, []);

  if (!playback.isPlaying && !playback.isPaused) {
    return null;
  }

  const formatTimer = (seconds: number | null) => {
    if (seconds === null) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const timerOptions: Array<{ label: string; value: SleepTimerOption }> = [
    { label: 'Off', value: null },
    { label: '5 minutes', value: 5 },
    { label: '10 minutes', value: 10 },
    { label: '15 minutes', value: 15 },
    { label: '30 minutes', value: 30 },
    { label: '45 minutes', value: 45 },
    { label: 'End of Chapter', value: 'end_of_chapter' },
  ];

  return (
    <View style={styles.floatingBar}>
      <View style={styles.infoCol}>
        <Text style={styles.title} numberOfLines={1}>
          {playback.chapterTitle}
        </Text>
        <Text style={styles.sub}>
          {playback.currentVerseNum
            ? `Speaking Verse ${playback.currentVerseNum} of ${playback.totalVerses}`
            : 'Audio Playing'}
          {playback.sleepTimerRemainingSeconds !== null && (
            <Text style={styles.timerCountdown}>
              {' '}• ⏱️ {formatTimer(playback.sleepTimerRemainingSeconds)}
            </Text>
          )}
        </Text>
      </View>

      <View style={styles.controlsRow}>
        {/* Sleep Timer Toggle */}
        <TouchableOpacity
          style={[styles.btn, playback.sleepTimer !== null && styles.activeTimerBtn]}
          onPress={() => setTimerModalVisible(true)}
        >
          <Text style={styles.btnIcon}>⏱️</Text>
        </TouchableOpacity>

        {/* Play/Pause */}
        {playback.isPaused ? (
          <TouchableOpacity style={styles.playBtn} onPress={() => ttsService.resume()}>
            <Text style={styles.playBtnText}>▶</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.playBtn} onPress={() => ttsService.pause()}>
            <Text style={styles.playBtnText}>⏸</Text>
          </TouchableOpacity>
        )}

        {/* Stop */}
        <TouchableOpacity style={styles.btn} onPress={() => ttsService.stop()}>
          <Text style={styles.btnIcon}>⏹</Text>
        </TouchableOpacity>
      </View>

      {/* Sleep Timer Selector Modal */}
      <Modal visible={timerModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Audio Sleep Timer</Text>
            {timerOptions.map(opt => (
              <TouchableOpacity
                key={String(opt.value)}
                style={[
                  styles.timerItem,
                  playback.sleepTimer === opt.value && styles.selectedTimerItem,
                ]}
                onPress={() => {
                  ttsService.setSleepTimer(opt.value);
                  setTimerModalVisible(false);
                }}
              >
                <Text
                  style={[
                    styles.timerItemText,
                    playback.sleepTimer === opt.value && styles.selectedTimerItemText,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setTimerModalVisible(false)}
            >
              <Text style={styles.closeBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  floatingBar: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: '#1C1917',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  infoCol: { flex: 1, marginRight: 10 },
  title: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  sub: { color: '#A8A29E', fontSize: 11, marginTop: 2 },
  timerCountdown: { color: '#FBBF24', fontWeight: '700' },
  controlsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  btn: { padding: 6, borderRadius: 6, backgroundColor: '#292524' },
  activeTimerBtn: { backgroundColor: '#B45309' },
  btnIcon: { fontSize: 14 },
  playBtn: {
    backgroundColor: '#FFFFFF',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playBtnText: { color: '#1C1917', fontSize: 14, fontWeight: '800' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    width: '80%',
    maxWidth: 320,
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 },
  timerItem: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
  },
  selectedTimerItem: { backgroundColor: '#F3F4F6' },
  timerItemText: { fontSize: 14, color: '#374151' },
  selectedTimerItemText: { fontWeight: '700', color: '#111827' },
  closeBtn: {
    marginTop: 14,
    backgroundColor: '#1C1917',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
});
