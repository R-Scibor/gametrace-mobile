import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import { colors } from '../theme/colors';
import { displayFont, bodyFont } from '../theme/fonts';
import { formatLinkCode, normalizeLinkCode, isCompleteLinkCode } from '../utils/linkCode';
import { DEV_USERNAME_LOGIN, DISCORD_OAUTH_LOGIN, DISCORD_CLIENT_ID } from '../config';

type Mode = 'link' | 'username';

export default function AuthScreen() {
  const [mode, setMode] = useState<Mode>('link');
  const [code, setCode] = useState('');
  const [username, setUsername] = useState('');
  const { handleLinkLogin, handleLogin, handleDiscordLogin, discordReady, loading, error } = useAuth();

  const canSubmit =
    !loading && (mode === 'link' ? isCompleteLinkCode(code) : username.trim().length > 0);

  const onPress = async () => {
    if (!canSubmit) return;
    if (mode === 'link') {
      await handleLinkLogin(code);
    } else {
      await handleLogin(username.trim());
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.center}>
        <View style={styles.wordmark}>
          <Text style={styles.title}>
            Game<Text style={styles.titleAccent}>Trace</Text>
          </Text>
          <Text style={styles.tagline}>— SIGN IN —</Text>
          <View style={styles.rule} />
        </View>

        <View style={styles.errorSlot}>
          {error && (
            <Text style={styles.errorText} numberOfLines={2}>
              {error}
            </Text>
          )}
        </View>

        <View style={styles.form}>
          {mode === 'link' ? (
            <>
              <Text style={styles.label}>KOD LOGOWANIA</Text>
              <View style={styles.inputWrapper}>
                <View style={styles.orangeBar} />
                <TextInput
                  style={styles.input}
                  value={formatLinkCode(code)}
                  onChangeText={(t) => setCode(normalizeLinkCode(t))}
                  placeholder="231 996"
                  placeholderTextColor={colors.text3}
                  keyboardType="number-pad"
                  maxLength={7}
                  onSubmitEditing={onPress}
                />
              </View>
            </>
          ) : (
            <>
              <Text style={styles.label}>NAZWA UŻYTKOWNIKA DISCORD</Text>
              <View style={styles.inputWrapper}>
                <View style={styles.orangeBar} />
                <TextInput
                  style={styles.input}
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Your Discord username"
                  placeholderTextColor={colors.text3}
                  autoCapitalize="none"
                  autoCorrect={false}
                  onSubmitEditing={onPress}
                />
              </View>
            </>
          )}

          <TouchableOpacity
            style={[styles.button, !canSubmit && styles.buttonDisabled]}
            onPress={onPress}
            disabled={!canSubmit}
          >
            <Text style={[styles.buttonText, !canSubmit && styles.buttonTextDisabled]}>
              {loading ? 'ŁĄCZENIE...' : 'ZALOGUJ SIĘ'}
            </Text>
          </TouchableOpacity>

          {DISCORD_OAUTH_LOGIN && DISCORD_CLIENT_ID ? (
            <>
              <View style={styles.orDivider}>
                <View style={styles.orLine} />
                <Text style={styles.orText}>LUB</Text>
                <View style={styles.orLine} />
              </View>
              <TouchableOpacity
                style={[styles.discordButton, (!discordReady || loading) && styles.buttonDisabled]}
                onPress={handleDiscordLogin}
                disabled={!discordReady || loading}
              >
                <Text style={styles.discordButtonText}>ZALOGUJ PRZEZ DISCORD</Text>
              </TouchableOpacity>
            </>
          ) : null}
        </View>

        <View style={styles.helper}>
          {mode === 'link' ? (
            <>
              <Text style={styles.helperLine}>
                Uruchom <Text style={styles.helperAccent}>/login</Text> na Discordzie
              </Text>
              <Text style={styles.helperLine}>i wpisz 6-cyfrowy kod (ważny 5 minut)</Text>
            </>
          ) : (
            <Text style={styles.helperLine}>Logowanie nazwą — tylko do testów</Text>
          )}

          {DEV_USERNAME_LOGIN && (
            <TouchableOpacity
              style={styles.switcher}
              onPress={() => setMode(mode === 'link' ? 'username' : 'link')}
            >
              <Text style={styles.switcherText}>
                {mode === 'link' ? 'Zaloguj się nazwą (dev)' : '← Wróć do kodu'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <View style={styles.footerDot} />
          <Text style={styles.footerText}>LINK STABLE</Text>
        </View>
        <Text style={styles.footerText}>v0.4.2</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 28,
  },
  wordmark: { alignItems: 'center', marginBottom: 20 },
  errorSlot: { minHeight: 20, justifyContent: 'center', marginBottom: 12, alignSelf: 'stretch' },
  title: {
    fontFamily: displayFont.bold, fontSize: 38, letterSpacing: -1,
    color: colors.text, lineHeight: 38,
  },
  titleAccent: { color: colors.orange },
  tagline: {
    fontFamily: bodyFont.regular, fontSize: 12, letterSpacing: 1,
    color: colors.text3, marginTop: 8,
  },
  rule: {
    width: 40, height: 1, backgroundColor: colors.orange, marginTop: 16,
  },
  form: { width: '100%', gap: 12 },
  label: {
    fontFamily: displayFont.regular, fontSize: 11, letterSpacing: 1,
    color: colors.text3,
  },
  inputWrapper: {
    flexDirection: 'row',
    backgroundColor: colors.bg3,
    borderWidth: 1,
    borderColor: colors.borderBright,
    borderRadius: 2,
    overflow: 'hidden',
  },
  orangeBar: {
    width: 2,
    backgroundColor: colors.orange,
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: bodyFont.regular,
    fontSize: 16,
    color: colors.text,
    borderWidth: 0,
  },
  button: {
    backgroundColor: colors.orange, borderRadius: 2,
    paddingVertical: 15, alignItems: 'center', marginTop: 4,
  },
  buttonDisabled: { backgroundColor: colors.bg4 },
  buttonText: {
    fontFamily: displayFont.bold, fontSize: 14, letterSpacing: 2,
    color: colors.buttonTextOnOrange,
  },
  buttonTextDisabled: { color: colors.text3 },
  orDivider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  orLine: { flex: 1, height: 1, backgroundColor: colors.borderBright },
  orText: {
    fontFamily: displayFont.regular, fontSize: 10, letterSpacing: 2, color: colors.text3,
  },
  discordButton: {
    borderWidth: 1, borderColor: colors.orange, borderRadius: 2,
    paddingVertical: 14, alignItems: 'center',
  },
  discordButtonText: {
    fontFamily: displayFont.bold, fontSize: 13, letterSpacing: 2, color: colors.orange,
  },
  errorText: {
    fontFamily: bodyFont.regular, fontSize: 12, lineHeight: 18, color: colors.orange,
    textAlign: 'center',
  },
  helper: { marginTop: 32, alignItems: 'center' },
  helperLine: {
    fontFamily: bodyFont.regular, fontSize: 11, color: colors.text3,
    lineHeight: 18, textAlign: 'center',
  },
  helperAccent: { color: colors.orangeDim },
  switcher: { marginTop: 16, paddingVertical: 6 },
  switcherText: {
    fontFamily: displayFont.regular, fontSize: 11, letterSpacing: 1,
    color: colors.text3, textDecorationLine: 'underline',
  },
  footer: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingBottom: 16,
  },
  footerLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  footerDot: { width: 6, height: 6, backgroundColor: colors.orange },
  footerText: {
    fontFamily: displayFont.bold, fontSize: 9, letterSpacing: 2,
    color: colors.text3,
  },
});
