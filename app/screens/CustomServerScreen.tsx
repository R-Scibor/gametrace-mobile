import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { resolveServer } from '../api/resolveServer';
import { useServerStore } from '../store/serverStore';
import ConfirmSheet from '../components/ConfirmSheet';
import Wordmark from '../components/Wordmark';
import { colors } from '../theme/colors';
import { displayFont, bodyFont } from '../theme/fonts';
import { OFFICIAL_SERVER_HOST } from '../config';

export default function CustomServerScreen({ onBack }: { onBack: () => void }) {
  const { t } = useTranslation('server');
  const { t: tCommon } = useTranslation('common');
  const [host, setHost] = useState(OFFICIAL_SERVER_HOST);
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
        setError(t('errors.invalid'));
      } else {
        setError(t('errors.unreachable'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <TouchableOpacity style={styles.backRow} onPress={onBack} activeOpacity={0.7}>
        <Text style={styles.back}>{tCommon('actions.back')}</Text>
      </TouchableOpacity>
      <View style={styles.center}>
        <Wordmark tagline={t('tagline')} />

        <View style={styles.errorSlot}>
          {error && (
            <Text style={styles.errorText} numberOfLines={1}>{error}</Text>
          )}
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>{t('addressLabel')}</Text>
          <View style={styles.inputWrapper}>
            <View style={styles.orangeBar} />
            <TextInput
              style={styles.input}
              value={host}
              onChangeText={setHost}
              placeholder={t('addressPlaceholder')}
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
              {loading ? t('connecting') : t('connect')}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.helper}>
          <Text style={styles.helperLine}>{t('helper')}</Text>
          <Text style={[styles.helperLine, styles.helperAccent]}>
            {t('helperExample')}
          </Text>
        </View>
      </View>

      <ConfirmSheet
        visible={insecureUrl != null}
        title={t('insecure.title')}
        message={t('insecure.message')}
        confirmLabel={t('insecure.confirm')}
        destructive
        onConfirm={() => { if (insecureUrl) setServerUrl(insecureUrl); setInsecureUrl(null); }}
        onCancel={() => setInsecureUrl(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  backRow: { paddingHorizontal: 28, paddingVertical: 8, alignSelf: 'flex-start' },
  back: { fontFamily: displayFont.regular, fontSize: 12, letterSpacing: 1, color: colors.text3 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 28 },
  errorSlot: { height: 20, justifyContent: 'center', marginBottom: 12, alignSelf: 'stretch' },
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
