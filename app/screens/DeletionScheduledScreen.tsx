import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useDeletionHandoffStore } from '../store/deletionHandoffStore';
import { daysLeftUntil, formatPurgeDateOnly } from '../utils/accountDeletion';
import { colors } from '../theme/colors';
import { bodyFont, displayFont } from '../theme/fonts';
import { common } from '../theme/styles';

/**
 * Post-logout confirmation after scheduling deletion. Mounted only while
 * handoff status is present (RootNavigator exclusive branch — Task 6).
 * Both CTAs clear handoff so the navigator falls through to Auth.
 */
export default function DeletionScheduledScreen() {
  const { t } = useTranslation('account');
  const status = useDeletionHandoffStore((s) => s.status);
  const clear = useDeletionHandoffStore((s) => s.clear);

  if (!status) return null;

  const days = daysLeftUntil(status.purge_at, status.days_left);
  const date = formatPurgeDateOnly(status.purge_at);

  return (
    <SafeAreaView style={common.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={common.eyebrow}>{t('scheduled.eyebrow')}</Text>
        <Text style={styles.title}>{t('scheduled.title')}</Text>
        <Text style={styles.lead}>{t('scheduled.lead')}</Text>

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

        <Text style={styles.sectionTitle}>{t('scheduled.cancelTitle')}</Text>
        <Text style={styles.body}>{t('scheduled.cancelBody')}</Text>

        <View style={styles.actions}>
          <TouchableOpacity
            style={common.button}
            onPress={clear}
            activeOpacity={0.7}
          >
            <Text style={common.buttonText}>{t('scheduled.loginCta')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={common.secondaryButton}
            onPress={clear}
            activeOpacity={0.7}
          >
            <Text style={common.secondaryButtonText}>{t('scheduled.okCta')}</Text>
          </TouchableOpacity>
        </View>
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
  },
  body: {
    fontFamily: bodyFont.regular,
    fontSize: 14,
    color: colors.text2,
    marginTop: 8,
    lineHeight: 20,
  },
  actions: { marginTop: 28 },
});
