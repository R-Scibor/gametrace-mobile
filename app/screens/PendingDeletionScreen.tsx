import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { cancelDeletion, logout as logoutApi } from '../api/profile';
import { useAuthStore } from '../store/authStore';
import { daysLeftUntil, formatPurgeDateOnly } from '../utils/accountDeletion';
import { colors } from '../theme/colors';
import { bodyFont, displayFont } from '../theme/fonts';
import { common } from '../theme/styles';

const CAVEAT_KEYS = ['restore', 'lost', 'permanent'] as const;

/**
 * Blocking cancel gate while authStore.pendingDeletion is set.
 * Exclusive RootNavigator branch is Task 6/10 — clearing pending lets Main show.
 */
export default function PendingDeletionScreen() {
  const { t } = useTranslation('account');
  const pending = useAuthStore((s) => s.pendingDeletion);
  const setPending = useAuthStore((s) => s.setPendingDeletion);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [msgTone, setMsgTone] = useState<'ok' | 'err'>('ok');

  if (!pending && !msg) return null;

  const days = pending
    ? daysLeftUntil(pending.purge_at, pending.days_left)
    : 0;
  const date = pending ? formatPurgeDateOnly(pending.purge_at) : '';

  const onCancel = async () => {
    if (busy || !pending) return;
    setBusy(true);
    setMsg(null);
    try {
      const result = await cancelDeletion();
      setPending(null);
      setMsgTone('ok');
      setMsg(
        result === 'cancelled'
          ? t('pending.cancelled')
          : t('pending.notScheduled'),
      );
    } catch {
      setMsgTone('err');
      setMsg(t('pending.cancelFailed'));
    } finally {
      setBusy(false);
    }
  };

  const onLogout = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await logoutApi();
    } catch {
      /* best-effort */
    }
    useAuthStore.getState().logout();
    setBusy(false);
  };

  return (
    <SafeAreaView style={common.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={common.eyebrow}>{t('pending.eyebrow')}</Text>
        <Text style={styles.title}>{t('pending.title')}</Text>
        <Text style={styles.lead}>{t('pending.lead')}</Text>

        {pending ? (
          <View style={styles.panel}>
            <View style={styles.panelItem}>
              <Text style={styles.panelLabel}>{t('status.purgeLabel')}</Text>
              <Text style={styles.panelValue}>
                {t('status.purgeValue', { date })}
              </Text>
            </View>
            <View style={styles.panelItem}>
              <Text style={styles.panelLabel}>{t('status.daysLeftLabel')}</Text>
              <Text style={styles.panelValue}>
                {t('status.daysLeft', { count: days })}
              </Text>
            </View>
            <Text style={styles.panelNote}>{t('status.purgeNote')}</Text>
          </View>
        ) : null}

        {pending ? (
          <>
            <Text style={styles.sectionTitle}>{t('pending.caveatsLabel')}</Text>
            {CAVEAT_KEYS.map((key) => (
              <View key={key} style={styles.bulletRow}>
                <Text style={styles.bullet}>—</Text>
                <Text style={styles.bulletText}>
                  {t(`pending.caveats.${key}`)}
                </Text>
              </View>
            ))}
          </>
        ) : null}

        {msg ? (
          <Text
            style={[styles.feedback, msgTone === 'err' && styles.feedbackErr]}
          >
            {msg}
          </Text>
        ) : null}

        {pending ? (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[common.button, busy && common.buttonDisabled]}
              onPress={onCancel}
              disabled={busy}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  common.buttonText,
                  busy && common.buttonTextDisabled,
                ]}
              >
                {t('pending.cancelCta')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={common.secondaryButton}
              onPress={onLogout}
              disabled={busy}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  common.secondaryButtonText,
                  busy && common.buttonTextDisabled,
                ]}
              >
                {t('pending.logoutCta')}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 12 },
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
  panel: {
    marginTop: 20,
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 2,
    padding: 14,
    gap: 14,
  },
  panelItem: { gap: 4 },
  panelLabel: {
    fontFamily: displayFont.bold,
    fontSize: 11,
    letterSpacing: 2,
    color: colors.text3,
  },
  panelValue: {
    fontFamily: bodyFont.regular,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  panelNote: {
    fontFamily: bodyFont.regular,
    fontSize: 12,
    color: colors.text3,
    lineHeight: 17,
  },
  sectionTitle: {
    fontFamily: displayFont.bold,
    fontSize: 15,
    letterSpacing: -0.2,
    color: colors.text,
    marginTop: 24,
    marginBottom: 8,
  },
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
  feedback: {
    fontFamily: bodyFont.regular,
    fontSize: 13,
    color: colors.text,
    marginTop: 16,
    lineHeight: 18,
  },
  feedbackErr: {
    color: colors.warn,
  },
  actions: { marginTop: 28 },
});
