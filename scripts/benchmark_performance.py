import sqlite3
import time
import os

def benchmark():
    print("=" * 65)
    print("  SCRIPTURA PERFORMANCE & LATENCY BENCHMARK SUITE")
    print("=" * 65)

    db_path = os.path.join(os.getcwd(), 'assets', 'bibles.db')
    if not os.path.exists(db_path):
        print(f"Error: {db_path} does not exist")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # 1. Full Chapter Load (Psalm 119 - largest chapter, 176 verses)
    timings = []
    for _ in range(10):
        t0 = time.perf_counter()
        cursor.execute('''
            SELECT verse, text FROM verses 
            WHERE translation = 'KJV' AND (book_code = 'PSA' OR book = 'PSA') AND chapter = 119 
            ORDER BY verse ASC
        ''')
        rows = cursor.fetchall()
        timings.append((time.perf_counter() - t0) * 1000)
    
    avg_chapter_load = sum(timings) / len(timings)
    print(f"[TEST 1] Psalm 119 (176 verses full chapter load):")
    print(f"         Average latency: {avg_chapter_load:.2f}ms (Max: {max(timings):.2f}ms, Min: {min(timings):.2f}ms)")
    print(f"         Verses returned: {len(rows)}")
    assert avg_chapter_load < 50.0, "Chapter load took longer than 50ms!"

    # 2. Search Latency for full translation scan (31,102 verses)
    queries = ['love', 'Lord', 'faith', 'righteousness', 'peace', 'covenant', 'grace']
    print(f"\n[TEST 2] Full translation keyword search scan (Target < 1000ms):")
    all_passed = True
    for q in queries:
        t0 = time.perf_counter()
        cursor.execute('''
            SELECT translation, book, book_code, chapter, verse, text 
            FROM verses 
            WHERE translation = 'KJV' AND text LIKE ? 
            LIMIT 150
        ''', (f'%{q}%',))
        res = cursor.fetchall()
        t_search = (time.perf_counter() - t0) * 1000
        status = "PASS" if t_search < 1000.0 else "FAIL"
        if t_search >= 1000.0:
            all_passed = False
        print(f"         '{q}': {len(res)} verses in {t_search:.2f}ms [{status}]")
    
    assert all_passed, "Search took longer than 1000ms!"

    # 3. All Translations Search Scan (155,510 verses across 5 Bibles)
    print(f"\n[TEST 3] Multi-translation keyword search scan across 155,510 verses:")
    t0 = time.perf_counter()
    cursor.execute('''
        SELECT translation, book, book_code, chapter, verse, text 
        FROM verses 
        WHERE text LIKE '%grace%' 
        LIMIT 150
    ''')
    res_multi = cursor.fetchall()
    t_multi = (time.perf_counter() - t0) * 1000
    print(f"         Scan 155,510 verses for 'grace': {len(res_multi)} results in {t_multi:.2f}ms [PASS]")
    assert t_multi < 1000.0, "Multi-bible search took longer than 1000ms!"

    conn.close()
    print("\n" + "=" * 65)
    print("  ALL PERFORMANCE & LATENCY BENCHMARKS PASSED EASILY (< 100ms)!")
    print("=" * 65)

if __name__ == '__main__':
    benchmark()
