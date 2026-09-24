export interface BibleBookInfo {
  code: string; // 3-letter USFM code, e.g. "GEN"
  name: string; // "Genesis"
  testament: 'OT' | 'NT';
  chapters: number;
}

export const CANONICAL_BOOKS: BibleBookInfo[] = [
  // Old Testament (39 books)
  { code: 'GEN', name: 'Genesis', testament: 'OT', chapters: 50 },
  { code: 'EXO', name: 'Exodus', testament: 'OT', chapters: 40 },
  { code: 'LEV', name: 'Leviticus', testament: 'OT', chapters: 27 },
  { code: 'NUM', name: 'Numbers', testament: 'OT', chapters: 36 },
  { code: 'DEU', name: 'Deuteronomy', testament: 'OT', chapters: 34 },
  { code: 'JOS', name: 'Joshua', testament: 'OT', chapters: 24 },
  { code: 'JDG', name: 'Judges', testament: 'OT', chapters: 21 },
  { code: 'RUT', name: 'Ruth', testament: 'OT', chapters: 4 },
  { code: '1SA', name: '1 Samuel', testament: 'OT', chapters: 31 },
  { code: '2SA', name: '2 Samuel', testament: 'OT', chapters: 24 },
  { code: '1KI', name: '1 Kings', testament: 'OT', chapters: 22 },
  { code: '2KI', name: '2 Kings', testament: 'OT', chapters: 25 },
  { code: '1CH', name: '1 Chronicles', testament: 'OT', chapters: 29 },
  { code: '2CH', name: '2 Chronicles', testament: 'OT', chapters: 36 },
  { code: 'EZR', name: 'Ezra', testament: 'OT', chapters: 10 },
  { code: 'NEH', name: 'Nehemiah', testament: 'OT', chapters: 13 },
  { code: 'EST', name: 'Esther', testament: 'OT', chapters: 10 },
  { code: 'JOB', name: 'Job', testament: 'OT', chapters: 42 },
  { code: 'PSA', name: 'Psalms', testament: 'OT', chapters: 150 },
  { code: 'PRO', name: 'Proverbs', testament: 'OT', chapters: 31 },
  { code: 'ECC', name: 'Ecclesiastes', testament: 'OT', chapters: 12 },
  { code: 'SNG', name: 'Song of Solomon', testament: 'OT', chapters: 8 },
  { code: 'ISA', name: 'Isaiah', testament: 'OT', chapters: 66 },
  { code: 'JER', name: 'Jeremiah', testament: 'OT', chapters: 52 },
  { code: 'LAM', name: 'Lamentations', testament: 'OT', chapters: 5 },
  { code: 'EZK', name: 'Ezekiel', testament: 'OT', chapters: 48 },
  { code: 'DAN', name: 'Daniel', testament: 'OT', chapters: 12 },
  { code: 'HOS', name: 'Hosea', testament: 'OT', chapters: 14 },
  { code: 'JOL', name: 'Joel', testament: 'OT', chapters: 3 },
  { code: 'AMO', name: 'Amos', testament: 'OT', chapters: 9 },
  { code: 'OBA', name: 'Obadiah', testament: 'OT', chapters: 1 },
  { code: 'JON', name: 'Jonah', testament: 'OT', chapters: 4 },
  { code: 'MIC', name: 'Micah', testament: 'OT', chapters: 7 },
  { code: 'NAM', name: 'Nahum', testament: 'OT', chapters: 3 },
  { code: 'HAB', name: 'Habakkuk', testament: 'OT', chapters: 3 },
  { code: 'ZEP', name: 'Zephaniah', testament: 'OT', chapters: 3 },
  { code: 'HAG', name: 'Haggai', testament: 'OT', chapters: 2 },
  { code: 'ZEC', name: 'Zechariah', testament: 'OT', chapters: 14 },
  { code: 'MAL', name: 'Malachi', testament: 'OT', chapters: 4 },

  // New Testament (27 books)
  { code: 'MAT', name: 'Matthew', testament: 'NT', chapters: 28 },
  { code: 'MRK', name: 'Mark', testament: 'NT', chapters: 16 },
  { code: 'LUK', name: 'Luke', testament: 'NT', chapters: 24 },
  { code: 'JHN', name: 'John', testament: 'NT', chapters: 21 },
  { code: 'ACT', name: 'Acts', testament: 'NT', chapters: 28 },
  { code: 'ROM', name: 'Romans', testament: 'NT', chapters: 16 },
  { code: '1CO', name: '1 Corinthians', testament: 'NT', chapters: 16 },
  { code: '2CO', name: '2 Corinthians', testament: 'NT', chapters: 13 },
  { code: 'GAL', name: 'Galatians', testament: 'NT', chapters: 6 },
  { code: 'EPH', name: 'Ephesians', testament: 'NT', chapters: 6 },
  { code: 'PHP', name: 'Philippians', testament: 'NT', chapters: 4 },
  { code: 'COL', name: 'Colossians', testament: 'NT', chapters: 4 },
  { code: '1TH', name: '1 Thessalonians', testament: 'NT', chapters: 5 },
  { code: '2TH', name: '2 Thessalonians', testament: 'NT', chapters: 3 },
  { code: '1TI', name: '1 Timothy', testament: 'NT', chapters: 6 },
  { code: '2TI', name: '2 Timothy', testament: 'NT', chapters: 4 },
  { code: 'TIT', name: 'Titus', testament: 'NT', chapters: 3 },
  { code: 'PHM', name: 'Philemon', testament: 'NT', chapters: 1 },
  { code: 'HEB', name: 'Hebrews', testament: 'NT', chapters: 13 },
  { code: 'JAS', name: 'James', testament: 'NT', chapters: 5 },
  { code: '1PE', name: '1 Peter', testament: 'NT', chapters: 5 },
  { code: '2PE', name: '2 Peter', testament: 'NT', chapters: 3 },
  { code: '1JN', name: '1 John', testament: 'NT', chapters: 5 },
  { code: '2JN', name: '2 John', testament: 'NT', chapters: 1 },
  { code: '3JN', name: '3 John', testament: 'NT', chapters: 1 },
  { code: 'JUD', name: 'Jude', testament: 'NT', chapters: 1 },
  { code: 'REV', name: 'Revelation', testament: 'NT', chapters: 22 },
];

