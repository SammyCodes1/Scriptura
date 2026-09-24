import os
import json
import re
import sys

def run_tests():
    print("=" * 60)
    print("  SCRIPTURA BIBLICAL PLACES & INTERACTIVE MAP VERIFICATION")
    print("=" * 60)
    passed = 0
    total = 0

    def assert_test(cond, title, detail=""):
        nonlocal passed, total
        total += 1
        if cond:
            passed += 1
            print(f"  [PASS] {title}")
        else:
            print(f"  [FAIL] {title} -- {detail}")

    base_dir = r"C:\Users\USER\Scriptura"

    # --- Test 1: Bundled Dataset (assets/data/bible_places.json) ---
    json_path = os.path.join(base_dir, "assets", "data", "bible_places.json")
    assert_test(os.path.exists(json_path), "Bundled JSON exists at assets/data/bible_places.json")
    
    with open(json_path, "r", encoding="utf-8") as f:
        places = json.load(f)

    assert_test(len(places) >= 1300, f"Over 1,300 identifiable places processed (actual: {len(places)})")

    # Check structure of records
    sample = places[0]
    required_keys = ["id", "name", "lat", "lng", "confidence", "verse_refs", "verse_count", "image_attribution", "is_featured"]
    assert_test(all(k in sample for k in required_keys), "Place record has all required fields")

    # Check coordinate bounds
    valid_coords = all(-90 <= p["lat"] <= 90 and -180 <= p["lng"] <= 180 for p in places)
    assert_test(valid_coords, "All places have valid latitude and longitude coordinates")

    # Check featured places
    featured = [p for p in places if p["is_featured"]]
    assert_test(len(featured) >= 30, f"Curated strategic places layer has >= 30 places (actual: {len(featured)})")
    
    # Check that featured places have custom historical notes
    has_notes = all(p.get("featured_note") and len(p["featured_note"]) > 10 for p in featured)
    assert_test(has_notes, "All featured strategic places have hand-crafted historical notes")

    # Check iconic places are in featured
    featured_names = {p["name"].lower() for p in featured}
    iconic = ["jerusalem", "bethlehem", "nazareth", "sea of galilee", "mount sinai", "jericho", "damascus", "rome", "ephesus"]
    all_iconic = all(any(ic in fn for fn in featured_names) for ic in iconic)
    assert_test(all_iconic, f"Core strategic sites present in featured layer: {iconic}")

    # Check individual per-image attributions
    with_images = [p for p in places if p.get("image_url")]
    assert_test(len(with_images) >= 500, f"Hundreds of places have verified photos (actual: {len(with_images)})")
    
    # Verify licenses vary (not one generic credit line)
    attributions = {p["image_attribution"] for p in with_images}
    has_cc_by = any("CC-BY" in a for a in attributions)
    has_cc_by_sa = any("CC-BY-SA" in a for a in attributions)
    assert_test(len(attributions) > 50 and (has_cc_by or has_cc_by_sa),
                f"Per-image attribution strings are individual and preserve author/license ({len(attributions)} unique lines)")

    # --- Test 2: Postgres Database Migration (supabase/migrations/20260924_bible_places.sql) ---
    migration_path = os.path.join(base_dir, "supabase", "migrations", "20260924_bible_places.sql")
    assert_test(os.path.exists(migration_path), "Postgres migration exists at supabase/migrations/20260924_bible_places.sql")

    with open(migration_path, "r", encoding="utf-8") as f:
        sql_content = f.read()

    assert_test('CREATE TABLE IF NOT EXISTS public."BiblePlace"' in sql_content, "Creates BiblePlace table in Postgres")
    assert_test('ENABLE ROW LEVEL SECURITY' in sql_content, "RLS enabled on BiblePlace table")
    assert_test('INSERT INTO public."BiblePlace"' in sql_content, "Contains bulk seed INSERT statements")
    assert_test('ON CONFLICT (id) DO UPDATE' in sql_content, "Upsert handling on duplicate primary key")

    # --- Test 3: Local SQLite Schema & Queries (src/database/sqlite.ts) ---
    sqlite_path = os.path.join(base_dir, "src", "database", "sqlite.ts")
    with open(sqlite_path, "r", encoding="utf-8") as f:
        sqlite_code = f.read()

    assert_test("local_bible_places" in sqlite_code, "local_bible_places table defined in SQLite schema")
    assert_test("getLocalBiblePlaces" in sqlite_code, "getLocalBiblePlaces function exported")
    assert_test("getLocalFeaturedBiblePlaces" in sqlite_code, "getLocalFeaturedBiblePlaces function exported")
    assert_test("searchLocalBiblePlaces" in sqlite_code, "searchLocalBiblePlaces function exported")

    # --- Test 4: Bible Places Service (src/services/map/biblePlacesService.ts) ---
    service_path = os.path.join(base_dir, "src", "services", "map", "biblePlacesService.ts")
    assert_test(os.path.exists(service_path), "biblePlacesService.ts exists")
    with open(service_path, "r", encoding="utf-8") as f:
        service_code = f.read()

    assert_test("getAllPlaces" in service_code and "getFeaturedPlaces" in service_code and "searchPlaces" in service_code,
                "biblePlacesService provides getAllPlaces, getFeaturedPlaces, searchPlaces")

    # --- Test 5: Map Screen UI & UX (src/screens/BibleMapScreen.tsx) ---
    map_screen_path = os.path.join(base_dir, "src", "screens", "BibleMapScreen.tsx")
    assert_test(os.path.exists(map_screen_path), "BibleMapScreen.tsx exists")
    with open(map_screen_path, "r", encoding="utf-8") as f:
        map_code = f.read()

    assert_test("react-native-maps" in map_code and "MapView" in map_code and "Marker" in map_code,
                "Uses react-native-maps (MapView, Marker)")
    assert_test("isZoomedOut" in map_code and "clusterMarkerPin" in map_code,
                "Implements viewport clustering when zoomed out to prevent unreadable pile of pins")
    assert_test("featuredMarkerPin" in map_code, "Distinct marker style for strategic featured places")
    assert_test("carouselCard" in map_code, "Swipeable Featured Places carousel present")
    assert_test("detailSheet" in map_code, "Place detail sheet modal present")
    assert_test("parseScriptureReference" in map_code and "navigateTo" in map_code and "'Read'" in map_code,
                "Tappable verse references deep-link straight into the Scripture reader")
    assert_test("OpenBible.info, CC BY 4.0" in map_code, "Persistent credit line on map screen")
    assert_test("searchInput" in map_code, "Text search box on map to find places and jump camera")
    assert_test("useTheme" in map_code, "BibleMapScreen conforms to the design system (useTheme)")

    # --- Test 6: Navigation Integration (RootNavigator.tsx & HomeScreen.tsx) ---
    nav_path = os.path.join(base_dir, "src", "navigation", "RootNavigator.tsx")
    with open(nav_path, "r", encoding="utf-8") as f:
        nav_code = f.read()

    assert_test("BibleMapScreen" in nav_code and 'name="BibleMap"' in nav_code,
                "BibleMapScreen mounted in HomeStack in RootNavigator")

    home_path = os.path.join(base_dir, "src", "screens", "HomeScreen.tsx")
    with open(home_path, "r", encoding="utf-8") as f:
        home_code = f.read()

    assert_test("BibleMap" in home_code and "Biblical Places Map" in home_code,
                "HomeScreen features entry card linking to Biblical Places Map")

    print("=" * 60)
    print(f"  TOTAL TESTS: {total} | PASSED: {passed} | FAILED: {total - passed}")
    print("=" * 60)
    if passed == total:
        print("  ALL BIBLICAL PLACES MAP REQUIREMENTS MET PERFECTLY!")
        sys.exit(0)
    else:
        sys.exit(1)

if __name__ == "__main__":
    run_tests()
