import BIBLE_PLACES_DATA from '../../../assets/data/bible_places.json';

export interface BiblePlace {
  id: string;
  ancient_id?: string;
  name: string;
  lat: number;
  lng: number;
  confidence: number;
  verse_refs: string[];
  verse_count: number;
  image_url: string | null;
  image_attribution: string;
  image_credit_url: string;
  is_featured: boolean;
  featured_note: string | null;
}

class BiblePlacesService {
  private places: BiblePlace[] = [];
  private featuredPlaces: BiblePlace[] = [];
  private placeMap: Map<string, BiblePlace> = new Map();

  constructor() {
    this.init();
  }

  private init() {
    this.places = (BIBLE_PLACES_DATA as BiblePlace[]) || [];
    this.featuredPlaces = this.places.filter(p => p.is_featured);
    for (const p of this.places) {
      this.placeMap.set(p.id, p);
      this.placeMap.set(p.name.toLowerCase(), p);
    }
  }

  /**
   * Returns all 1,300+ geo-referenced biblical places.
   */
  public getAllPlaces(): BiblePlace[] {
    return this.places;
  }

  /**
   * Returns the curated ~40-60 strategic featured biblical locations.
   */
  public getFeaturedPlaces(): BiblePlace[] {
    return this.featuredPlaces;
  }

  /**
   * Finds a place by its ID or name.
   */
  public getPlaceById(idOrName: string): BiblePlace | null {
    if (!idOrName) return null;
    return (
      this.placeMap.get(idOrName) ||
      this.placeMap.get(idOrName.toLowerCase()) ||
      null
    );
  }

  /**
   * Searches places by name prefix or substring match.
   */
  public searchPlaces(query: string, maxResults = 25): BiblePlace[] {
    const q = query.trim().toLowerCase();
    if (!q) return this.featuredPlaces.slice(0, maxResults);

    const matches: BiblePlace[] = [];
    
    // First: exact or prefix matches
    for (const p of this.places) {
      const lower = p.name.toLowerCase();
      if (lower.startsWith(q)) {
        matches.push(p);
        if (matches.length >= maxResults) return matches;
      }
    }

    // Second: substring matches
    for (const p of this.places) {
      const lower = p.name.toLowerCase();
      if (!lower.startsWith(q) && lower.includes(q)) {
        matches.push(p);
        if (matches.length >= maxResults) return matches;
      }
    }

    return matches;
  }
}

export const biblePlacesService = new BiblePlacesService();
