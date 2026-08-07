import { NavigationContainer } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/authStore';
import { useServerStore } from '../store/serverStore';
import { useDeletionHandoffStore } from '../store/deletionHandoffStore';
import WelcomeScreen from '../screens/WelcomeScreen';
import OfficialPolicyScreen from '../screens/OfficialPolicyScreen';
import CustomServerScreen from '../screens/CustomServerScreen';
import AuthScreen from '../screens/AuthScreen';
import TabNavigator from './TabNavigator';
import GameDetailScreen from '../screens/GameDetailScreen';
import EditSessionScreen from '../screens/EditSessionScreen';
import TrashScreen from '../screens/TrashScreen';
import VoiceScreen from '../screens/VoiceScreen';
import DeleteAccountScreen from '../screens/DeleteAccountScreen';
import DeletionScheduledScreen from '../screens/DeletionScheduledScreen';
import PendingDeletionScreen from '../screens/PendingDeletionScreen';
import GlobalAlertHost from '../components/GlobalAlertHost';
import ServerJoinHost from '../components/ServerJoinHost';
import ReportSheet from '../components/ReportSheet';
import ReportFab from '../components/ReportFab';
import { useLanguageSync } from '../hooks/useLanguageSync';
import { navigationRef } from './navigationRef';
import { DEV_REPORT_FAB } from '../config';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

function LanguageSyncHost() {
    useLanguageSync();
    return null;
}

export default function RootNavigator() {
    const serverUrl = useServerStore((state) => state.serverUrl);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const pendingDeletion = useAuthStore((state) => state.pendingDeletion);
    const handoff = useDeletionHandoffStore((state) => state.status);

    return (
    <SafeAreaProvider>
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator>
        {!serverUrl ? (
          <>
            <Stack.Screen name="Welcome" options={{ headerShown: false }}>
              {({ navigation }) => (
                <WelcomeScreen
                  onOfficial={() => navigation.navigate('OfficialPolicy')}
                  onCustom={() => navigation.navigate('CustomServer')}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="OfficialPolicy" options={{ headerShown: false }}>
              {({ navigation }) => <OfficialPolicyScreen onBack={navigation.goBack} />}
            </Stack.Screen>
            <Stack.Screen name="CustomServer" options={{ headerShown: false }}>
              {({ navigation }) => <CustomServerScreen onBack={navigation.goBack} />}
            </Stack.Screen>
          </>
        ) : !isAuthenticated && handoff ? (
          <Stack.Screen
            name="DeletionScheduled"
            component={DeletionScheduledScreen}
            options={{ headerShown: false }}
          />
        ) : !isAuthenticated ? (
          <Stack.Screen
            name="Auth"
            component={AuthScreen}
            options={{ headerShown: false }}
          />
        ) : pendingDeletion ? (
          <Stack.Screen
            name="PendingDeletion"
            component={PendingDeletionScreen}
            options={{ headerShown: false }}
          />
        ) : (
          <>
            <Stack.Screen
              name="Main"
              component={TabNavigator}
              options={{ headerShown: false }}
            />
            <Stack.Screen name="GameDetail" component={GameDetailScreen} options={{ headerShown: false }} />
            <Stack.Screen name="EditSession" component={EditSessionScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Trash" component={TrashScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Voice" component={VoiceScreen} options={{ headerShown: false }} />
            <Stack.Screen name="DeleteAccount" component={DeleteAccountScreen} options={{ headerShown: false }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
    {serverUrl && isAuthenticated && !pendingDeletion && (
      <>
        {DEV_REPORT_FAB && <ReportFab />}
        <ReportSheet />
        <LanguageSyncHost />
      </>
    )}
    <GlobalAlertHost />
    <ServerJoinHost />
    </SafeAreaProvider>
  );
}
