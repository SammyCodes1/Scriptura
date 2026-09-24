import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENV } from '../../config/env';

const supabaseUrl = ENV.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = ENV.SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const isSupabaseConfigured = Boolean(
  ENV.SUPABASE_URL &&
  ENV.SUPABASE_ANON_KEY &&
  !ENV.SUPABASE_URL.includes('placeholder')
);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
