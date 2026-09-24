const path = require('path');
const fs = require('fs');

let db = null;

function getDatabase() {
  if (db) return db;
  const { DatabaseSync } = require('node:sqlite');
  const possiblePaths = [
    path.join(process.cwd(), 'assets', 'bibles.db'),
    path.join(__dirname, '..', 'assets', 'bibles.db'),
    path.join(__dirname, 'assets', 'bibles.db'),
    path.join('/var/task', 'assets', 'bibles.db'),
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      db = new DatabaseSync(p, { readOnly: true });
      return db;
    }
  }
  throw new Error('bibles.db not found in paths: ' + possiblePaths.join(', '));
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=86400');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { translation = 'KJV', query = '', limit = '50' } = req.query || {};
    const trUpper = String(translation).toUpperCase();
    const queryStr = String(query).trim();
    const limitNum = Math.min(parseInt(String(limit), 10) || 50, 150);

    if (!queryStr || queryStr.length < 2) {
      return res.status(200).json({ results: [] });
    }

    const database = getDatabase();
    let rows = [];

    if (trUpper === 'ALL') {
      const stmt = database.prepare(
        `SELECT translation, book, book_code, chapter, verse, text 
         FROM verses 
         WHERE text LIKE ? 
         LIMIT ?`
      );
      rows = stmt.all(`%${queryStr}%`, limitNum);
    } else {
      const stmt = database.prepare(
        `SELECT translation, book, book_code, chapter, verse, text 
         FROM verses 
         WHERE translation = ? AND text LIKE ? 
         LIMIT ?`
      );
      rows = stmt.all(trUpper, `%${queryStr}%`, limitNum);
    }

    return res.status(200).json({
      results: rows.map(r => ({
        translation: r.translation,
        book: r.book,
        book_code: r.book_code,
        chapter: r.chapter,
        verse: r.verse,
        text: r.text,
      })),
    });
  } catch (err) {
    console.error('API /api/search error:', err);
    return res.status(500).json({ error: err.message, results: [] });
  }
};
