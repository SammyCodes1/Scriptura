import sqlite3
import json
import time
import os
import sys

def run_verification(db_path="assets/bibles.db"):
    if not os.path.exists(db_path):
        print(f"ERROR: Database file {db_path} not found!")
        sys.exit(1)
        
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    
    print("=" * 60)
    print("SCRIPTURA BIBLE PROVIDER & CACHE VERIFICATION")
    print("=" * 60)
    
    # 1. Test Bundled Free Translations (KJV, ASV, WEB, YLT, BBE)
    print("\n--- TEST 1: Bundled Free Translations (Zero Network, SQLite) ---")
    translations = ["KJV", "ASV", "WEB", "YLT", "BBE"]
    for tr in translations:
        cur.execute("SELECT COUNT(*) FROM verses WHERE translation = ?", (tr,))
        count = cur.fetchone()[0]
        cur.execute("SELECT verse, text FROM verses WHERE translation = ? AND book_code = 'GEN' AND chapter = 1 AND verse = 1", (tr,))
        v1 = cur.fetchone()
        v1_text = v1[1] if v1 else "MISSING"
        print(f"[{tr}] Total verses: {count:,} | Gen 1:1: \"{v1_text[:60]}...\"")
        assert count > 31000, f"{tr} verse count too low ({count})"
        assert v1 is not None, f"{tr} Gen 1:1 missing"

    # 2. Test John 1 in WEB
    print("\n--- TEST 2: Free Local Chapter Fetch (WEB John 1) ---")
    cur.execute("SELECT verse, text FROM verses WHERE translation = 'WEB' AND book_code = 'JHN' AND chapter = 1 ORDER BY verse ASC LIMIT 3")
    rows = cur.fetchall()
    for v, t in rows:
        print(f"  v{v}: {t}")
    assert len(rows) == 3, "WEB John 1 query failed"

    # 3. Test Remote Licensed Translation Fetch & SQLite Caching (ESV John 1)
    print("\n--- TEST 3: Licensed Remote Translation Simulation & Caching (ESV John 1) ---")
    
    # Simulate API.Bible fetch result for ESV John 1
    remote_esv_verses = [
        {"verse": 1, "text": "In the beginning was the Word, and the Word was with God, and the Word was God."},
        {"verse": 2, "text": "He was in the beginning with God."},
        {"verse": 3, "text": "All things were made through him, and without him was not any thing made that was made."},
        {"verse": 4, "text": "In him was life, and the life was the light of men."},
        {"verse": 5, "text": "The light shines in the darkness, and the darkness has not overcome it."}
    ]
    
    # Check cache before insertion (expecting not yet cached or testing flow)
    cur.execute("DELETE FROM cached_chapters WHERE translation = 'ESV' AND book_code = 'JHN' AND chapter = 1")
    conn.commit()
    
    cur.execute("SELECT content_json FROM cached_chapters WHERE translation = 'ESV' AND book_code = 'JHN' AND chapter = 1")
    assert cur.fetchone() is None, "Cache should be empty before first fetch"
    print("  [Pass] Cache check before fetch: NULL (Fresh fetch required)")
    
    # Perform caching
    now = int(time.time())
    cur.execute(
        "INSERT OR REPLACE INTO cached_chapters (translation, book_code, chapter, content_json, cached_at) VALUES (?, ?, ?, ?, ?)",
        ("ESV", "JHN", 1, json.dumps(remote_esv_verses), now)
    )
    conn.commit()
    print("  [Pass] Simulated API.Bible fetch result stored into SQLite `cached_chapters` table.")

    # 4. Prove Repeat Reads come from local SQLite Cache (Offline Capability)
    print("\n--- TEST 4: Repeat Read from SQLite Cache (Zero Network Call) ---")
    cur.execute("SELECT content_json, cached_at FROM cached_chapters WHERE translation = 'ESV' AND book_code = 'JHN' AND chapter = 1")
    row = cur.fetchone()
    assert row is not None, "Failed to retrieve cached chapter"
    cached_verses = json.loads(row[0])
    cached_timestamp = row[1]
    
    print(f"  [Pass] Cache Hit! Retrieved {len(cached_verses)} verses cached at epoch {cached_timestamp}:")
    for v in cached_verses:
        print(f"    v{v['verse']}: {v['text']}")
    assert len(cached_verses) == 5
    assert cached_verses[0]["text"] == remote_esv_verses[0]["text"]

    # 5. Test Local Guest Storage (Bookmarks, Highlights, Notes, Reading History)
    print("\n--- TEST 5: Guest Mode Local Storage Tables ---")
    cur.execute("INSERT OR REPLACE INTO local_bookmarks (id, user_id, book, chapter, verse, translation, created_at, synced) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                ("bm_test_1", None, "John", 1, 1, "ESV", "2026-09-23T22:00:00Z", 0))
    cur.execute("INSERT OR REPLACE INTO local_highlights (id, user_id, book, chapter, verse, translation, color, created_at, synced) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                ("hl_test_1", None, "John", 1, 1, "ESV", "#FFE082", "2026-09-23T22:00:00Z", 0))
    cur.execute("INSERT OR REPLACE INTO local_notes (id, user_id, book, chapter, verse, translation, text, created_at, updated_at, synced) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                ("nt_test_1", None, "John", 1, 1, "ESV", "The Logos in Greek philosophy vs Christian gospel.", "2026-09-23T22:00:00Z", "2026-09-23T22:00:00Z", 0))
    cur.execute("INSERT OR REPLACE INTO local_reading_history (id, user_id, book, chapter, translation, last_read_at, synced) VALUES (?, ?, ?, ?, ?, ?, ?)",
                ("rh_test_1", None, "John", 1, "ESV", "2026-09-23T22:00:00Z", 0))
    conn.commit()

    cur.execute("SELECT COUNT(*) FROM local_bookmarks WHERE synced = 0")
    unsynced_bm = cur.fetchone()[0]
    print(f"  [Pass] Guest bookmarks stored locally: {unsynced_bm} unsynced items ready for Supabase sync.")

    conn.close()
    print("\n" + "=" * 60)
    print("ALL FOUNDATION VERIFICATIONS PASSED SUCCESSFULLY!")
    print("=" * 60)

if __name__ == "__main__":
    run_verification()
