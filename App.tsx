import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { BibleProviderContext } from './src/context/BibleContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { OnboardingScreen, hasCompletedOnboarding } from './src/screens/OnboardingScreen';

function AppContent() {
  const { colors } = useTheme();
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    hasCompletedOnboarding().then(done => setShowOnboarding(!done));
  }, []);

  // Wait for onboarding check
  if (showOnboarding === null) return null;

  if (showOnboarding) {
    return (
      <>
        <OnboardingScreen onComplete={() => setShowOnboarding(false)} />
        <StatusBar style={colors.statusBarStyle} />
      </>
    );
  }

  return (
    <>
      <RootNavigator />
      <StatusBar style={colors.statusBarStyle} />
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <BibleProviderContext>
            <AppContent />
          </BibleProviderContext>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
