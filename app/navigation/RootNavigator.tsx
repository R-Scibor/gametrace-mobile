import { NavigationContainer } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { useAuthStore } from '../store/authStore';
import { useServerStore } from '../store/serverStore';
import ServerSetupScreen from '../screens/ServerSetupScreen';
import AuthScreen from '../screens/AuthScreen';
import TabNavigator from './TabNavigator';
import GameDetailScreen from '../screens/GameDetailScreen';
import EditSessionScreen from '../screens/EditSessionScreen';
import TrashScreen from '../screens/TrashScreen';
import VoiceScreen from '../screens/VoiceScreen';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
    const serverUrl = useServerStore((state) => state.serverUrl);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

    return (
    <NavigationContainer>
      <Stack.Navigator>
        {!serverUrl ? (
          <Stack.Screen
            name="ServerSetup"
            component={ServerSetupScreen}
            options={{ headerShown: false }}
          />
        ) : !isAuthenticated ? (
          <Stack.Screen
            name="Auth"
            component={AuthScreen}
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
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
