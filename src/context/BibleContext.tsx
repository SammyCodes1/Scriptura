import React, { createContext, useContext, useState, useEffect } from 'react';
import { bibleProvider } from '../services/bible/BibleProvider';
import { BibleChapter, BibleTranslationInfo } from '../services/bible/types';
import { resolveBook } from '../config/books';
import {
  addLocalBookmark,
  addLocalHighlight,
  addLocalNote,
  recordLocalReadingHistory,
} from '../database/sqlite';
import { useAuth } from './AuthContext';
import {
  saveReadingPosition,
  getReadingPosition,
  getLastActiveReadingPosition,
} from '../services/readingPosition/readingPositionService';

interface BibleContextType {
  currentTranslation: string;
  currentBook: string;
  currentChapterNum: number;
  targetVerse: number | null;
  chapterData: BibleChapter | null;
  isLoading: boolean;
  error: string | null;

  // Parallel View
  isParallelMode: boolean;
  secondaryTranslation: string;
  secondaryChapterData: BibleChapter | null;
  secondaryLoading: boolean;
  toggleParallelMode: () => void;
  setSecondaryTranslation: (tr: string) => Promise<void>;

  availableTranslations: BibleTranslationInfo[];
  setTranslation: (tr: string, resumeSavedPosition?: boolean) => Promise<void>;
  navigateTo: (book: string, chapter: number, translation?: string, verse?: number) => Promise<void>;
  nextChapter: () => Promise<void>;
  prevChapter: () => Promise<void>;
  clearTargetVerse: () => void;
  bookmarkVerse: (verse: number) => Promise<void>;
  highlightVerse: (verse: number, color?: string) => Promise<void>;
  addNoteToVerse: (verse: number, text: string) => Promise<void>;
}

const BibleContext = createContext<BibleContextType>({} as BibleContextType);

