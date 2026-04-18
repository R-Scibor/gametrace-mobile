import { NavigationContainer } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { useAuthStore } from '../store/authStore';
import AuthScreen from '../screens/AuthScreen';
import TabNavigator from './TabNavigator';
import GameDetailScreen from '../screens/GameDetailScreen';
import EditSessionScreen from '../screens/EditSessionScreen';
import CameraScreen from '../screens/CameraScreen';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

    return (
    <NavigationContainer>
      <Stack.Navigator>
        {!isAuthenticated ? (
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
            <Stack.Screen name="GameDetail" component={GameDetailScreen} />
            <Stack.Screen name="EditSession" component={EditSessionScreen} />
            <Stack.Screen name="Camera" component={CameraScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}