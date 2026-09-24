import csv
import io
import json
import sqlite3
import urllib.request
import os
import sys

BOOK_MAP = {
    # Scrollmapper names
    "genesis": ("GEN", "Genesis"),
    "exodus": ("EXO", "Exodus"),
    "leviticus": ("LEV", "Leviticus"),
    "numbers": ("NUM", "Numbers"),
    "deuteronomy": ("DEU", "Deuteronomy"),
    "joshua": ("JOS", "Joshua"),
    "judges": ("JDG", "Judges"),
    "ruth": ("RUT", "Ruth"),
    "i samuel": ("1SA", "1 Samuel"),
    "ii samuel": ("2SA", "2 Samuel"),
    "1 samuel": ("1SA", "1 Samuel"),
    "2 samuel": ("2SA", "2 Samuel"),
    "i kings": ("1KI", "1 Kings"),
    "ii kings": ("2KI", "2 Kings"),
    "1 kings": ("1KI", "1 Kings"),
    "2 kings": ("2KI", "2 Kings"),
    "i chronicles": ("1CH", "1 Chronicles"),
    "ii chronicles": ("2CH", "2 Chronicles"),
    "1 chronicles": ("1CH", "1 Chronicles"),
    "2 chronicles": ("2CH", "2 Chronicles"),
    "ezra": ("EZR", "Ezra"),
    "nehemiah": ("NEH", "Nehemiah"),
    "esther": ("EST", "Esther"),
    "job": ("JOB", "Job"),
    "psalms": ("PSA", "Psalms"),
    "psalm": ("PSA", "Psalms"),
    "proverbs": ("PRO", "Proverbs"),
    "ecclesiastes": ("ECC", "Ecclesiastes"),
    "song of solomon": ("SNG", "Song of Solomon"),
    "song of songs": ("SNG", "Song of Solomon"),
    "isaiah": ("ISA", "Isaiah"),
    "jeremiah": ("JER", "Jeremiah"),
    "lamentations": ("LAM", "Lamentations"),
    "ezekiel": ("EZK", "Ezekiel"),
    "daniel": ("DAN", "Daniel"),
    "hosea": ("HOS", "Hosea"),
    "joel": ("JOL", "Joel"),
    "amos": ("AMO", "Amos"),
    "obadiah": ("OBA", "Obadiah"),
    "jonah": ("JON", "Jonah"),
    "micah": ("MIC", "Micah"),
    "nahum": ("NAM", "Nahum"),
    "habakkuk": ("HAB", "Habakkuk"),
    "zephaniah": ("ZEP", "Zephaniah"),
    "haggai": ("HAG", "Haggai"),
    "zechariah": ("ZEC", "Zechariah"),
    "malachi": ("MAL", "Malachi"),
    "matthew": ("MAT", "Matthew"),
    "mark": ("MRK", "Mark"),
    "luke": ("LUK", "Luke"),
    "john": ("JHN", "John"),
    "acts": ("ACT", "Acts"),
    "romans": ("ROM", "Romans"),
    "i corinthians": ("1CO", "1 Corinthians"),
    "ii corinthians": ("2CO", "2 Corinthians"),
    "1 corinthians": ("1CO", "1 Corinthians"),
    "2 corinthians": ("2CO", "2 Corinthians"),
    "galatians": ("GAL", "Galatians"),
    "ephesians": ("EPH", "Ephesians"),
    "philippians": ("PHP", "Philippians"),
    "colossians": ("COL", "Colossians"),
    "i thessalonians": ("1TH", "1 Thessalonians"),
    "ii thessalonians": ("2TH", "2 Thessalonians"),
    "1 thessalonians": ("1TH", "1 Thessalonians"),
    "2 thessalonians": ("2TH", "2 Thessalonians"),
    "i timothy": ("1TI", "1 Timothy"),
    "ii timothy": ("2TI", "2 Timothy"),
    "1 timothy": ("1TI", "1 Timothy"),
    "2 timothy": ("2TI", "2 Timothy"),
    "titus": ("TIT", "Titus"),
    "philemon": ("PHM", "Philemon"),
    "hebrews": ("HEB", "Hebrews"),
    "james": ("JAS", "James"),
    "i peter": ("1PE", "1 Peter"),
    "ii peter": ("2PE", "2 Peter"),
    "1 peter": ("1PE", "1 Peter"),
    "2 peter": ("2PE", "2 Peter"),
    "i john": ("1JN", "1 John"),
    "ii john": ("2JN", "2 John"),
    "iii john": ("3JN", "3 John"),
    "1 john": ("1JN", "1 John"),
    "2 john": ("2JN", "2 John"),
    "3 john": ("3JN", "3 John"),
    "jude": ("JUD", "Jude"),
    "revelation": ("REV", "Revelation"),
    "revelation of john": ("REV", "Revelation")
}

def normalize_book(name):
    clean = name.strip().lower()
    if clean in BOOK_MAP:
        return BOOK_MAP[clean]
    # try removing numbers or roman numerals
    clean = clean.replace(".", "").strip()
    if clean in BOOK_MAP:
        return BOOK_MAP[clean]
    print(f"Unknown book: '{name}'")
    return (name[:3].upper(), name)

def download_url(url):
    print(f"Downloading {url} ...")
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as resp:
        return resp.read().decode('utf-8', errors='replace')