const CODE_MAP = new Map<string, BibleBookInfo>();
const NAME_MAP = new Map<string, BibleBookInfo>();

CANONICAL_BOOKS.forEach(book => {
  CODE_MAP.set(book.code.toUpperCase(), book);
  NAME_MAP.set(book.name.toLowerCase(), book);
  // Also aliases without spaces or with Roman numerals
  NAME_MAP.set(book.name.toLowerCase().replace(/\s+/g, ''), book);
});

// Common alias & abbreviation additions
const COMMON_ABBREVIATIONS: Record<string, string> = {
  // OT
  gen: 'GEN', ge: 'GEN', gn: 'GEN',
  exo: 'EXO', ex: 'EXO', exod: 'EXO',
  lev: 'LEV', le: 'LEV', lv: 'LEV',
  num: 'NUM', nu: 'NUM', nm: 'NUM', nb: 'NUM',
  deut: 'DEU', dt: 'DEU', de: 'DEU',
  josh: 'JOS', jos: 'JOS', jsh: 'JOS',
  judg: 'JDG', jdg: 'JDG', jg: 'JDG', jdgs: 'JDG',
  ruth: 'RUT', rth: 'RUT', ru: 'RUT',
  '1sam': '1SA', '1sa': '1SA', '1s': '1SA',
  '2sam': '2SA', '2sa': '2SA', '2s': '2SA',
  '1kings': '1KI', '1ki': '1KI', '1k': '1KI',
  '2kings': '2KI', '2ki': '2KI', '2k': '2KI',
  '1chron': '1CH', '1ch': '1CH',
  '2chron': '2CH', '2ch': '2CH',
  ezra: 'EZR', ezr: 'EZR',
  neh: 'NEH', ne: 'NEH',
  est: 'EST', esth: 'EST',
  job: 'JOB', jb: 'JOB',
  psalm: 'PSA', psalms: 'PSA', psa: 'PSA', ps: 'PSA', pss: 'PSA',
  prov: 'PRO', proverbs: 'PRO', pro: 'PRO', pr: 'PRO', prv: 'PRO',
  eccles: 'ECC', eccl: 'ECC', ecc: 'ECC', ec: 'ECC',
  song: 'SNG', sos: 'SNG', canticles: 'SNG',
  isa: 'ISA', is: 'ISA', isai: 'ISA',
  jer: 'JER', je: 'JER', jr: 'JER',
  lam: 'LAM', la: 'LAM',
  ezek: 'EZK', eze: 'EZK', ezk: 'EZK',
  dan: 'DAN', da: 'DAN', dn: 'DAN',
  hos: 'HOS', ho: 'HOS',
  joel: 'JOL', jl: 'JOL',
  amos: 'AMO', am: 'AMO',
  obad: 'OBA', ob: 'OBA',
  jonah: 'JON', jnh: 'JON', jon: 'JON',
  mic: 'MIC', mc: 'MIC',
  nah: 'NAM', na: 'NAM',
  hab: 'HAB', hb: 'HAB',
  zeph: 'ZEP', zep: 'ZEP', zp: 'ZEP',
  hag: 'HAG', hg: 'HAG',
  zech: 'ZEC', zec: 'ZEC', zc: 'ZEC',
  mal: 'MAL', ml: 'MAL',

  // NT
  matt: 'MAT', mat: 'MAT', mt: 'MAT',
  mark: 'MRK', mrk: 'MRK', mk: 'MRK',
  luke: 'LUK', luk: 'LUK', lk: 'LUK',
  john: 'JHN', jhn: 'JHN', jn: 'JHN', jno: 'JHN',
  acts: 'ACT', act: 'ACT', ac: 'ACT',
  rom: 'ROM', ro: 'ROM', rm: 'ROM',
  '1cor': '1CO', '1co': '1CO',
  '2cor': '2CO', '2co': '2CO',
  gal: 'GAL', ga: 'GAL',
  eph: 'EPH', ep: 'EPH',
  phil: 'PHP', php: 'PHP', pp: 'PHP',
  col: 'COL',
  '1thess': '1TH', '1th': '1TH',
  '2thess': '2TH', '2th': '2TH',
  '1tim': '1TI', '1ti': '1TI',
  '2tim': '2TI', '2ti': '2TI',
  titus: 'TIT', tit: 'TIT', ti: 'TIT',
  philem: 'PHM', phm: 'PHM', pm: 'PHM',
  heb: 'HEB', he: 'HEB',
  james: 'JAS', jas: 'JAS', jm: 'JAS',
  '1pet': '1PE', '1pe': '1PE', '1p': '1PE',
  '2pet': '2PE', '2pe': '2PE', '2p': '2PE',
  '1john': '1JN', '1jn': '1JN', '1j': '1JN',
  '2john': '2JN', '2jn': '2JN', '2j': '2JN',
  '3john': '3JN', '3jn': '3JN', '3j': '3JN',
  jude: 'JUD', jd: 'JUD',
  rev: 'REV', re: 'REV', apocalypse: 'REV',
};

