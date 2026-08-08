import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { useFonts, SpaceGrotesk_600SemiBold, SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';
import { DMSans_400Regular, DMSans_500Medium } from '@expo-google-fonts/dm-sans';
import * as Sentry from '@sentry/react-native';
import RootNavigator from './app/navigation/RootNavigator';
import { hydrateLanguage } from './app/i18n';
import { colors } from './app/theme/colors';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  // Dev noise stays out of the tester project; also makes a missing DSN a no-op.
  enabled: !__DEV__,
  sendDefaultPii: false,
  // Crashes and release health only — no performance tracing.
  tracesSampleRate: 0,
  beforeSend(event) {
    const headers = event.request?.headers;
    if (headers) {
      delete headers.Authorization;
      delete headers.authorization;
      delete headers.Cookie;
      delete headers.cookie;
    }
    // Request bodies can carry tokens and session notes; never ship them.
    if (event.request) delete event.request.data;
    return event;
  },
});

function App() {
  const [loaded] = useFonts({
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
    DMSans_400Regular,
    DMSans_500Medium,
  });
  const [languageReady, setLanguageReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await hydrateLanguage();
      if (!cancelled) setLanguageReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!loaded || !languageReady) {
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

export default Sentry.wrap(App);
