import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import { colors } from '../theme/colors';
import { displayFont, bodyFont } from '../theme/fonts';

export default function AuthScreen() {
  const [discordName, setDiscordName] = useState('');
  const { handleLogin, loading, error } = useAuth();

  const canSubmit = discordName.trim().length > 0 && !loading;

  const onPress = async () => {
    if (!canSubmit) return;
    await handleLogin(discordName);
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
            <Text style={styles.errorText} numberOfLines={1}>
              {error}
            </Text>
          )}
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>NAZWA UŻYTKOWNIKA DISCORD</Text>
          
          {/* UPDATED: Wrapper approach for the input */}
          <View style={styles.inputWrapper}>
            <View style={styles.orangeBar} />
            <TextInput
              style={styles.input}
              value={discordName}
              onChangeText={setDiscordName}
              placeholder="Your Discord username"
              placeholderTextColor={colors.text3}
              autoCapitalize="none"
              autoCorrect={false}
              onSubmitEditing={onPress}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, !canSubmit && styles.buttonDisabled]}
            onPress={onPress}
            disabled={!canSubmit}
          >
            <Text style={[styles.buttonText, !canSubmit && styles.buttonTextDisabled]}>
              {loading ? 'ŁĄCZENIE...' : 'ZALOGUJ SIĘ'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.helper}>
          <Text style={styles.helperLine}>Uwierzytelnianie przez bota Discord</Text>
          <Text style={[styles.helperLine, styles.helperAccent]}>
            Brak hasła — tylko token sesji
          </Text>
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
  errorSlot: { height: 20, justifyContent: 'center', marginBottom: 12, alignSelf: 'stretch' },
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
  
  // UPDATED: Separated wrapper, bar, and input styles
  inputWrapper: {
    flexDirection: 'row',
    backgroundColor: colors.bg3,
    borderWidth: 1, 
    borderColor: colors.borderBright, 
    borderRadius: 2,
    overflow: 'hidden', // Prevents the orange bar from bleeding past the border radius
  },
  orangeBar: {
    width: 2,
    backgroundColor: colors.orange,
  },
  input: {
    flex: 1, // Ensures the input takes up the remaining space next to the bar
    paddingHorizontal: 16, 
    paddingVertical: 14,
    fontFamily: bodyFont.regular, 
    fontSize: 16, 
    color: colors.text,
    borderWidth: 0, // Strips any borders from the actual TextInput to prevent bugs
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