export const BibleProviderContext: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [currentTranslation, setCurrentTranslation] = useState<string>('KJV');
  const [currentBook, setCurrentBook] = useState<string>('JHN');
  const [currentChapterNum, setCurrentChapterNum] = useState<number>(1);
  const [targetVerse, setTargetVerse] = useState<number | null>(null);
  const [chapterData, setChapterData] = useState<BibleChapter | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Parallel View State
  const [isParallelMode, setIsParallelMode] = useState<boolean>(false);
  const [secondaryTranslation, setSecondaryTranslationState] = useState<string>('WEB');
  const [secondaryChapterData, setSecondaryChapterData] = useState<BibleChapter | null>(null);
  const [secondaryLoading, setSecondaryLoading] = useState<boolean>(false);

  const availableTranslations = bibleProvider.getAvailableTranslations();

  // 1. Resume saved reading position on app startup
  useEffect(() => {
    let isMounted = true;
    getLastActiveReadingPosition().then(pos => {
      if (isMounted) {
        setCurrentTranslation(pos.translation);
        setCurrentBook(pos.bookCode);
        setCurrentChapterNum(pos.chapter);
        setTargetVerse(pos.verse > 1 ? pos.verse : null);
        loadChapter(pos.translation, pos.bookCode, pos.chapter, false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const loadChapter = async (
    tr: string,
    bk: string,
    ch: number,
    updateSecondary = isParallelMode
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await bibleProvider.getChapter(tr, bk, ch);
      setChapterData(data);
      setCurrentTranslation(data.translation);
      setCurrentBook(data.bookCode);
      setCurrentChapterNum(data.chapter);

      // Persist reading position & history
      await saveReadingPosition(data.translation, data.bookCode, data.chapter);
      await recordLocalReadingHistory({
        user_id: user?.id || null,
        book: data.bookCode,
        chapter: data.chapter,
        translation: data.translation,
      }).catch(e => console.warn('Could not record reading history:', e));

      if (updateSecondary) {
        loadSecondaryChapter(secondaryTranslation, data.bookCode, data.chapter);
      }
    } catch (err: any) {
      console.error('Failed to load chapter:', err);
      setError(err?.message || 'Error loading chapter.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSecondaryChapter = async (tr: string, bk: string, ch: number) => {
    setSecondaryLoading(true);
    try {
      const data = await bibleProvider.getChapter(tr, bk, ch);
      setSecondaryChapterData(data);
      setSecondaryTranslationState(data.translation);
    } catch (err) {
      console.error('Failed to load secondary chapter:', err);
    } finally {
      setSecondaryLoading(false);
    }
  };

  const setTranslation = async (tr: string, resumeSavedPosition = false) => {
    if (resumeSavedPosition) {
      const saved = await getReadingPosition(tr);
      if (saved) {
        await loadChapter(tr, saved.bookCode, saved.chapter);
        setTargetVerse(saved.verse > 1 ? saved.verse : null);
        return;
      }
    }
    await loadChapter(tr, currentBook, currentChapterNum);
  };

  const setSecondaryTranslation = async (tr: string) => {
    setSecondaryTranslationState(tr);
    await loadSecondaryChapter(tr, currentBook, currentChapterNum);
  };

  const toggleParallelMode = () => {
    const next = !isParallelMode;
    setIsParallelMode(next);
    if (next && chapterData) {
      loadSecondaryChapter(secondaryTranslation, chapterData.bookCode, chapterData.chapter);
    }
  };

  const navigateTo = async (
    bk: string,
    ch: number,
    tr?: string,
    verse?: number
  ) => {
    const targetTr = tr || currentTranslation;
    setTargetVerse(verse || null);
    await loadChapter(targetTr, bk, ch, isParallelMode);
    if (verse) {
      await saveReadingPosition(targetTr, bk, ch, verse);
    }
  };

  const nextChapter = async () => {
    const bookInfo = resolveBook(currentBook);
    if (!bookInfo) return;
    if (currentChapterNum < bookInfo.chapters) {
      setTargetVerse(null);
      await loadChapter(currentTranslation, currentBook, currentChapterNum + 1);
    }
  };

  const prevChapter = async () => {
    if (currentChapterNum > 1) {
      setTargetVerse(null);
      await loadChapter(currentTranslation, currentBook, currentChapterNum - 1);
    }
  };

  const clearTargetVerse = () => setTargetVerse(null);

  const bookmarkVerse = async (verse: number) => {
    const bookInfo = resolveBook(currentBook);
    await addLocalBookmark({
      user_id: user?.id || null,
      book: bookInfo?.name || currentBook,
      chapter: currentChapterNum,
      verse,
      translation: currentTranslation,
    });
  };

  const highlightVerse = async (verse: number, color = '#FEF08A') => {
    const bookInfo = resolveBook(currentBook);
    await addLocalHighlight({
      user_id: user?.id || null,
      book: bookInfo?.name || currentBook,
      chapter: currentChapterNum,
      verse,
      translation: currentTranslation,
      color,
    });
  };

  const addNoteToVerse = async (verse: number, text: string) => {
    const bookInfo = resolveBook(currentBook);
    await addLocalNote({
      user_id: user?.id || null,
      book: bookInfo?.name || currentBook,
      chapter: currentChapterNum,
      verse,
      translation: currentTranslation,
      text,
    });
  };

  return (
    <BibleContext.Provider
      value={{
        currentTranslation,
        currentBook,
        currentChapterNum,
        targetVerse,
        chapterData,
        isLoading,
        error,
        isParallelMode,
        secondaryTranslation,
        secondaryChapterData,
        secondaryLoading,
        toggleParallelMode,
        setSecondaryTranslation,
        availableTranslations,
        setTranslation,
        navigateTo,
        nextChapter,
        prevChapter,
        clearTargetVerse,
        bookmarkVerse,
        highlightVerse,
        addNoteToVerse,
      }}
    >
      {children}
    </BibleContext.Provider>
  );
};

export const useBible = () => useContext(BibleContext);
