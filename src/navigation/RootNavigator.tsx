import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../context/ThemeContext';

import { HomeScreen } from '../screens/HomeScreen';
import { ReadScreen } from '../screens/ReadScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { LibraryScreen } from '../screens/LibraryScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

// Sub-screens folded out of top-level tabs
import { CommunityScreen } from '../screens/CommunityScreen';
import { ConfessionsScreen } from '../screens/ConfessionsScreen';
import { DownloadsScreen } from '../screens/DownloadsScreen';
import { BibleMapScreen } from '../screens/BibleMapScreen';
import { PrivacyPolicyScreen } from '../screens/PrivacyPolicyScreen';

// ─── Stack Navigators ─────────────────────────────────────────
// Home tab hosts Community, Confessions & BibleMap as sub-screens.
const HomeStack = createNativeStackNavigator();
const HomeStackScreen: React.FC = () => {
  const { colors } = useTheme();
  return (
    <HomeStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: { fontWeight: '700' },
        headerShadowVisible: false,
      }}
    >
      <HomeStack.Screen name="HomeMain" component={HomeScreen} options={{ title: 'Scriptura' }} />
      <HomeStack.Screen name="BibleMap" component={BibleMapScreen} options={{ title: 'Biblical Places Map' }} />
      <HomeStack.Screen name="Community" component={CommunityScreen} options={{ title: 'Community & Prayer' }} />
      <HomeStack.Screen name="Confessions" component={ConfessionsScreen} options={{ title: 'Daily Confessions' }} />
    </HomeStack.Navigator>
  );
};

// Profile tab hosts Downloads as a sub-screen.
const ProfileStack = createNativeStackNavigator();
const ProfileStackScreen: React.FC = () => {
  const { colors } = useTheme();
  return (
    <ProfileStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: { fontWeight: '700' },
        headerShadowVisible: false,
      }}
    >
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} options={{ title: 'Settings' }} />
      <ProfileStack.Screen name="Downloads" component={DownloadsScreen} options={{ title: 'Offline Translations' }} />
      <ProfileStack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} options={{ title: 'Privacy Policy' }} />
    </ProfileStack.Navigator>
  );
};

// ─── Bottom Tab Navigator (5 tabs) ───────────────────────────
const Tab = createBottomTabNavigator();

type TabIconName = keyof typeof Ionicons.glyphMap;

const TAB_ICONS: Record<string, { focused: TabIconName; unfocused: TabIconName }> = {
  Home: { focused: 'home', unfocused: 'home-outline' },
  Read: { focused: 'book', unfocused: 'book-outline' },
  Search: { focused: 'search', unfocused: 'search-outline' },
  Library: { focused: 'library', unfocused: 'library-outline' },
  Profile: { focused: 'settings', unfocused: 'settings-outline' },
};

export const RootNavigator: React.FC = () => {
  const { colors, tabBar } = useTheme();

  return (
    <NavigationContainer>
      <Tab.Navigator
        initialRouteName="Home"
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ focused, color, size }) => {
            const icons = TAB_ICONS[route.name];
            const iconName = focused ? icons.focused : icons.unfocused;
            return <Ionicons name={iconName} size={tabBar.iconSize} color={color} />;
          },
          tabBarActiveTintColor: colors.tabActive,
          tabBarInactiveTintColor: colors.tabInactive,
          tabBarLabelStyle: {
            fontSize: tabBar.labelSize,
            fontWeight: '600',
          },
          tabBarStyle: {
            backgroundColor: colors.tabBarBg,
            borderTopColor: colors.tabBarBorder,
            borderTopWidth: 1,
            height: tabBar.height,
            paddingBottom: tabBar.paddingBottom,
            paddingTop: tabBar.paddingTop,
          },
        })}
      >
        <Tab.Screen
          name="Home"
          component={HomeStackScreen}
          options={{ tabBarLabel: 'Home', tabBarAccessibilityLabel: 'Home tab. Daily scriptures, reading plans, and sacred map.' }}
        />
        <Tab.Screen
          name="Read"
          component={ReadScreen}
          options={{ tabBarLabel: 'Read', tabBarAccessibilityLabel: 'Read tab. Read the Holy Scriptures with adjustable fonts and parallel translations.' }}
        />
        <Tab.Screen
          name="Search"
          component={SearchScreen}
          options={{ tabBarLabel: 'Search', tabBarAccessibilityLabel: 'Search tab. Search keywords across Old and New Testament.' }}
        />
        <Tab.Screen
          name="Library"
          component={LibraryScreen}
          options={{ tabBarLabel: 'Library', tabBarAccessibilityLabel: 'Library tab. View bookmarks, highlights, notes, and reading plans.' }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileStackScreen}
          options={{ tabBarLabel: 'Settings', tabBarAccessibilityLabel: 'Settings tab. Configure reading appearance, themes, font size, and account.' }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};
