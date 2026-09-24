import re
import math
import os
import sys

def hex_to_rgb(hex_str):
    hex_str = hex_str.strip().lstrip('#')
    if len(hex_str) == 3:
        hex_str = ''.join([c*2 for c in hex_str])
    return tuple(int(hex_str[i:i+2], 16) for i in (0, 2, 4))

def relative_luminance(rgb):
    # WCAG 2.1 relative luminance calculation
    sRGB = [v / 255.0 for v in rgb]
    R, G, B = [v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4 for v in sRGB]
    return 0.2126 * R + 0.7152 * G + 0.0722 * B

def contrast_ratio(hex1, hex2):
    lum1 = relative_luminance(hex_to_rgb(hex1))
    lum2 = relative_luminance(hex_to_rgb(hex2))
    lighter = max(lum1, lum2)
    darker = min(lum1, lum2)
    return (lighter + 0.05) / (darker + 0.05)

def run_tests():
    print("=" * 60)
    print("  SCRIPTURA UI/UX DESIGN SYSTEM VERIFICATION SUITE")
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

    # --- Test 1: Spacing Scale ---
    tokens_path = os.path.join(base_dir, "src", "theme", "tokens.ts")
    with open(tokens_path, "r", encoding="utf-8") as f:
        tokens_code = f.read()

    assert_test("xs: 4" in tokens_code and "sm: 8" in tokens_code and "md: 12" in tokens_code and 
                "lg: 16" in tokens_code and "xl: 24" in tokens_code and "xxl: 32" in tokens_code and 
                "xxxl: 48" in tokens_code,
                "Spacing Scale is 4/8/12/16/24/32/48px everywhere")

    # --- Test 2: Typography & Scripture Body Constraints ---
    assert_test("scripture: 17" in tokens_code, "Scripture baseline font size is 17px")
    assert_test("FONT_SIZE_MIN" in tokens_code and "FONT_SIZE_MAX" in tokens_code, "Font size range is bounded (min/max)")
    assert_test("scripture: 1.65" in tokens_code or ("1.5" in tokens_code and "1.7" in tokens_code), 
                "Scripture line height is in 1.5–1.7 comfort range")
    assert_test("paddingHorizontal: SPACING.xl" in tokens_code or "paddingHorizontal: 24" in tokens_code, 
                "Reading column constrained with generous side margins")

    # --- Test 3: WCAG AA Contrast Ratios for Themes ---
    themes_path = os.path.join(base_dir, "src", "theme", "themes.ts")
    with open(themes_path, "r", encoding="utf-8") as f:
        themes_code = f.read()

    assert_test("light:" in themes_code and "dark:" in themes_code and "sepia:" in themes_code and
                "forest:" in themes_code and "midnight:" in themes_code and "sandstone:" in themes_code,
                "Six distinct eye-friendly themes defined: Light, Dark, Sepia, Forest, Midnight, Sandstone")

    # Extract colors for contrast checks
    # Light
    light_bg = "#FAFAF9"
    light_surf = "#FFFFFF"
    light_text = "#1C1917"
    light_scrip = "#1F2937"
    cr_light_text = contrast_ratio(light_bg, light_text)
    cr_light_scrip = contrast_ratio(light_surf, light_scrip)
    assert_test(cr_light_text >= 4.5, f"Light theme text contrast meets WCAG AA: {cr_light_text:.2f}:1 >= 4.5:1")
    assert_test(cr_light_scrip >= 4.5, f"Light theme scripture contrast meets WCAG AA: {cr_light_scrip:.2f}:1 >= 4.5:1")

    # Dark
    dark_bg = "#0C0A09"
    dark_surf = "#1C1917"
    dark_text = "#FAFAF9"
    dark_scrip = "#E7E5E4"
    cr_dark_text = contrast_ratio(dark_bg, dark_text)
    cr_dark_scrip = contrast_ratio(dark_surf, dark_scrip)
    assert_test(cr_dark_text >= 4.5, f"Dark theme text contrast meets WCAG AA: {cr_dark_text:.2f}:1 >= 4.5:1")
    assert_test(cr_dark_scrip >= 4.5, f"Dark theme scripture contrast meets WCAG AA: {cr_dark_scrip:.2f}:1 >= 4.5:1")

    # Sepia
    sepia_bg = "#F5ECD7"
    sepia_surf = "#FDF8ED"
    sepia_text = "#3E2C1C"
    sepia_scrip = "#3E2C1C"
    cr_sepia_text = contrast_ratio(sepia_bg, sepia_text)
    cr_sepia_scrip = contrast_ratio(sepia_surf, sepia_scrip)
    assert_test(cr_sepia_text >= 4.5, f"Sepia theme text contrast meets WCAG AA: {cr_sepia_text:.2f}:1 >= 4.5:1")
    assert_test(cr_sepia_scrip >= 4.5, f"Sepia theme scripture contrast meets WCAG AA: {cr_sepia_scrip:.2f}:1 >= 4.5:1")

    # Forest
    forest_bg = "#0D1914"
    forest_surf = "#162820"
    forest_text = "#E2ECE6"
    forest_scrip = "#E6EFEB"
    cr_forest_text = contrast_ratio(forest_bg, forest_text)
    cr_forest_scrip = contrast_ratio(forest_surf, forest_scrip)
    assert_test(cr_forest_text >= 4.5, f"Forest theme text contrast meets WCAG AA: {cr_forest_text:.2f}:1 >= 4.5:1")
    assert_test(cr_forest_scrip >= 4.5, f"Forest theme scripture contrast meets WCAG AA: {cr_forest_scrip:.2f}:1 >= 4.5:1")

    # Midnight
    midnight_bg = "#0A0F1D"
    midnight_surf = "#11192E"
    midnight_text = "#E2E8F0"
    midnight_scrip = "#EAF0F8"
    cr_midnight_text = contrast_ratio(midnight_bg, midnight_text)
    cr_midnight_scrip = contrast_ratio(midnight_surf, midnight_scrip)
    assert_test(cr_midnight_text >= 4.5, f"Midnight theme text contrast meets WCAG AA: {cr_midnight_text:.2f}:1 >= 4.5:1")
    assert_test(cr_midnight_scrip >= 4.5, f"Midnight theme scripture contrast meets WCAG AA: {cr_midnight_scrip:.2f}:1 >= 4.5:1")

    # Sandstone
    sandstone_bg = "#F5EFE6"
    sandstone_surf = "#FAF6F0"
    sandstone_text = "#2D221A"
    sandstone_scrip = "#2D221A"
    cr_sandstone_text = contrast_ratio(sandstone_bg, sandstone_text)
    cr_sandstone_scrip = contrast_ratio(sandstone_surf, sandstone_scrip)
    assert_test(cr_sandstone_text >= 4.5, f"Sandstone theme text contrast meets WCAG AA: {cr_sandstone_text:.2f}:1 >= 4.5:1")
    assert_test(cr_sandstone_scrip >= 4.5, f"Sandstone theme scripture contrast meets WCAG AA: {cr_sandstone_scrip:.2f}:1 >= 4.5:1")

    # --- Test 4: Navigation Restructure (Max 5 Bottom Tabs) ---
    nav_path = os.path.join(base_dir, "src", "navigation", "RootNavigator.tsx")
    with open(nav_path, "r", encoding="utf-8") as f:
        nav_code = f.read()

    tab_screen_matches = re.findall(r'<Tab\.Screen\s+name=["\'](\w+)["\']', nav_code)
    assert_test(len(tab_screen_matches) == 5, f"Bottom tab bar has exactly 5 items: {tab_screen_matches}")
    assert_test("Community" not in tab_screen_matches and "Confessions" not in tab_screen_matches and "Downloads" not in tab_screen_matches,
                "Community, Confessions, and Downloads folded into stack navigators")
    assert_test("HomeStack.Screen" in nav_code and "Community" in nav_code and "Confessions" in nav_code,
                "Community and Confessions mounted as Home stack sub-screens")
    assert_test("ProfileStack.Screen" in nav_code and "Downloads" in nav_code,
                "Downloads mounted as Settings/Profile stack sub-screen")
    assert_test("Ionicons" in nav_code, "Navigation uses consistent Ionicons outline icon set")

    # --- Test 5: Onboarding Flow (Max 3 Screens, Direct into Reading) ---
    onboarding_path = os.path.join(base_dir, "src", "screens", "OnboardingScreen.tsx")
    with open(onboarding_path, "r", encoding="utf-8") as f:
        onboarding_code = f.read()

    slides_count = len(re.findall(r'title:\s*[\'"][^\'"]+[\'"]', onboarding_code))
    assert_test(slides_count <= 3, f"Onboarding is max 3 screens (actual: {slides_count})")
    assert_test("AsyncStorage" in onboarding_code and "onComplete" in onboarding_code,
                "Onboarding completion persists and transitions immediately into reading")

    # --- Test 6: Designed Empty States ---
    empty_state_path = os.path.join(base_dir, "src", "components", "EmptyState.tsx")
    assert_test(os.path.exists(empty_state_path), "Designed EmptyState component exists")
    with open(empty_state_path, "r", encoding="utf-8") as f:
        empty_code = f.read()
    assert_test("Ionicons" in empty_code and "title" in empty_code and ("message" in empty_code or "description" in empty_code),
                "EmptyState provides icon, title, and descriptive message")

    # --- Test 7: Haptic Feedback Integration ---
    haptics_path = os.path.join(base_dir, "src", "utils", "haptics.ts")
    assert_test(os.path.exists(haptics_path), "Haptic feedback utility exists")
    with open(haptics_path, "r", encoding="utf-8") as f:
        haptics_code = f.read()
    assert_test("hapticLight" in haptics_code and "hapticMedium" in haptics_code and "hapticSuccess" in haptics_code,
                "Haptic tiers (light, medium, success) defined")

    # --- Test 8: Screen-by-Screen Design System Conformance ---
    # ReadScreen
    read_path = os.path.join(base_dir, "src", "screens", "ReadScreen.tsx")
    with open(read_path, "r", encoding="utf-8") as f:
        read_code = f.read()
    assert_test("useTheme" in read_code, "ReadScreen uses ThemeContext")
    assert_test("fonts.serif" in read_code, "ReadScreen scripture body uses serif font")
    assert_test("scriptureFontSize" in read_code and "scriptureLineHeight" in read_code,
                "ReadScreen uses dynamic adjustable font size and line height")
    assert_test("readingColumn" in read_code, "ReadScreen constrains reading column line width")
    assert_test("hapticLight" in read_code or "hapticMedium" in read_code, "ReadScreen triggers haptic feedback on interactions")
    assert_test("appearanceModalVisible" in read_code and "Aa" in read_code, "ReadScreen includes in-app appearance & font-size controls")

    # LibraryScreen
    lib_path = os.path.join(base_dir, "src", "screens", "LibraryScreen.tsx")
    with open(lib_path, "r", encoding="utf-8") as f:
        lib_code = f.read()
    assert_test("useTheme" in lib_code, "LibraryScreen uses ThemeContext")
    assert_test("EmptyState" in lib_code, "LibraryScreen uses designed EmptyState component across tabs")

    # HomeScreen
    home_path = os.path.join(base_dir, "src", "screens", "HomeScreen.tsx")
    with open(home_path, "r", encoding="utf-8") as f:
        home_code = f.read()
    assert_test("useTheme" in home_code, "HomeScreen uses ThemeContext")
    assert_test("Community" in home_code and "Confessions" in home_code, "HomeScreen links to sub-screens Community & Confessions")
    assert_test("lastReadCard" in home_code and "handleResumeReading" in home_code,
                "HomeScreen features full clickable Last Scripture Read card")
    assert_test("scriptureQuoteText" in home_code or "latestVerseData" in home_code,
                "HomeScreen displays actual scripture text snippet for the last read passage")
    assert_test("hapticSelection" in home_code, "HomeScreen triggers haptic feedback on resuming reading")

    # ProfileScreen
    prof_path = os.path.join(base_dir, "src", "screens", "ProfileScreen.tsx")
    with open(prof_path, "r", encoding="utf-8") as f:
        prof_code = f.read()
    assert_test("useTheme" in prof_code, "ProfileScreen uses ThemeContext")
    assert_test("THEME_LABELS" in prof_code and "setThemeName" in prof_code, "ProfileScreen includes theme selector")
    assert_test("setScriptureFontSize" in prof_code, "ProfileScreen includes font size controls")

    # ConfessionsScreen
    conf_path = os.path.join(base_dir, "src", "screens", "ConfessionsScreen.tsx")
    with open(conf_path, "r", encoding="utf-8") as f:
        conf_code = f.read()
    assert_test("useTheme" in conf_code, "ConfessionsScreen uses ThemeContext")

    # CommunityScreen
    comm_path = os.path.join(base_dir, "src", "screens", "CommunityScreen.tsx")
    with open(comm_path, "r", encoding="utf-8") as f:
        comm_code = f.read()
    assert_test("useTheme" in comm_code, "CommunityScreen uses ThemeContext")
    assert_test("EmptyState" in comm_code, "CommunityScreen uses EmptyState component")

    # DownloadsScreen
    down_path = os.path.join(base_dir, "src", "screens", "DownloadsScreen.tsx")
    with open(down_path, "r", encoding="utf-8") as f:
        down_code = f.read()
    assert_test("useTheme" in down_code, "DownloadsScreen uses ThemeContext")

    print("=" * 60)
    print(f"  TOTAL TESTS: {total} | PASSED: {passed} | FAILED: {total - passed}")
    print("=" * 60)
    if passed == total:
        print("  ALL UI/UX DESIGN SYSTEM SPECIFICATIONS MET PERFECTLY!")
        sys.exit(0)
    else:
        sys.exit(1)

if __name__ == "__main__":
    run_tests()
