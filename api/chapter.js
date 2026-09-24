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
    const { translation = 'KJV', book = 'JHN', chapter = '1' } = req.query || {};
    const trUpper = String(translation).toUpperCase();
    const bkUpper = String(book).toUpperCase();
    const chNum = parseInt(String(chapter), 10) || 1;

    const database = getDatabase();
    const stmt = database.prepare(
      `SELECT verse, text FROM verses 
       WHERE translation = ? AND (book_code = ? OR book = ?) AND chapter = ? 
       ORDER BY verse ASC`
    );
    const rows = stmt.all(trUpper, bkUpper, bkUpper, chNum);

    return res.status(200).json({
      translation: trUpper,
      bookCode: bkUpper,
      chapter: chNum,
      verses: rows.map(r => ({ verse: r.verse, text: r.text })),
    });
  } catch (err) {
    console.error('API /api/chapter error:', err);
    return res.status(500).json({ error: err.message, verses: [] });
  }
};
