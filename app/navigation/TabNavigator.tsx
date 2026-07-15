import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DashboardScreen from '../screens/DashboardScreen';
import LibraryScreen from '../screens/LibraryScreen';
import AddSessionScreen from '../screens/AddSessionScreen';
import StatsScreen from '../screens/StatsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { colors } from '../theme/colors';
import { bodyFont } from '../theme/fonts';
import {
  DashboardIcon, LibraryIcon, AddIcon, StatsIcon, SettingsIcon,
} from '../components/icons/TabIcons';
import { TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();

export default function TabNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      backBehavior="history"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.orange,
        tabBarInactiveTintColor: colors.text3,
        tabBarStyle: {
          backgroundColor: colors.bg2,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 72 + insets.bottom,
          paddingTop: 8,
          paddingBottom: 8 + insets.bottom,
        },
        tabBarLabelStyle: {
          fontFamily: bodyFont.regular,
          fontSize: 10,
          letterSpacing: 0.3,
          marginTop: 2,
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color }) => <DashboardIcon color={color} />,
        }}
      />
      <Tab.Screen
        name="Library"
        component={LibraryScreen}
        options={{
          tabBarLabel: 'Biblioteka',
          tabBarIcon: ({ color }) => <LibraryIcon color={color} />,
        }}
      />
      <Tab.Screen
        name="AddSession"
        component={AddSessionScreen}
        options={{
          tabBarLabel: 'Dodaj',
          tabBarIcon: ({ color }) => <AddIcon color={color} />,
        }}
      />
      <Tab.Screen
        name="Stats"
        component={StatsScreen}
        options={{
          tabBarLabel: 'Statystyki',
          tabBarIcon: ({ color }) => <StatsIcon color={color} />,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Ustawienia',
          tabBarIcon: ({ color }) => <SettingsIcon color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}
