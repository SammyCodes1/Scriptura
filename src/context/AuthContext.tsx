import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured } from '../services/supabase/client';
import { syncGuestDataToSupabase } from '../services/supabase/syncService';
import { wipeAllUserData } from '../database/sqlite';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isGuest: boolean;
  isLoading: boolean;
  syncPromptVisible: boolean;
  setSyncPromptVisible: (visible: boolean) => void;
  signInWithEmail: (email: string, pass: string) => Promise<{ error: Error | null }>;
  signUpWithEmail: (email: string, pass: string) => Promise<{ error: Error | null }>;
  signInWithOAuth: (provider: 'google' | 'apple') => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  deleteAccountAndAllData: () => Promise<void>;
  continueAsGuest: () => void;
  triggerSync: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isGuest, setIsGuest] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [syncPromptVisible, setSyncPromptVisible] = useState<boolean>(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsGuest(true);
      setIsLoading(false);
      return;
    }

    // Check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsGuest(!session);
      setIsLoading(false);

      if (session?.user) {
        syncGuestDataToSupabase(session.user.id);
      }
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setIsGuest(!newSession);
        setIsLoading(false);

        if (newSession?.user) {
          await syncGuestDataToSupabase(newSession.user.id);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signInWithEmail = async (email: string, pass: string) => {
    if (!isSupabaseConfigured) {
      return { error: new Error('Supabase is not configured yet. Set EXPO_PUBLIC_SUPABASE_URL.') };
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    return { error };
  };

  const signUpWithEmail = async (email: string, pass: string) => {
    if (!isSupabaseConfigured) {
      return { error: new Error('Supabase is not configured yet. Set EXPO_PUBLIC_SUPABASE_URL.') };
    }
    const { error } = await supabase.auth.signUp({ email, password: pass });
    return { error };
  };

  const signInWithOAuth = async (provider: 'google' | 'apple') => {
    if (!isSupabaseConfigured) {
      return { error: new Error('Supabase is not configured yet. Set EXPO_PUBLIC_SUPABASE_URL.') };
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: 'scriptura://auth-callback',
      },
    });
    return { error };
  };

  const signOut = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
    setIsGuest(true);
  };

  const deleteAccountAndAllData = async () => {
    try {
      // 1. Wipe local SQLite database of all user records
      await wipeAllUserData();
      // 2. Wipe AsyncStorage preferences & caches
      await AsyncStorage.clear();
      // 3. If authenticated with Supabase, sign out
      if (isSupabaseConfigured && user) {
        await supabase.auth.signOut();
      }
    } finally {
      setUser(null);
      setSession(null);
      setIsGuest(true);
    }
  };

  const continueAsGuest = () => {
    setIsGuest(true);
  };

  const triggerSync = async () => {
    if (user) {
      await syncGuestDataToSupabase(user.id);
    } else {
      setSyncPromptVisible(true);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isGuest,
        isLoading,
        syncPromptVisible,
        setSyncPromptVisible,
        signInWithEmail,
        signUpWithEmail,
        signInWithOAuth,
        signOut,
        deleteAccountAndAllData,
        continueAsGuest,
        triggerSync,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
