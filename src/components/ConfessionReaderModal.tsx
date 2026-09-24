import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  FlatList,
  SafeAreaView,
  Alert,
} from 'react-native';
import * as Speech from 'expo-speech';
import { ConfessionDeck, ConfessionItem } from '../config/confessionDecks';
import { recordLocalConfessionRecitation } from '../database/sqlite';

const { width, height } = Dimensions.get('window');

interface ConfessionReaderModalProps {
  visible: boolean;
  deck: ConfessionDeck | null;
  onClose: () => void;
  onCompleted?: (deckId: string, streak: number) => void;
}

export const ConfessionReaderModal: React.FC<ConfessionReaderModalProps> = ({
  visible,
  deck,
  onClose,
  onCompleted,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const flatListRef = useRef<FlatList<ConfessionItem>>(null);

  useEffect(() => {
    if (visible) {
      setCurrentIndex(0);
      setIsSpeaking(false);
    } else {
      Speech.stop();
      setIsSpeaking(false);
    }
  }, [visible, deck]);

  if (!deck || !visible) return null;

  const currentItem = deck.items[currentIndex] || deck.items[0];
  const isLastCard = currentIndex === deck.items.length - 1;

  // TTS Read Aloud
  const handleToggleSpeech = async () => {
    if (isSpeaking) {
      await Speech.stop();
      setIsSpeaking(false);
      return;
    }

    if (!currentItem) return;

    setIsSpeaking(true);
    const speechText = `${currentItem.title}. From ${currentItem.scriptureReference}. ${currentItem.confessionText}`;

    Speech.speak(speechText, {
      language: 'en-US',
      pitch: 1.0,
      rate: 0.92,
      onDone: () => {
        setIsSpeaking(false);
      },
      onStopped: () => {
        setIsSpeaking(false);
      },
      onError: () => {
        setIsSpeaking(false);
      },
    });
  };

  const handleNext = () => {
    if (currentIndex < deck.items.length - 1) {
      Speech.stop();
      setIsSpeaking(false);
      const nextIdx = currentIndex + 1;
      flatListRef.current?.scrollToIndex({ index: nextIdx, animated: true });
      setCurrentIndex(nextIdx);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      Speech.stop();
      setIsSpeaking(false);
      const prevIdx = currentIndex - 1;
      flatListRef.current?.scrollToIndex({ index: prevIdx, animated: true });
      setCurrentIndex(prevIdx);
    }
  };

  const handleMarkDoneToday = async () => {
    Speech.stop();
    setIsSpeaking(false);
    try {
      const res = await recordLocalConfessionRecitation(deck.id);
      Alert.alert(
        'Declaration Complete! 🕊️',
        `Grace on your journey. Day ${res.streak} milestone reached! Keep standing on the Word.`,
        [
          {
            text: 'Amen',
            onPress: () => {
              if (onCompleted) onCompleted(deck.id, res.streak);
              onClose();
            },
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to save progress.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={styles.safeContainer}>
        {/* Header Bar */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => {
              Speech.stop();
              onClose();
            }}
          >
            <Text style={styles.closeBtnText}>✕ Close</Text>
          </TouchableOpacity>

          <View style={styles.deckInfo}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {deck.title}
            </Text>
            <Text style={styles.progressCounter}>
              {currentIndex + 1} of {deck.items.length}
            </Text>
          </View>

          {/* TTS Audio Read-Aloud Button */}
          <TouchableOpacity
            style={[styles.ttsBtn, isSpeaking && styles.ttsBtnActive]}
            onPress={handleToggleSpeech}
          >
            <Text style={[styles.ttsBtnText, isSpeaking && styles.ttsBtnTextActive]}>
              {isSpeaking ? '⏹ Stop' : '🔊 Listen'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBarTrack}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${((currentIndex + 1) / deck.items.length) * 100}%` },
            ]}
          />
        </View>

        {/* Swipeable Horizontal Card List */}
        <FlatList
          ref={flatListRef}
          data={deck.items}
          keyExtractor={item => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={ev => {
            const newIndex = Math.round(ev.nativeEvent.contentOffset.x / width);
            if (newIndex !== currentIndex) {
              Speech.stop();
              setIsSpeaking(false);
              setCurrentIndex(newIndex);
            }
          }}
          renderItem={({ item }) => (
            <View style={styles.cardContainer}>
              <View style={styles.card}>
                {/* Scripture Reference Pill */}
                <View style={styles.referenceBadge}>
                  <Text style={styles.referenceText}>{item.scriptureReference}</Text>
                </View>

                {/* Card Title */}
                <Text style={styles.cardTitle}>{item.title}</Text>

                {/* Large First-Person Declaration Text */}
                <Text style={styles.declarationText}>"{item.confessionText}"</Text>

                <View style={styles.cardFooterHint}>
                  <Text style={styles.footerHintText}>
                    Read aloud with faith • Swipe ➔ for next
                  </Text>
                </View>
              </View>
            </View>
          )}
        />

        {/* Bottom Navigation & Done Button */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.navBtn, currentIndex === 0 && styles.navBtnDisabled]}
            onPress={handlePrev}
            disabled={currentIndex === 0}
          >
            <Text
              style={[styles.navBtnText, currentIndex === 0 && styles.navBtnTextDisabled]}
            >
              ◀ Previous
            </Text>
          </TouchableOpacity>

          {isLastCard ? (
            <TouchableOpacity style={styles.doneBtn} onPress={handleMarkDoneToday}>
              <Text style={styles.doneBtnText}>✓ Mark Done Today</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
              <Text style={styles.nextBtnText}>Next ➔</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#1C1917',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  closeBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#292524',
    borderRadius: 8,
  },
  closeBtnText: {
    color: '#D6D3D1',
    fontWeight: '600',
    fontSize: 13,
  },
  deckInfo: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 8,
  },
  headerTitle: {
    color: '#F5F5F4',
    fontSize: 14,
    fontWeight: '700',
  },
  progressCounter: {
    color: '#A8A29E',
    fontSize: 12,
    marginTop: 2,
  },
  ttsBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#292524',
    borderRadius: 8,
  },
  ttsBtnActive: {
    backgroundColor: '#FEF3C7',
  },
  ttsBtnText: {
    color: '#F5F5F4',
    fontWeight: '600',
    fontSize: 13,
  },
  ttsBtnTextActive: {
    color: '#92400E',
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: '#292524',
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
  },
  cardContainer: {
    width,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: width - 40,
    backgroundColor: '#292524',
    borderRadius: 20,
    padding: 26,
    minHeight: height * 0.55,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#44403C',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  referenceBadge: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  referenceText: {
    color: '#92400E',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#D6D3D1',
    marginTop: 14,
    marginBottom: 10,
  },
  declarationText: {
    fontSize: 24,
    lineHeight: 38,
    fontWeight: '600',
    color: '#FAFAF9',
    fontFamily: 'serif',
    letterSpacing: 0.2,
    flex: 1,
    textAlignVertical: 'center',
    marginVertical: 10,
  },
  cardFooterHint: {
    borderTopWidth: 1,
    borderColor: '#44403C',
    paddingTop: 12,
    marginTop: 10,
  },
  footerHintText: {
    color: '#A8A29E',
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#1C1917',
  },
  navBtn: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: '#292524',
  },
  navBtnDisabled: {
    opacity: 0.3,
  },
  navBtnText: {
    color: '#F5F5F4',
    fontWeight: '600',
    fontSize: 14,
  },
  navBtnTextDisabled: {
    color: '#78716C',
  },
  nextBtn: {
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  nextBtnText: {
    color: '#1C1917',
    fontWeight: '700',
    fontSize: 14,
  },
  doneBtn: {
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 10,
    backgroundColor: '#059669',
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
});
