import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  BackHandler,
  Keyboard,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { requestDeletion } from '../api/profile';
import { useAuthStore } from '../store/authStore';
import { useDeletionHandoffStore } from '../store/deletionHandoffStore';
import {
  ACCOUNT_DELETION_GRACE_DAYS,
  isDeletionStatus,
} from '../utils/accountDeletion';
import { resumeAuthTeardown, suspendAuthTeardown } from '../utils/authTeardown';
import { colors } from '../theme/colors';
import { bodyFont, displayFont } from '../theme/fonts';
import { common } from '../theme/styles';

const INVENTORY_KEYS = ['sessions', 'library', 'tokens', 'reports', 'voice'] as const;
const CONSEQUENCE_KEYS = ['disabled', 'purge', 'cancel'] as const;

/** Extra lift so the last button is not clipped under the IME / nav scrim. */
const KEYBOARD_EXTRA = 12;

const matches = (typed: string, username: string) =>
  username.trim().length > 0 && typed.trim().toLowerCase() === username.trim().toLowerCase();

/**
 * Confirm UI is docked under a ScrollView and lifted with keyboard height.
 * Scroll/measure hacks fail when the window does not resize under the IME
 * (common with edge-to-edge RN/Expo). The list stays scrollable with the
 * keyboard open; do not use keyboardDismissMode="on-drag".
 */
