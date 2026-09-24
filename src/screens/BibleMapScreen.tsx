import React, { useState, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Modal,
  Image,
  ScrollView,
  Dimensions,
  Platform,
  Linking,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useBible } from '../context/BibleContext';
import { biblePlacesService, BiblePlace } from '../services/map/biblePlacesService';
import { parseScriptureReference } from '../utils/referenceParser';
import { hapticLight, hapticSelection } from '../utils/haptics';

const { width } = Dimensions.get('window');

// Default initial camera: Holy Land / Levant (Jerusalem center)
const INITIAL_REGION: Region = {
  latitude: 31.776667,
  longitude: 35.234167,
  latitudeDelta: 3.5,
  longitudeDelta: 3.5,
};

interface Cluster {
  id: string;
  latitude: number;
  longitude: number;
  count: number;
  places: BiblePlace[];
}

export const BibleMapScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors, spacing, radii, fonts, fontSizes, fontWeights } = useTheme();
  const { navigateTo, currentTranslation } = useBible();

  const mapRef = useRef<MapView>(null);
  const carouselRef = useRef<FlatList<BiblePlace>>(null);

  const [allPlaces] = useState<BiblePlace[]>(() => biblePlacesService.getAllPlaces());
  const [featuredPlaces] = useState<BiblePlace[]>(() => biblePlacesService.getFeaturedPlaces());

  const [currentRegion, setCurrentRegion] = useState<Region>(INITIAL_REGION);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<BiblePlace[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Selected Place Detail Sheet
  const [selectedPlace, setSelectedPlace] = useState<BiblePlace | null>(null);
  const [detailSheetVisible, setDetailSheetVisible] = useState(false);

  // Filter toggle: all places vs featured only
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);

  // ─── Map Camera Navigation ────────────────────────────────────
  const flyToPlace = useCallback((place: BiblePlace, zoomIn = true) => {
    hapticSelection();
    mapRef.current?.animateToRegion(
      {
        latitude: place.lat,
        longitude: place.lng,
        latitudeDelta: zoomIn ? 0.35 : 1.2,
        longitudeDelta: zoomIn ? 0.35 : 1.2,
      },
      700
    );
  }, []);

  const handleSelectPlace = useCallback(
    (place: BiblePlace, zoom = true) => {
      setSelectedPlace(place);
      setDetailSheetVisible(true);
      flyToPlace(place, zoom);
      setIsSearching(false);
      setSearchQuery('');
    },
    [flyToPlace]
  );

  const handleRecenterHolyLand = () => {
    hapticLight();
    mapRef.current?.animateToRegion(INITIAL_REGION, 600);
  };

  const handleZoom = (direction: 'in' | 'out') => {
    hapticLight();
    const factor = direction === 'in' ? 0.5 : 2.0;
    const newRegion: Region = {
      latitude: currentRegion.latitude,
      longitude: currentRegion.longitude,
      latitudeDelta: Math.max(0.05, Math.min(60, currentRegion.latitudeDelta * factor)),
      longitudeDelta: Math.max(0.05, Math.min(60, currentRegion.longitudeDelta * factor)),
    };
    mapRef.current?.animateToRegion(newRegion, 400);
  };

  // ─── Search Handlers ──────────────────────────────────────────
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (!text.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    const matches = biblePlacesService.searchPlaces(text, 20);
    setSearchResults(matches);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setIsSearching(false);
  };

  // ─── Deep-Link to Scripture Reader ───────────────────────────
  const handleVersePress = async (refStr: string) => {
    hapticLight();
    const parsed = parseScriptureReference(refStr);
    if (parsed) {
      await navigateTo(
        parsed.book.code,
        parsed.chapter,
        currentTranslation,
        parsed.verse
      );
      setDetailSheetVisible(false);
      navigation.navigate('Read');
    }
  };

  // ─── Viewport Clustering Calculation ──────────────────────────
  // When zoomed out (longitudeDelta > 4.5), cluster non-featured places
  const isZoomedOut = currentRegion.longitudeDelta > 4.5;
  const activePlaces = showFeaturedOnly ? featuredPlaces : allPlaces;

  const { visibleFeatured, visibleSingles, clusters } = useMemo(() => {
    const featured: BiblePlace[] = [];
    const singles: BiblePlace[] = [];
    const clusterMap: Record<string, Cluster> = {};

    const cellSize = Math.max(1.0, currentRegion.longitudeDelta / 5);

    for (const place of activePlaces) {
      if (place.is_featured) {
        featured.push(place);
      } else if (!isZoomedOut) {
        singles.push(place);
      } else {
        // Group into grid cells
        const cellX = Math.floor(place.lng / cellSize);
        const cellY = Math.floor(place.lat / cellSize);
        const key = `${cellX}_${cellY}`;

        if (!clusterMap[key]) {
          clusterMap[key] = {
            id: `cluster_${key}`,
            latitude: place.lat,
            longitude: place.lng,
            count: 0,
            places: [],
          };
        }
        clusterMap[key].count += 1;
        clusterMap[key].places.push(place);
      }
    }

    return {
      visibleFeatured: featured,
      visibleSingles: singles,
      clusters: Object.values(clusterMap),
    };
  }, [activePlaces, isZoomedOut, currentRegion.longitudeDelta]);

  const handleClusterPress = (cluster: Cluster) => {
    hapticSelection();
    mapRef.current?.animateToRegion(
      {
        latitude: cluster.latitude,
        longitude: cluster.longitude,
        latitudeDelta: currentRegion.latitudeDelta * 0.45,
        longitudeDelta: currentRegion.longitudeDelta * 0.45,
      },
      500
    );
  };

  // ─── Dynamic Styles ───────────────────────────────────────────
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.background },
        map: { width: '100%', height: '100%' },

        // Top Search Header
        searchContainer: {
          position: 'absolute',
          top: Platform.OS === 'ios' ? 54 : 20,
          left: spacing.lg,
          right: spacing.lg,
          zIndex: 20,
        },
        searchBar: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.surface,
          borderRadius: radii.xl,
          paddingHorizontal: spacing.md,
          height: 46,
          borderWidth: 1,
          borderColor: colors.border,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.12,
          shadowRadius: 6,
          elevation: 4,
        },
        searchInput: {
          flex: 1,
          marginLeft: spacing.sm,
          fontSize: fontSizes.body,
          color: colors.textPrimary,
          fontFamily: fonts.sans,
        },
        searchResultsDropdown: {
          marginTop: spacing.xs,
          backgroundColor: colors.surface,
          borderRadius: radii.lg,
          maxHeight: 260,
          borderWidth: 1,
          borderColor: colors.border,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
          elevation: 6,
        },
        searchResultRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.lg,
          borderBottomWidth: 1,
          borderColor: colors.borderLight,
        },
        searchResultName: {
          fontSize: fontSizes.body,
          fontWeight: fontWeights.bold,
          color: colors.textPrimary,
        },
        searchResultSub: {
          fontSize: fontSizes.caption,
          color: colors.textTertiary,
          marginTop: 2,
        },
        featuredBadge: {
          backgroundColor: colors.warningLight,
          paddingHorizontal: spacing.sm,
          paddingVertical: 2,
          borderRadius: radii.sm,
        },
        featuredBadgeText: {
          fontSize: fontSizes.caption,
          fontWeight: fontWeights.bold,
          color: colors.warningText,
        },

        // Floating Control Buttons (Right Side)
        floatingControls: {
          position: 'absolute',
          right: spacing.lg,
          top: Platform.OS === 'ios' ? 120 : 86,
          gap: spacing.sm,
          zIndex: 10,
        },
        mapControlBtn: {
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: colors.surface,
          justifyContent: 'center',
          alignItems: 'center',
          borderWidth: 1,
          borderColor: colors.border,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.12,
          shadowRadius: 4,
          elevation: 3,
        },
        activeControlBtn: {
          backgroundColor: colors.primary,
          borderColor: colors.primary,
        },

        // Bottom Carousel & Attribution
        bottomSheetContainer: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          paddingBottom: Platform.OS === 'ios' ? 24 : 12,
        },
        carouselTitleRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: spacing.lg,
          marginBottom: spacing.xs,
        },
        carouselHeaderTitle: {
          fontSize: fontSizes.xs,
          fontWeight: fontWeights.bold,
          color: colors.textSecondary,
          letterSpacing: 0.6,
          textTransform: 'uppercase',
        },
        carouselContainer: {
          paddingHorizontal: spacing.md,
          gap: spacing.md,
        },
        carouselCard: {
          width: width * 0.72,
          backgroundColor: colors.surface,
          borderRadius: radii.xl,
          borderWidth: 1,
          borderColor: colors.border,
          marginHorizontal: spacing.xs,
          overflow: 'hidden',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 6,
          elevation: 4,
        },
        carouselCardImage: {
          width: '100%',
          height: 100,
          backgroundColor: colors.surfaceElevated,
        },
        carouselCardBody: {
          padding: spacing.md,
        },
        carouselCardTitleRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 4,
        },
        carouselCardTitle: {
          fontSize: fontSizes.bodyLarge,
          fontWeight: fontWeights.bold,
          color: colors.textPrimary,
          flex: 1,
        },
        carouselVerseBadge: {
          backgroundColor: colors.surfaceElevated,
          paddingHorizontal: spacing.sm,
          paddingVertical: 2,
          borderRadius: radii.sm,
        },
        carouselVerseBadgeText: {
          fontSize: fontSizes.caption,
          color: colors.textSecondary,
          fontWeight: fontWeights.semibold,
        },
        carouselCardNote: {
          fontSize: fontSizes.small,
          color: colors.textSecondary,
          lineHeight: 16,
          fontFamily: fonts.serif,
          fontStyle: 'italic',
        },

        // Persistent Attribution Footer
        attributionBar: {
          alignItems: 'center',
          paddingTop: spacing.xs,
        },
        attributionText: {
          fontSize: 10,
          color: colors.textTertiary,
          fontWeight: fontWeights.medium,
        },

        // Markers
        featuredMarker: {
          alignItems: 'center',
          justifyContent: 'center',
        },
        featuredMarkerPin: {
          backgroundColor: '#B45309', // Warm Biblical amber
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 14,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          borderWidth: 2,
          borderColor: '#FFFFFF',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          elevation: 4,
        },
        featuredMarkerText: {
          color: '#FFFFFF',
          fontSize: 11,
          fontWeight: fontWeights.bold,
        },
        regularMarkerPin: {
          width: 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: '#475569',
          borderWidth: 2,
          borderColor: '#FFFFFF',
        },
        clusterMarkerPin: {
          backgroundColor: colors.primary,
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 12,
          borderWidth: 2,
          borderColor: '#FFFFFF',
          justifyContent: 'center',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 3,
          elevation: 3,
        },
        clusterMarkerText: {
          color: colors.primaryText,
          fontSize: 11,
          fontWeight: fontWeights.bold,
        },

        // Place Detail Modal Sheet
        modalOverlay: {
          flex: 1,
          backgroundColor: colors.overlay,
          justifyContent: 'flex-end',
        },
        detailSheet: {
          backgroundColor: colors.surface,
          borderTopLeftRadius: radii.xl,
          borderTopRightRadius: radii.xl,
          maxHeight: '85%',
          paddingBottom: Platform.OS === 'ios' ? 36 : 24,
        },
        sheetDragHandle: {
          width: 40,
          height: 4,
          borderRadius: 2,
          backgroundColor: colors.border,
          alignSelf: 'center',
          marginTop: spacing.sm,
          marginBottom: spacing.xs,
        },
        sheetHeader: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: spacing.xl,
          paddingVertical: spacing.md,
        },
        sheetTitleRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          flex: 1,
        },
        sheetPlaceName: {
          fontSize: fontSizes.h2,
          fontWeight: fontWeights.bold,
          color: colors.textPrimary,
        },
        sheetCloseBtn: {
          padding: spacing.xs,
        },
        sheetImageContainer: {
          marginHorizontal: spacing.xl,
          borderRadius: radii.lg,
          overflow: 'hidden',
          backgroundColor: colors.surfaceElevated,
          marginBottom: spacing.md,
        },
        sheetImage: {
          width: '100%',
          height: 200,
          backgroundColor: colors.surfaceElevated,
        },
        sheetImageAttributionRow: {
          padding: spacing.sm,
          backgroundColor: colors.surfaceElevated,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        },
        sheetAttributionText: {
          fontSize: 10,
          color: colors.textTertiary,
          flex: 1,
        },
        sheetFeaturedNoteBox: {
          marginHorizontal: spacing.xl,
          marginBottom: spacing.lg,
          padding: spacing.md,
          backgroundColor: colors.warningLight,
          borderRadius: radii.md,
          borderLeftWidth: 4,
          borderLeftColor: colors.warning,
        },
        sheetFeaturedNoteText: {
          fontSize: fontSizes.body,
          color: colors.warningText,
          lineHeight: 20,
          fontFamily: fonts.serif,
          fontStyle: 'italic',
        },
        sheetSectionTitle: {
          fontSize: fontSizes.xs,
          fontWeight: fontWeights.bold,
          color: colors.textSecondary,
          letterSpacing: 0.6,
          textTransform: 'uppercase',
          marginHorizontal: spacing.xl,
          marginBottom: spacing.sm,
        },
        verseRefsGrid: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: spacing.sm,
          paddingHorizontal: spacing.xl,
          marginBottom: spacing.xl,
        },
        verseChip: {
          backgroundColor: colors.surfaceElevated,
          borderWidth: 1,
          borderColor: colors.border,
          minHeight: 44,
          justifyContent: 'center',
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.xs,
          borderRadius: radii.full,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
        },
        verseChipText: {
          fontSize: fontSizes.small,
          color: colors.textPrimary,
          fontWeight: fontWeights.semibold,
        },
      }),
    [colors, spacing, radii, fonts, fontSizes, fontWeights, currentRegion]
  );

  return (
    <View style={styles.container}>
      {/* 1. Top Search Header */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search biblical place (e.g. Jerusalem, Jericho)..."
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={handleSearchChange}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={handleClearSearch}>
              <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Live Search Results Dropdown */}
        {isSearching && searchResults.length > 0 && (
          <View style={styles.searchResultsDropdown}>
            <FlatList
              data={searchResults}
              keyExtractor={item => item.id}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.searchResultRow}
                  onPress={() => handleSelectPlace(item)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.searchResultName}>{item.name}</Text>
                    <Text style={styles.searchResultSub}>
                      {item.verse_count} Scripture mentions
                    </Text>
                  </View>
                  {item.is_featured && (
                    <View style={styles.featuredBadge}>
                      <Text style={styles.featuredBadgeText}>Strategic Site</Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        )}
      </View>

      {/* 2. Floating Map Navigation Controls */}
      <View style={styles.floatingControls}>
        {/* Recenter Holy Land */}
        <TouchableOpacity
          style={styles.mapControlBtn}
          onPress={handleRecenterHolyLand}
          accessibilityRole="button"
          accessibilityLabel="Recenter Holy Land"
        >
          <Ionicons name="compass-outline" size={22} color={colors.textPrimary} />
        </TouchableOpacity>

        {/* Zoom In */}
        <TouchableOpacity
          style={styles.mapControlBtn}
          onPress={() => handleZoom('in')}
          accessibilityRole="button"
          accessibilityLabel="Zoom In"
        >
          <Ionicons name="add" size={22} color={colors.textPrimary} />
        </TouchableOpacity>

        {/* Zoom Out */}
        <TouchableOpacity
          style={styles.mapControlBtn}
          onPress={() => handleZoom('out')}
          accessibilityRole="button"
          accessibilityLabel="Zoom Out"
        >
          <Ionicons name="remove" size={22} color={colors.textPrimary} />
        </TouchableOpacity>

        {/* Filter Featured Places Only */}
        <TouchableOpacity
          style={[
            styles.mapControlBtn,
            showFeaturedOnly && styles.activeControlBtn,
          ]}
          onPress={() => {
            hapticLight();
            setShowFeaturedOnly(!showFeaturedOnly);
          }}
          accessibilityRole="button"
          accessibilityLabel="Toggle featured places filter"
          accessibilityState={{ selected: showFeaturedOnly }}
        >
          <Ionicons
            name="star"
            size={18}
            color={showFeaturedOnly ? colors.primaryText : '#D97706'}
          />
        </TouchableOpacity>
      </View>

      {/* 3. Interactive Map View */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={INITIAL_REGION}
        onRegionChangeComplete={region => setCurrentRegion(region)}
        showsCompass={false}
        showsScale={true}
        rotateEnabled={false}
      >
        {/* A. Strategic Featured Markers (Golden Badge with Star) */}
        {visibleFeatured.map(place => (
          <Marker
            key={place.id}
            coordinate={{ latitude: place.lat, longitude: place.lng }}
            onPress={() => handleSelectPlace(place, false)}
            tracksViewChanges={false}
          >
            <View style={styles.featuredMarker}>
              <View style={styles.featuredMarkerPin}>
                <Ionicons name="star" size={10} color="#FDE68A" />
                <Text style={styles.featuredMarkerText}>{place.name}</Text>
              </View>
            </View>
          </Marker>
        ))}

        {/* B. Individual Non-Featured Markers (When Zoomed In) */}
        {!isZoomedOut &&
          visibleSingles.map(place => (
            <Marker
              key={place.id}
              coordinate={{ latitude: place.lat, longitude: place.lng }}
              onPress={() => handleSelectPlace(place, false)}
              tracksViewChanges={false}
            >
              <View style={styles.regularMarkerPin} />
            </Marker>
          ))}

        {/* C. Clustered Markers (When Zoomed Out) */}
        {isZoomedOut &&
          clusters.map(cluster => (
            <Marker
              key={cluster.id}
              coordinate={{
                latitude: cluster.latitude,
                longitude: cluster.longitude,
              }}
              onPress={() => handleClusterPress(cluster)}
              tracksViewChanges={false}
            >
              <View style={styles.clusterMarkerPin}>
                <Text style={styles.clusterMarkerText}>+{cluster.count}</Text>
              </View>
            </Marker>
          ))}
      </MapView>

      {/* 4. Bottom Horizontal Carousel & Attribution */}
      <View style={styles.bottomSheetContainer}>
        <View style={styles.carouselTitleRow}>
          <Text style={styles.carouselHeaderTitle}>
            Strategic Biblical Sites ({featuredPlaces.length})
          </Text>
        </View>

        <FlatList
          ref={carouselRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.carouselContainer}
          data={featuredPlaces}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.carouselCard}
              activeOpacity={0.85}
              onPress={() => handleSelectPlace(item)}
            >
              {item.image_url ? (
                <Image
                  source={{ uri: item.image_url }}
                  style={styles.carouselCardImage}
                  resizeMode="cover"
                />
              ) : (
                <View
                  style={[
                    styles.carouselCardImage,
                    { justifyContent: 'center', alignItems: 'center' },
                  ]}
                >
                  <Ionicons
                    name="image-outline"
                    size={32}
                    color={colors.textTertiary}
                  />
                </View>
              )}

              <View style={styles.carouselCardBody}>
                <View style={styles.carouselCardTitleRow}>
                  <Text style={styles.carouselCardTitle} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <View style={styles.carouselVerseBadge}>
                    <Text style={styles.carouselVerseBadgeText}>
                      {item.verse_count} mentions
                    </Text>
                  </View>
                </View>

                {item.featured_note && (
                  <Text style={styles.carouselCardNote} numberOfLines={2}>
                    "{item.featured_note}"
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          )}
        />

        {/* Persistent Attribution Notice */}
        <View style={styles.attributionBar}>
          <Text style={styles.attributionText}>
            Place data © OpenBible.info, CC BY 4.0 — imagery credited individually
          </Text>
        </View>
      </View>

      {/* 5. Place Detail Sheet Modal */}
      <Modal
        visible={detailSheetVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setDetailSheetVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detailSheet}>
            <View style={styles.sheetDragHandle} />

            {/* Header */}
            <View style={styles.sheetHeader}>
              <View style={styles.sheetTitleRow}>
                <Text style={styles.sheetPlaceName}>{selectedPlace?.name}</Text>
                {selectedPlace?.is_featured && (
                  <View style={styles.featuredBadge}>
                    <Text style={styles.featuredBadgeText}>Strategic Site</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity
                style={styles.sheetCloseBtn}
                onPress={() => setDetailSheetVisible(false)}
              >
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Photo with Individual Attribution */}
              {selectedPlace?.image_url && (
                <View style={styles.sheetImageContainer}>
                  <Image
                    source={{ uri: selectedPlace.image_url }}
                    style={styles.sheetImage}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    style={styles.sheetImageAttributionRow}
                    onPress={() => {
                      if (selectedPlace.image_credit_url) {
                        Linking.openURL(selectedPlace.image_credit_url).catch(() => {});
                      }
                    }}
                  >
                    <Text style={styles.sheetAttributionText} numberOfLines={1}>
                      ⓘ {selectedPlace.image_attribution}
                    </Text>
                    <Ionicons
                      name="open-outline"
                      size={12}
                      color={colors.textTertiary}
                    />
                  </TouchableOpacity>
                </View>
              )}

              {/* Strategic Featured One-Line Note */}
              {selectedPlace?.is_featured && selectedPlace.featured_note && (
                <View style={styles.sheetFeaturedNoteBox}>
                  <Text style={styles.sheetFeaturedNoteText}>
                    "{selectedPlace.featured_note}"
                  </Text>
                </View>
              )}

              {/* Coordinates & Mention Count */}
              <Text style={styles.sheetSectionTitle}>
                Scripture Mentions ({selectedPlace?.verse_count || 0}) •{' '}
                {selectedPlace?.lat.toFixed(4)}°, {selectedPlace?.lng.toFixed(4)}°
              </Text>

              {/* Tappable Deep-Linking Verse References */}
              <View style={styles.verseRefsGrid}>
                {selectedPlace?.verse_refs.map(ref => (
                  <TouchableOpacity
                    key={ref}
                    style={styles.verseChip}
                    onPress={() => handleVersePress(ref)}
                  >
                    <Ionicons name="book-outline" size={12} color={colors.textSecondary} />
                    <Text style={styles.verseChipText}>{ref}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};
