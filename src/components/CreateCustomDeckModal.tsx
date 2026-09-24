import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  getLocalBookmarks,
  getLocalHighlights,
  addCustomConfessionDeck,
  LocalBookmarkRow,
  LocalHighlightRow,
} from '../database/sqlite';
import { ConfessionDeck } from '../config/confessionDecks';

interface CreateCustomDeckModalProps {
  visible: boolean;
  onClose: () => void;
  onDeckCreated: (newDeck: ConfessionDeck) => void;
}

interface SelectedVerseItem {
  id: string;
  reference: string;
  confessionText: string;
  title: string;
}

export const CreateCustomDeckModal: React.FC<CreateCustomDeckModalProps> = ({
  visible,
  onClose,
  onDeckCreated,
}) => {
  const [deckTitle, setDeckTitle] = useState('');
  const [deckDescription, setDeckDescription] = useState('');
  const [bookmarks, setBookmarks] = useState<LocalBookmarkRow[]>([]);
  const [highlights, setHighlights] = useState<LocalHighlightRow[]>([]);
  const [selectedItems, setSelectedItems] = useState<SelectedVerseItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'bookmarks' | 'highlights' | 'manual'>('bookmarks');

  // Manual verse input state
  const [manualRef, setManualRef] = useState('');
  const [manualTitle, setManualTitle] = useState('');
  const [manualDeclaration, setManualDeclaration] = useState('');

  useEffect(() => {
    if (visible) {
      setLoading(true);
      Promise.all([getLocalBookmarks(), getLocalHighlights()])
        .then(([bm, hl]) => {
          setBookmarks(bm);
          setHighlights(hl);
        })
        .finally(() => setLoading(false));
    } else {
      setDeckTitle('');
      setDeckDescription('');
      setSelectedItems([]);
      setManualRef('');
      setManualTitle('');
      setManualDeclaration('');
    }
  }, [visible]);

  const handleSelectBookmark = (b: LocalBookmarkRow) => {
    const ref = `${b.book} ${b.chapter}:${b.verse}`;
    const exists = selectedItems.find(i => i.reference === ref);
    if (exists) {
      setSelectedItems(selectedItems.filter(i => i.reference !== ref));
    } else {
      setSelectedItems([
        ...selectedItems,
        {
          id: b.id,
          reference: ref,
          title: `Declaration on ${ref}`,
          confessionText: `I declare the truth and power of ${ref} over my life today.`,
        },
      ]);
    }
  };

  const handleSelectHighlight = (h: LocalHighlightRow) => {
    const ref = `${h.book} ${h.chapter}:${h.verse}`;
    const exists = selectedItems.find(i => i.reference === ref);
    if (exists) {
      setSelectedItems(selectedItems.filter(i => i.reference !== ref));
    } else {
      setSelectedItems([
        ...selectedItems,
        {
          id: h.id,
          reference: ref,
          title: `Promise from ${ref}`,
          confessionText: `I walk in the divine promise of ${ref} with boldness and faith.`,
        },
      ]);
    }
  };

  const handleAddManualItem = () => {
    if (!manualRef.trim() || !manualDeclaration.trim()) {
      Alert.alert('Required Fields', 'Please enter a Scripture reference and declaration text.');
      return;
    }

    const newItem: SelectedVerseItem = {
      id: `manual_${Date.now()}`,
      reference: manualRef.trim(),
      title: manualTitle.trim() || `Declaration on ${manualRef.trim()}`,
      confessionText: manualDeclaration.trim(),
    };

    setSelectedItems([...selectedItems, newItem]);
    setManualRef('');
    setManualTitle('');
    setManualDeclaration('');
  };

  const handleUpdateDeclarationText = (index: number, text: string) => {
    const updated = [...selectedItems];
    updated[index].confessionText = text;
    setSelectedItems(updated);
  };

  const handleRemoveSelectedItem = (index: number) => {
    const updated = [...selectedItems];
    updated.splice(index, 1);
    setSelectedItems(updated);
  };

  const handleSaveDeck = async () => {
    if (!deckTitle.trim()) {
      Alert.alert('Missing Title', 'Please give your custom confession deck a name.');
      return;
    }

    if (selectedItems.length === 0) {
      Alert.alert(
        'No Declarations',
        'Please add at least one scripture declaration from your bookmarks, highlights, or manual input.'
      );
      return;
    }

    try {
      const createdDeck = await addCustomConfessionDeck({
        title: deckTitle.trim(),
        theme: 'Custom',
        description: deckDescription.trim() || 'My personal daily scripture declarations.',
        items: selectedItems.map(item => ({
          title: item.title,
          scriptureReference: item.reference,
          confessionText: item.confessionText,
        })),
      });

      Alert.alert('Deck Created', `"${createdDeck.title}" has been saved to your Confessions.`);
      onDeckCreated(createdDeck);
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to create custom deck.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerCancelBtn}>
            <Text style={styles.headerCancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Custom Deck</Text>
          <TouchableOpacity onPress={handleSaveDeck} style={styles.headerSaveBtn}>
            <Text style={styles.headerSaveText}>Save Deck</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Deck Metadata Form */}
          <Text style={styles.sectionLabel}>DECK INFORMATION</Text>
          <TextInput
            style={styles.input}
            placeholder="Deck Title (e.g. My Morning Declarations)"
            value={deckTitle}
            onChangeText={setDeckTitle}
          />
          <TextInput
            style={styles.input}
            placeholder="Brief description or purpose..."
            value={deckDescription}
            onChangeText={setDeckDescription}
          />

          {/* Selected Verses Count & Editor */}
          <View style={styles.selectedCountBar}>
            <Text style={styles.selectedCountText}>
              Declarations in Deck ({selectedItems.length})
            </Text>
          </View>

          {selectedItems.map((item, idx) => (
            <View key={item.id} style={styles.selectedCard}>
              <View style={styles.selectedCardHeader}>
                <View style={styles.refBadge}>
                  <Text style={styles.refBadgeText}>{item.reference}</Text>
                </View>
                <TouchableOpacity onPress={() => handleRemoveSelectedItem(idx)}>
                  <Text style={styles.removeText}>Remove</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.labelSub}>Edit First-Person Declaration:</Text>
              <TextInput
                style={styles.declarationInput}
                multiline
                value={item.confessionText}
                onChangeText={txt => handleUpdateDeclarationText(idx, txt)}
              />
            </View>
          ))}

          {/* Source Tabs */}
          <Text style={[styles.sectionLabel, { marginTop: 24 }]}>
            ADD SCRIPTURES FROM YOUR LIBRARY
          </Text>
          <View style={styles.tabsRow}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'bookmarks' && styles.activeTabBtn]}
              onPress={() => setActiveTab('bookmarks')}
            >
              <Text style={[styles.tabText, activeTab === 'bookmarks' && styles.activeTabText]}>
                Bookmarks ({bookmarks.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'highlights' && styles.activeTabBtn]}
              onPress={() => setActiveTab('highlights')}
            >
              <Text style={[styles.tabText, activeTab === 'highlights' && styles.activeTabText]}>
                Highlights ({highlights.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'manual' && styles.activeTabBtn]}
              onPress={() => setActiveTab('manual')}
            >
              <Text style={[styles.tabText, activeTab === 'manual' && styles.activeTabText]}>
                + Manual Verse
              </Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator style={{ marginTop: 20 }} color="#1C1917" />
          ) : (
            <>
              {/* Tab 1: Bookmarks */}
              {activeTab === 'bookmarks' && (
                <View style={styles.itemsList}>
                  {bookmarks.map(b => {
                    const ref = `${b.book} ${b.chapter}:${b.verse}`;
                    const isSelected = selectedItems.some(i => i.reference === ref);
                    return (
                      <TouchableOpacity
                        key={b.id}
                        style={[styles.pickerItem, isSelected && styles.pickerItemSelected]}
                        onPress={() => handleSelectBookmark(b)}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={styles.pickerItemRef}>{ref}</Text>
                          <Text style={styles.pickerItemSub}>Saved {b.translation}</Text>
                        </View>
                        <Text style={[styles.addPill, isSelected && styles.addPillSelected]}>
                          {isSelected ? '✓ Added' : '+ Add'}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                  {bookmarks.length === 0 && (
                    <Text style={styles.emptyText}>
                      No saved bookmarks found. Save verses while reading to add them here!
                    </Text>
                  )}
                </View>
              )}

              {/* Tab 2: Highlights */}
              {activeTab === 'highlights' && (
                <View style={styles.itemsList}>
                  {highlights.map(h => {
                    const ref = `${h.book} ${h.chapter}:${h.verse}`;
                    const isSelected = selectedItems.some(i => i.reference === ref);
                    return (
                      <TouchableOpacity
                        key={h.id}
                        style={[styles.pickerItem, isSelected && styles.pickerItemSelected]}
                        onPress={() => handleSelectHighlight(h)}
                      >
                        <View
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: 5,
                            backgroundColor: h.color,
                            marginRight: 10,
                          }}
                        />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.pickerItemRef}>{ref}</Text>
                          <Text style={styles.pickerItemSub}>Highlighted verse</Text>
                        </View>
                        <Text style={[styles.addPill, isSelected && styles.addPillSelected]}>
                          {isSelected ? '✓ Added' : '+ Add'}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                  {highlights.length === 0 && (
                    <Text style={styles.emptyText}>
                      No highlights found in your library yet.
                    </Text>
                  )}
                </View>
              )}

              {/* Tab 3: Manual Verse Input */}
              {activeTab === 'manual' && (
                <View style={styles.manualCard}>
                  <TextInput
                    style={styles.input}
                    placeholder="Scripture reference (e.g. Isaiah 40:31)"
                    value={manualRef}
                    onChangeText={setManualRef}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Short Title (e.g. Renewed Strength)"
                    value={manualTitle}
                    onChangeText={setManualTitle}
                  />
                  <TextInput
                    style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                    placeholder="First-person declaration text (e.g. I wait upon the Lord and my strength is renewed...)"
                    multiline
                    value={manualDeclaration}
                    onChangeText={setManualDeclaration}
                  />
                  <TouchableOpacity style={styles.addManualBtn} onPress={handleAddManualItem}>
                    <Text style={styles.addManualBtnText}>+ Add Declaration to Deck</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAF9' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: '#E7E5E4',
    backgroundColor: '#FFFFFF',
  },
  headerCancelBtn: { padding: 4 },
  headerCancelText: { color: '#78716C', fontSize: 14, fontWeight: '600' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#1C1917' },
  headerSaveBtn: {
    backgroundColor: '#1C1917',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  headerSaveText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  content: { padding: 16 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#78716C',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7E5E4',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1C1917',
    marginBottom: 10,
  },
  selectedCountBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
  selectedCountText: { fontSize: 13, fontWeight: '700', color: '#1C1917' },
  selectedCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7E5E4',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  selectedCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  refBadge: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  refBadgeText: { fontSize: 12, fontWeight: '700', color: '#92400E' },
  removeText: { fontSize: 12, color: '#DC2626', fontWeight: '600' },
  labelSub: { fontSize: 11, color: '#78716C', marginBottom: 4 },
  declarationInput: {
    backgroundColor: '#F5F5F4',
    borderRadius: 6,
    padding: 10,
    fontSize: 13,
    lineHeight: 18,
    color: '#1C1917',
  },
  tabsRow: { flexDirection: 'row', backgroundColor: '#E7E5E4', borderRadius: 8, padding: 3, marginBottom: 12 },
  tabBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 },
  activeTabBtn: { backgroundColor: '#FFFFFF' },
  tabText: { fontSize: 11, fontWeight: '600', color: '#78716C' },
  activeTabText: { color: '#1C1917', fontWeight: '700' },
  itemsList: { gap: 8 },
  pickerItem: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7E5E4',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerItemSelected: { borderColor: '#059669', backgroundColor: '#ECFDF5' },
  pickerItemRef: { fontSize: 14, fontWeight: '700', color: '#1C1917' },
  pickerItemSub: { fontSize: 11, color: '#78716C', marginTop: 2 },
  addPill: { fontSize: 12, fontWeight: '700', color: '#2563EB' },
  addPillSelected: { color: '#059669' },
  emptyText: { textAlign: 'center', color: '#A8A29E', fontSize: 12, marginTop: 16 },
  manualCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7E5E4',
    borderRadius: 10,
    padding: 14,
  },
  addManualBtn: {
    backgroundColor: '#1C1917',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  addManualBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
});