export default function DeleteAccountScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('account');
  const username = useAuthStore((s) => s.user?.username ?? '');
  const [typed, setTyped] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const handedOff = useRef(false);

  useEffect(
    () => () => {
      if (!handedOff.current) resumeAuthTeardown();
    },
    [],
  );

  useEffect(() => {
    const unsub = navigation.addListener('beforeRemove', (e) => {
      if (!loading) return;
      e.preventDefault();
    });
    return unsub;
  }, [navigation, loading]);

  useEffect(() => {
    if (!loading) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, [loading]);

  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvt, (e) => {
      // Prefer screenY vs window height: more reliable with edge-to-edge than
      // endCoordinates.height alone (which can under-report and clip buttons).
      const winH = Dimensions.get('window').height;
      const fromScreenY = winH - e.endCoordinates.screenY;
      const reported = e.endCoordinates.height;
      setKeyboardHeight(Math.max(fromScreenY, reported, 0));
    });
    const hideSub = Keyboard.addListener(hideEvt, () => {
      setKeyboardHeight(0);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const canSubmit = matches(typed, username) && !loading;
  const keyboardOpen = keyboardHeight > 0;

  const onSubmit = async () => {
    if (loading || !matches(typed, username)) return;
    setError(null);
    setLoading(true);
    suspendAuthTeardown();
    try {
      const status = await requestDeletion();
      if (!isDeletionStatus(status)) {
        resumeAuthTeardown();
        setError(t('dialog.error'));
        return;
      }
      handedOff.current = true;
      useDeletionHandoffStore.getState().save(status);
      useAuthStore.getState().logout();
      resumeAuthTeardown();
    } catch (err) {
      resumeAuthTeardown();
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        useAuthStore.getState().logout();
      }
      setError(t('dialog.error'));
    } finally {
      setLoading(false);
    }
  };

  const onCancel = () => {
    if (loading) return;
    navigation.goBack();
  };

  const confirmLabel = t('dialog.confirmLabel', { username });

  // Keyboard open: pad by IME height (+ small extra so Usuń konto isn't clipped).
  // Keyboard closed: home indicator / 3-button nav inset (never collapse to 0).
  const footerPadBottom = keyboardOpen
    ? keyboardHeight + KEYBOARD_EXTRA
    : Math.max(insets.bottom, 16);

  return (
    <SafeAreaView style={common.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        // "always": taps on the list don't auto-dismiss the keyboard so the
        // user can scroll inventory/consequences while typing. Drag-dismiss
        // is intentionally off (on-drag made the keyboard vanish on scroll).
        keyboardShouldPersistTaps="always"
      >
        <Text style={styles.title}>{t('dialog.title')}</Text>
        <Text style={styles.lead}>{t('dialog.lead')}</Text>

        <View style={styles.box}>
          <Text style={[styles.sectionLabel, styles.boxLabel]}>{t('dialog.inventoryLabel')}</Text>
          {INVENTORY_KEYS.map((key) => (
            <View key={key} style={styles.bulletRow}>
              <Text style={styles.bullet}>—</Text>
              <Text style={styles.bulletText}>{t(`inventory.${key}`)}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionLabel}>{t('dialog.consequencesLabel')}</Text>
        {CONSEQUENCE_KEYS.map((key) => (
          <View key={key} style={styles.bulletRow}>
            <Text style={styles.bullet}>—</Text>
            <Text style={styles.bulletText}>
              {t(`dialog.consequences.${key}`, { days: ACCOUNT_DELETION_GRACE_DAYS })}
            </Text>
          </View>
        ))}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: footerPadBottom }]}>
        <Text style={styles.confirmLabel}>{confirmLabel}</Text>
        <View style={common.inputWrapper}>
          <View style={common.orangeBar} />
          <TextInput
            style={common.input}
            value={typed}
            onChangeText={setTyped}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
            accessibilityLabel={confirmLabel}
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {/* Side-by-side when IME is open so the footer is shorter and more of
            the policy text stays visible above. */}
        <View style={keyboardOpen ? styles.actionsRow : styles.actionsCol}>
          <TouchableOpacity
            style={[
              common.secondaryButton,
              keyboardOpen && styles.actionHalf,
              keyboardOpen && styles.actionHalfSecondary,
            ]}
            onPress={onCancel}
            disabled={loading}
            activeOpacity={0.7}
          >
            <Text
              style={[
                common.secondaryButtonText,
                loading && common.buttonTextDisabled,
              ]}
            >
              {t('dialog.cancel')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.dangerButton,
              keyboardOpen && styles.actionHalf,
              keyboardOpen && styles.dangerButtonRow,
              !canSubmit && styles.dangerButtonDisabled,
            ]}
            onPress={onSubmit}
            disabled={!canSubmit}
            activeOpacity={0.7}
            accessibilityState={{ disabled: !canSubmit }}
          >
            <Text
              style={[
                styles.dangerButtonText,
                !canSubmit && styles.dangerButtonTextDisabled,
              ]}
            >
              {t('dialog.submit')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 20, paddingTop: 12 },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  title: {
    fontFamily: displayFont.bold,
    fontSize: 22,
    letterSpacing: -0.5,
    color: colors.text,
  },
  lead: {
    fontFamily: bodyFont.regular,
    fontSize: 14,
    color: colors.text2,
    marginTop: 8,
    lineHeight: 20,
  },
  box: {
    marginTop: 20,
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 2,
    padding: 14,
  },
  sectionLabel: {
    fontFamily: displayFont.bold,
    fontSize: 11,
    letterSpacing: 2,
    color: colors.text3,
    marginTop: 18,
    marginBottom: 8,
  },
  boxLabel: { marginTop: 0 },
  bulletRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  bullet: {
    fontFamily: bodyFont.regular,
    fontSize: 13,
    color: colors.text3,
  },
  bulletText: {
    flex: 1,
    fontFamily: bodyFont.regular,
    fontSize: 13,
    color: colors.text2,
    lineHeight: 18,
  },
  confirmLabel: {
    fontFamily: displayFont.bold,
    fontSize: 11,
    letterSpacing: 1,
    color: colors.text3,
    marginBottom: 8,
  },
  error: {
    fontFamily: bodyFont.regular,
    fontSize: 13,
    color: colors.warn,
    marginTop: 12,
    lineHeight: 18,
  },
  actionsCol: { marginTop: 16, gap: 4 },
  actionsRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 8,
  },
  actionHalf: {
    flex: 1,
    marginTop: 0,
  },
  actionHalfSecondary: {
    marginTop: 0,
  },
  dangerButton: {
    backgroundColor: colors.dangerTint,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    borderRadius: 2,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  dangerButtonRow: {
    marginTop: 0,
    justifyContent: 'center',
  },
  dangerButtonDisabled: {
    backgroundColor: colors.bg4,
    borderColor: colors.border,
  },
  dangerButtonText: {
    fontFamily: displayFont.bold,
    fontSize: 13,
    letterSpacing: 2,
    color: colors.danger,
  },
  dangerButtonTextDisabled: {
    color: colors.text3,
  },
});
