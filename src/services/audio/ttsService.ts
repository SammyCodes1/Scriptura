import * as Speech from 'expo-speech';
import { BibleVerse } from '../bible/types';

export type SleepTimerOption = 5 | 10 | 15 | 30 | 45 | 'end_of_chapter' | null;

export interface AudioPlaybackState {
  isPlaying: boolean;
  isPaused: boolean;
  currentVerseNum: number | null;
  totalVerses: number;
  chapterTitle: string;
  sleepTimer: SleepTimerOption;
  sleepTimerRemainingSeconds: number | null;
}

type StateListener = (state: AudioPlaybackState) => void;

class TTSService {
  private verses: BibleVerse[] = [];
  private currentIndex = 0;
  private chapterTitle = '';
  private isPlaying = false;
  private isPaused = false;
  private sleepTimer: SleepTimerOption = null;
  private sleepTimerId: any = null;
  private sleepTimerRemainingSeconds: number | null = null;
  private countdownIntervalId: any = null;
  private listeners: Set<StateListener> = new Set();

  subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const state = this.getState();
    this.listeners.forEach(l => l(state));
  }

  getState(): AudioPlaybackState {
    const currentVerse = this.verses[this.currentIndex]?.verse ?? null;
    return {
      isPlaying: this.isPlaying,
      isPaused: this.isPaused,
      currentVerseNum: currentVerse,
      totalVerses: this.verses.length,
      chapterTitle: this.chapterTitle,
      sleepTimer: this.sleepTimer,
      sleepTimerRemainingSeconds: this.sleepTimerRemainingSeconds,
    };
  }

  /**
   * Starts playing a chapter from the beginning or a specific verse index.
   */
  async playChapter(
    chapterTitle: string,
    verses: BibleVerse[],
    startIndex = 0
  ): Promise<void> {
    await this.stop();

    if (!verses || verses.length === 0) return;

    this.verses = verses;
    this.chapterTitle = chapterTitle;
    this.currentIndex = startIndex;
    this.isPlaying = true;
    this.isPaused = false;

    this.speakCurrentVerse();
  }

  private speakCurrentVerse() {
    if (!this.isPlaying || this.isPaused) return;

    if (this.currentIndex >= this.verses.length) {
      this.handlePlaybackFinished();
      return;
    }

    const verse = this.verses[this.currentIndex];
    const textToSpeak = `Verse ${verse.verse}. ${verse.cleanText || verse.text}`;

    this.notify();

    Speech.speak(textToSpeak, {
      language: 'en',
      rate: 0.95,
      pitch: 1.0,
      onDone: () => {
        if (this.isPlaying && !this.isPaused) {
          this.currentIndex++;
          this.speakCurrentVerse();
        }
      },
      onError: (err) => {
        console.warn('Speech error on verse:', err);
        if (this.isPlaying && !this.isPaused) {
          this.currentIndex++;
          this.speakCurrentVerse();
        }
      },
    });
  }

  async pause(): Promise<void> {
    if (!this.isPlaying || this.isPaused) return;
    this.isPaused = true;
    await Speech.stop();
    this.notify();
  }

  async resume(): Promise<void> {
    if (!this.isPlaying || !this.isPaused) return;
    this.isPaused = false;
    this.speakCurrentVerse();
  }

  async stop(): Promise<void> {
    this.isPlaying = false;
    this.isPaused = false;
    this.clearSleepTimer();
    await Speech.stop();
    this.notify();
  }

  /**
   * Sets sleep timer.
   */
  setSleepTimer(option: SleepTimerOption): void {
    this.clearSleepTimer();
    this.sleepTimer = option;

    if (!option) {
      this.notify();
      return;
    }

    if (option === 'end_of_chapter') {
      this.notify();
      return;
    }

    const seconds = option * 60;
    this.sleepTimerRemainingSeconds = seconds;

    this.sleepTimerId = setTimeout(async () => {
      await this.stop();
    }, seconds * 1000);

    this.countdownIntervalId = setInterval(() => {
      if (this.sleepTimerRemainingSeconds !== null && this.sleepTimerRemainingSeconds > 0) {
        this.sleepTimerRemainingSeconds--;
        this.notify();
      } else {
        clearInterval(this.countdownIntervalId);
      }
    }, 1000);

    this.notify();
  }

  private clearSleepTimer() {
    if (this.sleepTimerId) {
      clearTimeout(this.sleepTimerId);
      this.sleepTimerId = null;
    }
    if (this.countdownIntervalId) {
      clearInterval(this.countdownIntervalId);
      this.countdownIntervalId = null;
    }
    this.sleepTimer = null;
    this.sleepTimerRemainingSeconds = null;
  }

  private handlePlaybackFinished() {
    this.isPlaying = false;
    this.isPaused = false;
    this.clearSleepTimer();
    this.notify();
  }
}

export const ttsService = new TTSService();
