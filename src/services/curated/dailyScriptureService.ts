import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ChapterOfTheWeekData {
  bookCode: string;
  bookName: string;
  chapter: number;
  title: string;
  blurb: string;
  weekStartDate: string;
}

export interface VerseOfTheDayData {
  reference: string;
  bookCode: string;
  chapter: number;
  verse: number;
  text: string;
  theme: string;
}

const CHAPTERS_OF_THE_WEEK: Array<Omit<ChapterOfTheWeekData, 'weekStartDate'>> = [
  {
    bookCode: 'ROM',
    bookName: 'Romans',
    chapter: 8,
    title: 'Romans 8 • Life in the Spirit',
    blurb:
      'Romans 8 is regarded as the pinnacle of Paul’s theology of grace. It begins with no condemnation for those in Christ Jesus, walks through our adoption as children of God and the Holy Spirit interceding in our weaknesses, and concludes with the triumphant promise that nothing in all creation can separate us from the love of God.',
  },
  {
    bookCode: 'ISA',
    bookName: 'Isaiah',
    chapter: 53,
    title: 'Isaiah 53 • The Suffering Servant',
    blurb:
      'Penned seven centuries before the cross, Isaiah 53 is the foundational prophecy of substitutionary atonement. It reveals God’s servant pierced for our transgressions, crushed for our iniquities, and carrying our sorrows so that by His wounds we might be made whole.',
  },
  {
    bookCode: 'HEB',
    bookName: 'Hebrews',
    chapter: 11,
    title: 'Hebrews 11 • The Hall of Faith',
    blurb:
      'Faith is the assurance of things hoped for, the conviction of things not seen. This chapter recounts generation after generation—Abraham, Moses, Rahab—who persevered through trials by keeping their eyes on a city whose builder and maker is God.',
  },
  {
    bookCode: 'PSA',
    bookName: 'Psalms',
    chapter: 23,
    title: 'Psalm 23 • The Shepherd’s Valley',
    blurb:
      'David’s beloved psalm of pastoral protection and intimate fellowship. Even in the valley of the shadow of death, we fear no evil because the Lord prepares a table before us and His goodness and mercy follow us all the days of our lives.',
  },
  {
    bookCode: 'JHN',
    bookName: 'John',
    chapter: 15,
    title: 'John 15 • The True Vine',
    blurb:
      'Jesus gives His disciples the secret of spiritual fruitfulness on the night before His crucifixion: Abiding. Apart from Him we can do nothing; in Him, our joy is made complete and our prayers are answered as we love one another.',
  },
];

const CURATED_VERSES_OF_THE_DAY: VerseOfTheDayData[] = [
  {
    reference: 'Philippians 4:6-7',
    bookCode: 'PHP',
    chapter: 4,
    verse: 6,
    text: 'Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God. And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus.',
    theme: 'Peace',
  },
  {
    reference: 'Jeremiah 29:11',
    bookCode: 'JER',
    chapter: 29,
    verse: 11,
    text: '“For I know the plans I have for you,” declares the Lord, “plans to prosper you and not to harm you, plans to give you hope and a future.”',
    theme: 'Hope',
  },
  {
    reference: 'Proverbs 3:5-6',
    bookCode: 'PRO',
    chapter: 3,
    verse: 5,
    text: 'Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.',
    theme: 'Wisdom',
  },
  {
    reference: 'Isaiah 40:31',
    bookCode: 'ISA',
    chapter: 40,
    verse: 31,
    text: 'Those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint.',
    theme: 'Strength',
  },
  {
    reference: 'Romans 12:2',
    bookCode: 'ROM',
    chapter: 12,
    verse: 2,
    text: 'Do not conform to the pattern of this world, but be transformed by the renewing of your mind. Then you will be able to test and approve what God’s will is—his good, pleasing and perfect will.',
    theme: 'Transformation',
  },
  {
    reference: 'Joshua 1:9',
    bookCode: 'JOS',
    chapter: 1,
    verse: 9,
    text: 'Have I not commanded you? Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.',
    theme: 'Courage',
  },
  {
    reference: 'Matthew 6:33',
    bookCode: 'MAT',
    chapter: 6,
    verse: 33,
    text: 'Seek first his kingdom and his righteousness, and all these things will be given to you as well.',
    theme: 'Priority',
  },
];

/**
 * Returns the current Chapter of the Week based on Monday rotation.
 */
export function getChapterOfTheWeek(): ChapterOfTheWeekData {
  const now = new Date();
  // Get current Monday
  const dayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday...
  const diffToMonday = (dayOfWeek + 6) % 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - diffToMonday);
  const weekStartString = monday.toISOString().split('T')[0];

  // Rotate based on week number
  const weekNumber = Math.floor(now.getTime() / (7 * 24 * 60 * 60 * 1000));
  const index = Math.abs(weekNumber) % CHAPTERS_OF_THE_WEEK.length;
  const item = CHAPTERS_OF_THE_WEEK[index];

  return {
    ...item,
    weekStartDate: weekStartString,
  };
}

/**
 * Returns today's Verse of the Day from the curated rotating calendar.
 */
export function getVerseOfTheDay(): VerseOfTheDayData {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));

  const index = dayOfYear % CURATED_VERSES_OF_THE_DAY.length;
  return CURATED_VERSES_OF_THE_DAY[index];
}

/**
 * Notification opt-in preference for Chapter of the Week
 */
const NOTIFY_KEY = 'scriptura_notify_chapter_of_week';

export async function isChapterOfWeekNotificationOptedIn(): Promise<boolean> {
  const res = await AsyncStorage.getItem(NOTIFY_KEY);
  return res === 'true';
}

export async function setChapterOfWeekNotificationOptIn(optIn: boolean): Promise<void> {
  await AsyncStorage.setItem(NOTIFY_KEY, optIn ? 'true' : 'false');
}
