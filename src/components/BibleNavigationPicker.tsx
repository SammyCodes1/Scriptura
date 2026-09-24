import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
} from 'react-native';
import { CANONICAL_BOOKS, BibleBookInfo } from '../config/books';
import { getChapterVerseCount } from '../database/sqlite';

interface BibleNavigationPickerProps {
  visible: boolean;
  currentBookCode: string;
  currentChapter: number;
  onClose: () => void;
  onSelect: (bookCode: string, chapter: number, verse?: number) => void;
}

type PickerStep = 'book' | 'chapter' | 'verse';
type TestamentFilter = 'ALL' | 'OT' | 'NT';

export const BibleNavigationPicker: React.FC<BibleNavigationPickerProps> = ({
  visible,
  currentBookCode,
  currentChapter,
  onClose,
  onSelect,
}) => {
  const [step, setStep] = useState<PickerStep>('book');
  const [searchQuery, setSearchQuery] = useState('');
  const [testamentFilter, setTestamentFilter] = useState<TestamentFilter>('ALL');

  const [selectedBook, setSelectedBook] = useState<BibleBookInfo>(() => {
    return CANONICAL_BOOKS.find(b => b.code === currentBookCode) || CANONICAL_BOOKS[0];
  });
  const [selectedChapter, setSelectedChapter] = useState<number>(currentChapter);
  const [verseCount, setVerseCount] = useState<number>(30);

  // Sync with current props when opened
  useEffect(() => {
    if (visible) {
      const found = CANONICAL_BOOKS.find(b => b.code === currentBookCode);
      if (found) setSelectedBook(found);
      setSelectedChapter(currentChapter);
      setStep('book');
      setSearchQuery('');
    }
  }, [visible, currentBookCode, currentChapter]);

  // Load verse count when chapter or book changes
  useEffect(() => {
    let isMounted = true;
    getChapterVerseCount(selectedBook.code, selectedChapter).then(cnt => {
      if (isMounted) setVerseCount(cnt);
    });
    return () => {
      isMounted = false;
    };
  }, [selectedBook, selectedChapter]);

  // Filter books based on search query and testament
  const filteredBooks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return CANONICAL_BOOKS.filter(b => {
      if (testamentFilter !== 'ALL' && b.testament !== testamentFilter) {
        return false;
      }
      if (!q) return true;
      return (
        b.name.toLowerCase().includes(q) ||
        b.code.toLowerCase().includes(q) ||
        b.name.toLowerCase().replace(/\s+/g, '').includes(q)
      );
    });
  }, [searchQuery, testamentFilter]);

  const handleBookSelect = (book: BibleBookInfo) => {
    setSelectedBook(book);
    setSelectedChapter(1);
    setStep('chapter');
  };

  const handleChapterSelect = (ch: number) => {
    setSelectedChapter(ch);
    setStep('verse');
  };

  const handleVerseSelect = (verse: number) => {
    onSelect(selectedBook.code, selectedChapter, verse);
    onClose();
  };

  const handleSkipToChapter = () => {
    onSelect(selectedBook.code, selectedChapter, 1);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header & Breadcrumb Navigation */}
          <View style={styles.header}>
            <View style={styles.breadcrumbs}>
              <TouchableOpacity
                onPress={() => setStep('book')}
                style={[styles.crumbBtn, step === 'book' && styles.activeCrumb]}
              >
                <Text style={[styles.crumbText, step === 'book' && styles.activeCrumbText]}>
                  {selectedBook.name}
                </Text>
              </TouchableOpacity>

              <Text style={styles.crumbSeparator}>›</Text>

              <TouchableOpacity
                onPress={() => setStep('chapter')}
                style={[styles.crumbBtn, step === 'chapter' && styles.activeCrumb]}
              >
                <Text style={[styles.crumbText, step === 'chapter' && styles.activeCrumbText]}>
                  Ch. {selectedChapter}
                </Text>
              </TouchableOpacity>

              <Text style={styles.crumbSeparator}>›</Text>

              <TouchableOpacity
                onPress={() => setStep('verse')}
                style={[styles.crumbBtn, step === 'verse' && styles.activeCrumb]}
              >
                <Text style={[styles.crumbText, step === 'verse' && styles.activeCrumbText]}>
                  Verse
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeHeaderBtn}>
              <Text style={styles.closeHeaderText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* STEP 1: Fast Searchable Book Selection */}
          {step === 'book' && (
            <View style={styles.stepContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search books (e.g. 'Rom', 'John', '1 Cor')..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus={false}
                clearButtonMode="while-editing"
              />

              <View style={styles.filterRow}>
                {(['ALL', 'OT', 'NT'] as TestamentFilter[]).map(f => (
                  <TouchableOpacity
                    key={f}
                    style={[styles.filterChip, testamentFilter === f && styles.activeFilterChip]}
                    onPress={() => setTestamentFilter(f)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        testamentFilter === f && styles.activeFilterChipText,
                      ]}
                    >
                      {f === 'ALL' ? 'All (66)' : f === 'OT' ? 'Old Testament (39)' : 'New Testament (27)'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <ScrollView style={styles.bookList} keyboardShouldPersistTaps="handled">
                <View style={styles.bookGrid}>
                  {filteredBooks.map(b => (
                    <TouchableOpacity
                      key={b.code}
                      style={[
                        styles.bookCard,
                        selectedBook.code === b.code && styles.selectedBookCard,
                      ]}
                      onPress={() => handleBookSelect(b)}
                    >
                      <Text style={styles.bookCardCode}>{b.code}</Text>
                      <Text style={styles.bookCardName} numberOfLines={1}>
                        {b.name}
                      </Text>
                      <Text style={styles.bookCardCount}>{b.chapters} chs</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          {/* STEP 2: Compact Chapter Grid */}
          {step === 'chapter' && (
            <View style={styles.stepContainer}>
              <View style={styles.stepTitleBar}>
                <Text style={styles.stepTitle}>
                  Select Chapter in {selectedBook.name}
                </Text>
                <Text style={styles.stepSubtitle}>{selectedBook.chapters} total chapters</Text>
              </View>

              <ScrollView style={styles.gridScroll}>
                <View style={styles.numbersGrid}>
                  {Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map(ch => (
                    <TouchableOpacity
                      key={ch}
                      style={[
                        styles.numberCell,
                        selectedChapter === ch && styles.selectedNumberCell,
                      ]}
                      onPress={() => handleChapterSelect(ch)}
                    >
                      <Text
                        style={[
                          styles.numberCellText,
                          selectedChapter === ch && styles.selectedNumberCellText,
                        ]}
                      >
                        {ch}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          {/* STEP 3: Compact Verse Grid */}
          {step === 'verse' && (
            <View style={styles.stepContainer}>
              <View style={styles.stepTitleBar}>
                <Text style={styles.stepTitle}>
                  {selectedBook.name} {selectedChapter}
                </Text>
                <TouchableOpacity style={styles.skipBtn} onPress={handleSkipToChapter}>
                  <Text style={styles.skipBtnText}>Read Full Chapter ➔</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.gridScroll}>
                <View style={styles.numbersGrid}>
                  {Array.from({ length: verseCount }, (_, i) => i + 1).map(v => (
                    <TouchableOpacity
                      key={v}
                      style={styles.numberCell}
                      onPress={() => handleVerseSelect(v)}
                    >
                      <Text style={styles.numberCellText}>{v}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '82%',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
  },
  breadcrumbs: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  crumbBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  activeCrumb: { backgroundColor: '#1C1917' },
  crumbText: { fontSize: 13, fontWeight: '600', color: '#4B5563' },
  activeCrumbText: { color: '#FFFFFF' },
  crumbSeparator: { fontSize: 14, color: '#9CA3AF' },
  closeHeaderBtn: { padding: 6 },
  closeHeaderText: { fontSize: 16, color: '#6B7280', fontWeight: '700' },
  stepContainer: { flex: 1, padding: 16 },
  searchInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 10,
  },
  filterRow: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
  },
  activeFilterChip: { backgroundColor: '#1C1917' },
  filterChipText: { fontSize: 12, fontWeight: '600', color: '#4B5563' },
  activeFilterChipText: { color: '#FFFFFF' },
  bookList: { flex: 1 },
  bookGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingBottom: 20,
  },
  bookCard: {
    width: '31%',
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 10,
  },
  selectedBookCard: { borderColor: '#1C1917', backgroundColor: '#F3F4F6' },
  bookCardCode: { fontSize: 11, fontWeight: '800', color: '#9CA3AF' },
  bookCardName: { fontSize: 13, fontWeight: '700', color: '#111827', marginVertical: 2 },
  bookCardCount: { fontSize: 11, color: '#6B7280' },
  stepTitleBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  stepTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  stepSubtitle: { fontSize: 12, color: '#6B7280' },
  skipBtn: {
    backgroundColor: '#1C1917',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  skipBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  gridScroll: { flex: 1 },
  numbersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingBottom: 24,
  },
  numberCell: {
    width: '17.5%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
  },
  selectedNumberCell: { backgroundColor: '#1C1917', borderColor: '#1C1917' },
  numberCellText: { fontSize: 15, fontWeight: '600', color: '#1F2937' },
  selectedNumberCellText: { color: '#FFFFFF' },
});