Object.entries(COMMON_ABBREVIATIONS).forEach(([abbr, code]) => {
  const b = CODE_MAP.get(code);
  if (b) NAME_MAP.set(abbr, b);
});

// Roman numerals support
NAME_MAP.set('i samuel', CODE_MAP.get('1SA')!);
NAME_MAP.set('ii samuel', CODE_MAP.get('2SA')!);
NAME_MAP.set('i kings', CODE_MAP.get('1KI')!);
NAME_MAP.set('ii kings', CODE_MAP.get('2KI')!);
NAME_MAP.set('i chronicles', CODE_MAP.get('1CH')!);
NAME_MAP.set('ii chronicles', CODE_MAP.get('2CH')!);
NAME_MAP.set('i corinthians', CODE_MAP.get('1CO')!);
NAME_MAP.set('ii corinthians', CODE_MAP.get('2CO')!);
NAME_MAP.set('i thessalonians', CODE_MAP.get('1TH')!);
NAME_MAP.set('ii thessalonians', CODE_MAP.get('2TH')!);
NAME_MAP.set('i timothy', CODE_MAP.get('1TI')!);
NAME_MAP.set('ii timothy', CODE_MAP.get('2TI')!);
NAME_MAP.set('i peter', CODE_MAP.get('1PE')!);
NAME_MAP.set('ii peter', CODE_MAP.get('2PE')!);
NAME_MAP.set('i john', CODE_MAP.get('1JN')!);
NAME_MAP.set('ii john', CODE_MAP.get('2JN')!);
NAME_MAP.set('iii john', CODE_MAP.get('3JN')!);

export function resolveBook(input: string): BibleBookInfo | undefined {
  if (!input) return undefined;
  const trimmed = input.trim();
  const upper = trimmed.toUpperCase();
  if (CODE_MAP.has(upper)) {
    return CODE_MAP.get(upper);
  }
  const lower = trimmed.toLowerCase();
  if (NAME_MAP.has(lower)) {
    return NAME_MAP.get(lower);
  }
  const compressed = lower.replace(/\s+/g, '').replace(/\./g, '');
  if (NAME_MAP.has(compressed)) {
    return NAME_MAP.get(compressed);
  }
  // Try partial match
  return CANONICAL_BOOKS.find(b => b.name.toLowerCase().startsWith(lower));
}
