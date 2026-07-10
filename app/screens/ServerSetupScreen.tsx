import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { resolveServer } from '../api/resolveServer';
import { useServerStore } from '../store/serverStore';
import ConfirmSheet from '../components/ConfirmSheet';
import { colors } from '../theme/colors';
import { displayFont, bodyFont } from '../theme/fonts';

export default function ServerSetupScreen() {
  const [host, setHost] = useState('gametrace.rscibor.dev');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [insecureUrl, setInsecureUrl] = useState<string | null>(null);
  const setServerUrl = useServerStore((s) => s.setServerUrl);

  const canSubmit = host.trim().length > 0 && !loading;

  const onConnect = async () => {
    if (!canSubmit) return;
    setError(null);
    setLoading(true);
    try {
      const result = await resolveServer(host);
      if (result.status === 'ok') {
        setServerUrl(result.baseUrl);
      } else if (result.status === 'insecure') {
        setInsecureUrl(result.baseUrl);
      } else if (result.status === 'invalid') {
        setError('Podaj adres serwera (host:port)');
      } else {
        setError('Nie można połączyć się z serwerem');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.center}>
        <View style={styles.wordmark}>
          <Text style={styles.title}>
            Game<Text style={styles.titleAccent}>Trace</Text>
          </Text>
          <Text style={styles.tagline}>— POŁĄCZ Z SERWEREM —</Text>
          <View style={styles.rule} />
        </View>

        <View style={styles.errorSlot}>
          {error && (
            <Text style={styles.errorText} numberOfLines={1}>{error}</Text>
          )}
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>ADRES SERWERA</Text>
          <View style={styles.inputWrapper}>
            <View style={styles.orangeBar} />
            <TextInput
              style={styles.input}
              value={host}
              onChangeText={setHost}
              placeholder="host:port"
              placeholderTextColor={colors.text3}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              onSubmitEditing={onConnect}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, !canSubmit && styles.buttonDisabled]}
            onPress={onConnect}
            disabled={!canSubmit}
          >
            <Text style={[styles.buttonText, !canSubmit && styles.buttonTextDisabled]}>
              {loading ? 'ŁĄCZENIE...' : 'POŁĄCZ'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.helper}>
          <Text style={styles.helperLine}>Wpisz adres swojego serwera GameTrace</Text>
          <Text style={[styles.helperLine, styles.helperAccent]}>
            np. home.example.com:8010
          </Text>
        </View>
      </View>

      <ConfirmSheet
        visible={insecureUrl != null}
        title="Połączenie nieszyfrowane"
        message="Ten serwer jest dostępny tylko przez nieszyfrowane HTTP. Połączyć mimo to?"
        confirmLabel="Połącz mimo to"
        destructive
        onConfirm={() => { if (insecureUrl) setServerUrl(insecureUrl); setInsecureUrl(null); }}
        onCancel={() => setInsecureUrl(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 28 },
  wordmark: { alignItems: 'center', marginBottom: 20 },
  errorSlot: { height: 20, justifyContent: 'center', marginBottom: 12, alignSelf: 'stretch' },
  title: { fontFamily: displayFont.bold, fontSize: 38, letterSpacing: -1, color: colors.text, lineHeight: 38 },
  titleAccent: { color: colors.orange },
  tagline: { fontFamily: bodyFont.regular, fontSize: 12, letterSpacing: 1, color: colors.text3, marginTop: 8 },
  rule: { width: 40, height: 1, backgroundColor: colors.orange, marginTop: 16 },
  form: { width: '100%', gap: 12 },
  label: { fontFamily: displayFont.regular, fontSize: 11, letterSpacing: 1, color: colors.text3 },
  inputWrapper: {
    flexDirection: 'row', backgroundColor: colors.bg3, borderWidth: 1,
    borderColor: colors.borderBright, borderRadius: 2, overflow: 'hidden',
  },
  orangeBar: { width: 2, backgroundColor: colors.orange },
  input: {
    flex: 1, paddingHorizontal: 16, paddingVertical: 14,
    fontFamily: bodyFont.regular, fontSize: 16, color: colors.text, borderWidth: 0,
  },
  button: { backgroundColor: colors.orange, borderRadius: 2, paddingVertical: 15, alignItems: 'center', marginTop: 4 },
  buttonDisabled: { backgroundColor: colors.bg4 },
  buttonText: { fontFamily: displayFont.bold, fontSize: 14, letterSpacing: 2, color: colors.buttonTextOnOrange },
  buttonTextDisabled: { color: colors.text3 },
  errorText: { fontFamily: bodyFont.regular, fontSize: 12, lineHeight: 18, color: colors.orange, textAlign: 'center' },
  helper: { marginTop: 32, alignItems: 'center' },
  helperLine: { fontFamily: bodyFont.regular, fontSize: 11, color: colors.text3, lineHeight: 18, textAlign: 'center' },
  helperAccent: { color: colors.orangeDim },
});
