/**
 * Scriptura Environment Configuration
 * Centralized, typed, and validated environment variables.
 */

export const ENV = {
  /**
   * IS_COMMERCIAL flag:
   * When true:
   * - Exclude NIV entirely (no commercial license available).
   * - Licensed translations are flagged as requiring a paid license.
   * When false:
   * - All translations use the free non-commercial API key.
   */
  IS_COMMERCIAL: process.env.EXPO_PUBLIC_IS_COMMERCIAL === 'true',

  /**
   * API.Bible REST API key (https://docs.api.bible)
   */
  API_BIBLE_KEY: process.env.EXPO_PUBLIC_API_BIBLE_KEY || '',

  /**
   * Supabase backend URL
   */
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL || '',

  /**
   * Supabase anonymous public key
   */
  SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
};
