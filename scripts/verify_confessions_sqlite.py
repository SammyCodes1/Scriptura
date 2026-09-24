import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'assets', 'bibles.db')

def test_confession_sqlite():
    print("============================================================")
    print("TESTING CONFESSIONS SQLITE PERSISTENCE & SCHEMA")
    print("============================================================")
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # 1. Create tables if not exist (as done in sqlite.ts)
    cursor.executescript("""
      CREATE TABLE IF NOT EXISTS local_confession_decks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        theme TEXT NOT NULL,
        description TEXT,
        is_custom INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        synced INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS local_confession_items (
        id TEXT PRIMARY KEY,
        deck_id TEXT NOT NULL,
        title TEXT NOT NULL,
        scripture_reference TEXT NOT NULL,
        confession_text TEXT NOT NULL,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        synced INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS local_confession_progress (
        deck_id TEXT PRIMARY KEY,
        completed_today INTEGER DEFAULT 0,
        streak INTEGER DEFAULT 0,
        times_recited INTEGER DEFAULT 0,
        last_recited_date TEXT,
        synced INTEGER DEFAULT 0
      );
    """)
    conn.commit()
    print("[Pass] Confession tables verified.")
    
    # 2. Insert test custom deck
    deck_id = "test_custom_deck_1"
    cursor.execute("""
      INSERT OR REPLACE INTO local_confession_decks (id, title, theme, description, is_custom, created_at, synced)
      VALUES (?, ?, ?, ?, 1, datetime('now'), 0)
    """, (deck_id, "Faith & Favor", "Custom", "Personal faith declarations"))
    
    cursor.execute("""
      INSERT OR REPLACE INTO local_confession_items (id, deck_id, title, scripture_reference, confession_text, sort_order, created_at, synced)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'), 0)
    """, ("citem_1", deck_id, "Shield of Faith", "Ephesians 6:16", "I take up the shield of faith which extinguishes every flaming dart.", 1))
    
    # 3. Update progress
    cursor.execute("""
      INSERT OR REPLACE INTO local_confession_progress (deck_id, completed_today, streak, times_recited, last_recited_date, synced)
      VALUES (?, 1, 5, 12, '2026-09-23', 0)
    """, (deck_id,))
    conn.commit()
    print("[Pass] Custom deck and items inserted.")
    
    # 4. Query
    cursor.execute("SELECT title, theme, is_custom FROM local_confession_decks WHERE id = ?", (deck_id,))
    row = cursor.fetchone()
    assert row == ("Faith & Favor", "Custom", 1), f"Unexpected deck row: {row}"
    print(f"[Pass] Queried deck: {row}")
    
    cursor.execute("SELECT streak, times_recited, last_recited_date FROM local_confession_progress WHERE deck_id = ?", (deck_id,))
    prog_row = cursor.fetchone()
    assert prog_row == (5, 12, '2026-09-23'), f"Unexpected progress row: {prog_row}"
    print(f"[Pass] Queried progress: streak={prog_row[0]}, recitations={prog_row[1]}")
    
    # 5. Clean up test record
    cursor.execute("DELETE FROM local_confession_decks WHERE id = ?", (deck_id,))
    cursor.execute("DELETE FROM local_confession_items WHERE deck_id = ?", (deck_id,))
    cursor.execute("DELETE FROM local_confession_progress WHERE deck_id = ?", (deck_id,))
    conn.commit()
    conn.close()
    
    print("\nALL CONFESSION SQLITE TESTS PASSED!")

if __name__ == '__main__':
    test_confession_sqlite()
