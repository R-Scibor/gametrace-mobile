import { View, Text } from 'react-native';
import { useFonts, SpaceGrotesk_600SemiBold, SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';
import { DMSans_400Regular, DMSans_500Medium } from '@expo-google-fonts/dm-sans';
import RootNavigator from './app/navigation/RootNavigator';
import { colors } from './app/theme/colors';

export default function App() {
  const [loaded] = useFonts({
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
    DMSans_400Regular,
    DMSans_500Medium,
  });

  if (!loaded) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 38, fontWeight: '700', color: colors.text, letterSpacing: -1 }}>
          Game<Text style={{ color: colors.orange }}>Trace</Text>
        </Text>
      </View>
    );
  }

  return <RootNavigator />;
}