def build_database(db_path):
    os.makedirs(os.path.dirname(os.path.abspath(db_path)), exist_ok=True)
    if os.path.exists(db_path):
        os.remove(db_path)
    
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    
    # 1. verses table
    cur.execute("""
    CREATE TABLE verses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        translation TEXT NOT NULL,
        book TEXT NOT NULL,
        book_code TEXT NOT NULL,
        chapter INTEGER NOT NULL,
        verse INTEGER NOT NULL,
        text TEXT NOT NULL
    );
    """)
    cur.execute("CREATE INDEX idx_verses_lookup ON verses(translation, book_code, chapter, verse);")
    cur.execute("CREATE INDEX idx_verses_book ON verses(translation, book, chapter);")
    
    # 2. cached_chapters table (for API.Bible cached chapters)
    cur.execute("""
    CREATE TABLE cached_chapters (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        translation TEXT NOT NULL,
        book_code TEXT NOT NULL,
        chapter INTEGER NOT NULL,
        content_json TEXT NOT NULL,
        cached_at INTEGER NOT NULL,
        UNIQUE(translation, book_code, chapter)
    );
    """)
    
    # 3. local user tables (bookmarks, highlights, notes, reading history)
    cur.execute("""
    CREATE TABLE local_bookmarks (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        book TEXT NOT NULL,
        chapter INTEGER NOT NULL,
        verse INTEGER NOT NULL,
        translation TEXT NOT NULL,
        created_at TEXT NOT NULL,
        synced INTEGER DEFAULT 0
    );
    """)
    
    cur.execute("""
    CREATE TABLE local_highlights (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        book TEXT NOT NULL,
        chapter INTEGER NOT NULL,
        verse INTEGER NOT NULL,
        translation TEXT NOT NULL,
        color TEXT NOT NULL,
        created_at TEXT NOT NULL,
        synced INTEGER DEFAULT 0
    );
    """)
    
    cur.execute("""
    CREATE TABLE local_notes (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        book TEXT NOT NULL,
        chapter INTEGER NOT NULL,
        verse INTEGER NOT NULL,
        translation TEXT NOT NULL,
        text TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        synced INTEGER DEFAULT 0
    );
    """)
    
    cur.execute("""
    CREATE TABLE local_reading_history (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        book TEXT NOT NULL,
        chapter INTEGER NOT NULL,
        translation TEXT NOT NULL,
        last_read_at TEXT NOT NULL,
        synced INTEGER DEFAULT 0
    );
    """)
    
    conn.commit()

    # Source 1: scrollmapper CSVs (KJV, ASV, BBE, YLT)
    scrollmapper_sources = {
        "KJV": "https://raw.githubusercontent.com/scrollmapper/bible_databases/master/formats/csv/KJV.csv",
        "ASV": "https://raw.githubusercontent.com/scrollmapper/bible_databases/master/formats/csv/ASV.csv",
        "BBE": "https://raw.githubusercontent.com/scrollmapper/bible_databases/master/formats/csv/BBE.csv",
        "YLT": "https://raw.githubusercontent.com/scrollmapper/bible_databases/master/formats/csv/YLT.csv",
    }
    
    for tr_code, url in scrollmapper_sources.items():
        data = download_url(url)
        reader = csv.reader(io.StringIO(data))
        header = next(reader, None)
        rows_to_insert = []
        for row in reader:
            if not row or len(row) < 4:
                continue
            book_raw, chap_raw, verse_raw, text_raw = row[0], row[1], row[2], row[3]
            try:
                chap = int(chap_raw)
                verse = int(verse_raw)
            except ValueError:
                continue
            b_code, b_name = normalize_book(book_raw)
            rows_to_insert.append((tr_code, b_name, b_code, chap, verse, text_raw.strip()))
        
        cur.executemany(
            "INSERT INTO verses (translation, book, book_code, chapter, verse, text) VALUES (?, ?, ?, ?, ?, ?)",
            rows_to_insert
        )
        conn.commit()
        print(f"Inserted {len(rows_to_insert)} verses for {tr_code}")
    
    # Source 2: super_bible_WEB.csv (WEB)
    web_url = "https://raw.githubusercontent.com/alshival/super_bible/main/SUPER_BIBLE/version_files/super_bible_WEB.csv"
    web_data = download_url(web_url)
    web_reader = csv.reader(io.StringIO(web_data))
    web_header = next(web_reader, None) # "testament","book","title","chapter","verse","text","version","language"
    rows_web = []
    for row in web_reader:
        if not row or len(row) < 6:
            continue
        # title is at index 2, chapter at 3, verse at 4, text at 5
        book_raw = row[2]
        chap_raw = row[3]
        verse_raw = row[4]
        text_raw = row[5]
        try:
            chap = int(chap_raw)
            verse = int(verse_raw)
        except ValueError:
            continue
        b_code, b_name = normalize_book(book_raw)
        rows_web.append(("WEB", b_name, b_code, chap, verse, text_raw.strip()))
    
    cur.executemany(
        "INSERT INTO verses (translation, book, book_code, chapter, verse, text) VALUES (?, ?, ?, ?, ?, ?)",
        rows_web
    )
    conn.commit()
    print(f"Inserted {len(rows_web)} verses for WEB")

    # Final counts and stats
    cur.execute("SELECT translation, COUNT(*) FROM verses GROUP BY translation")
    stats = cur.fetchall()
    print("\nSummary of bundled verses:")
    for tr, cnt in stats:
        print(f"  {tr}: {cnt} verses")
    
    conn.close()
    file_size_mb = os.path.getsize(db_path) / (1024 * 1024)
    print(f"\nCreated database at {db_path} ({file_size_mb:.2f} MB)")

if __name__ == "__main__":
    out = sys.argv[1] if len(sys.argv) > 1 else "assets/bibles.db"
    build_database(out)
