import { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import { useServerStore } from '../store/serverStore';
import { useReportStore } from '../store/reportStore';
import { useChangeServer } from './useChangeServer';
import { useTimezone } from './useTimezone';
import { useLanguage } from '../hooks/useLanguage';
import { isLanguage, type Language } from '../i18n/resolve';
import { logout as logoutApi } from '../api/profile';
import { getHealth } from '../api/health';
import { HealthResponse } from '../types/api';
import { useAlertStore } from '../store/alertStore';
import ConfirmSheet from '../components/ConfirmSheet';
import AlertSheet from '../components/AlertSheet';
import TimezonePicker from '../components/TimezonePicker';
import PolicyBody from '../components/PolicyBody';
import { BottomSheet } from '../components/BottomSheet';
import { formatUptime, botColor } from '../utils/bot';
import { ACCOUNT_DELETION_GRACE_DAYS } from '../utils/accountDeletion';
import { formatAppVersion } from '../utils/appVersion';
import { colors } from '../theme/colors';
import { bodyFont, displayFont } from '../theme/fonts';
import { common } from '../theme/styles';

function SectionHeaderLocal({ title }: { title: string }) {
    return (
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>{title}</Text>
            <View style={styles.sectionLine} />
        </View>
    );
}

function SettingsRow({ label, subtext, children }: { label: string, subtext?: string, children: React.ReactNode }) {
    return (
        <View style={styles.row}>
            <View style={styles.rowInfo}>
                <Text style={styles.rowLabel}>{label}</Text>
                {subtext ? <Text style={styles.rowSubtext}>{subtext}</Text> : null}
            </View>
            <View style={styles.rowControl}>
                {children}
            </View>
        </View>
    );
}

export default function SettingsScreen() {
    const navigation = useNavigation();
    const { t, i18n } = useTranslation('settings');
    const { t: tc } = useTranslation('common');
    const { t: ts } = useTranslation('server');
    const { user, isAdmin, logout } = useAuthStore();
    const openReport = useReportStore((s) => s.open);
    const { timezone, select: selectTimezone, sync: syncTimezone, error: tzError, clearError: clearTzError } = useTimezone();
    const {
        select: selectLanguage,
        isPending: languagePending,
        error: langError,
        clearError: clearLangError,
    } = useLanguage();
    const activeLanguage: Language = isLanguage(i18n.language) ? i18n.language : 'pl';
    const serverUrl = useServerStore((s) => s.serverUrl);
    const { change, confirmInsecure, loading: changeLoading } = useChangeServer();
    const [serverModalOpen, setServerModalOpen] = useState(false);
    const [serverInput, setServerInput] = useState('');
    const [serverError, setServerError] = useState<string | null>(null);
    const [insecureUrl, setInsecureUrl] = useState<string | null>(null);

    const submitServerChange = async () => {
        if (changeLoading) return;
        setServerError(null);
        const result = await change(serverInput);
        if (result.status === 'ok') {
            setServerModalOpen(false);
        } else if (result.status === 'insecure') {
            setInsecureUrl(result.baseUrl);
        } else if (result.status === 'invalid') {
            setServerError(ts('errors.invalid'));
        } else {
            setServerError(ts('errors.unreachable'));
        }
    };

    const [loading, setLoading] = useState(false);
    const [tzPickerOpen, setTzPickerOpen] = useState(false);
    const [health, setHealth] = useState<HealthResponse | null>(null);
    const [policyOpen, setPolicyOpen] = useState(false);
    const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                setHealth(await getHealth());
            } catch {
                // TODO
            }
        })();
        syncTimezone();
    }, []);

    const handleLogout = async () => {
        if (loading) return;
        setLogoutConfirmOpen(false);
        setLoading(true);
        try {
            await logoutApi();
        } catch {
            // Local logout still proceeds — never strand someone in a signed-in
            // shell because the network failed — but the server session may live
            // on, which the user needs to know about.
            useAlertStore.getState().showAlert(t('logoutFailed.title'), t('logoutFailed.message'));
        }
        logout();
    };

    return (
        <SafeAreaView style={common.safe} edges={['top']}>
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

                {/* Header */}
                <View style={styles.header}>
                    <Text style={common.eyebrow}>◈ GAMETRACE</Text>
                    <Text style={common.title}>{t('title')}</Text>
                </View>

                {/* Account */}
                <SectionHeaderLocal title={t('sections.account')} />
                <SettingsRow
                    label={t('account.user')}
                    subtext={user?.discordId ? t('account.userId', { id: user.discordId }) : undefined}
                >
                    <Text style={styles.rowValue}>{user?.username ?? '—'}</Text>
                </SettingsRow>
                {isAdmin && (
                    <SettingsRow label={t('account.permissions')}>
                        <View style={styles.adminBadge}>
                            <Text style={styles.adminBadgeText}>{t('account.admin')}</Text>
                        </View>
                    </SettingsRow>
                )}
                <SettingsRow
                    label={t('account.delete')}
                    subtext={
                        isAdmin
                            ? t('account.deleteAdmin')
                            : t('account.deleteSub', { days: ACCOUNT_DELETION_GRACE_DAYS })
                    }
                >
                    <TouchableOpacity
                        style={[styles.deleteButton, isAdmin && styles.deleteButtonDisabled]}
                        onPress={() => navigation.navigate('DeleteAccount')}
                        disabled={isAdmin}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.deleteButtonText, isAdmin && styles.deleteButtonTextDisabled]}>
                            {t('account.deleteAction')}
                        </Text>
                    </TouchableOpacity>
                </SettingsRow>

                {/* Appearance */}
                <SectionHeaderLocal title={t('sections.preferences')} />
                <SettingsRow label={t('preferences.language')}>
                    <View style={styles.langChips}>
                        {(['pl', 'en'] as const).map((lng) => {
                            const selected = activeLanguage === lng;
                            return (
                                <TouchableOpacity
                                    key={lng}
                                    style={[styles.langChip, selected && styles.langChipSelected]}
                                    onPress={() => selectLanguage(lng)}
                                    disabled={languagePending}
                                    activeOpacity={0.8}
                                >
                                    <Text style={[styles.langChipText, selected && styles.langChipTextSelected]}>
                                        {tc(`language.${lng}`)}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </SettingsRow>

                <SettingsRow label={t('preferences.timezone')} subtext={timezone}>
                    <TouchableOpacity
                        style={styles.tzButton}
                        onPress={() => setTzPickerOpen(true)}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.tzButtonText}>{timezone.split('/').pop()?.replace(/_/g, ' ')}</Text>
                        <Text style={styles.chevron}>▾</Text>
                    </TouchableOpacity>
                </SettingsRow>

                {/* Status */}
                <SectionHeaderLocal title={t('sections.status')} />
                <SettingsRow label={t('status.bot')}>
                    <Text style={[styles.statusValue, health && botColor(health.bot.status)]}>
                        {health ? health.bot.status.toUpperCase() : '—'}
                    </Text>
                </SettingsRow>
                {health?.bot.uptime_seconds != null && (
                    <SettingsRow label={t('status.botUptime')}>
                        <Text style={styles.statusValue}>{formatUptime(health.bot.uptime_seconds)}</Text>
                    </SettingsRow>
                )}

                {/* Data */}
                <SectionHeaderLocal title={t('sections.data')} />
                <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={() => navigation.navigate('Trash')}>
                    <View style={styles.rowInfo}>
                        <Text style={styles.rowLabel}>{t('data.trash')}</Text>
                        <Text style={styles.rowSubtext}>{t('data.trashSub')}</Text>
                    </View>
                    <Text style={styles.chevron}>→</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={() => setPolicyOpen(true)}>
                    <View style={styles.rowInfo}>
                        <Text style={styles.rowLabel}>{t('data.privacy')}</Text>
                        <Text style={styles.rowSubtext}>{t('data.privacySub')}</Text>
                    </View>
                    <Text style={styles.chevron}>→</Text>
                </TouchableOpacity>

                {/* Connection */}
                <SectionHeaderLocal title={t('sections.connection')} />
                <TouchableOpacity
                    style={styles.row}
                    activeOpacity={0.7}
                    onPress={() => { setServerInput(''); setServerError(null); setServerModalOpen(true); }}
                >
                    <View style={styles.rowInfo}>
                        <Text style={styles.rowLabel}>{t('connection.server')}</Text>
                        <Text style={styles.rowSubtext} numberOfLines={1}>{serverUrl ?? '—'}</Text>
                    </View>
                    <Text style={styles.chevron}>→</Text>
                </TouchableOpacity>

                {/* Feedback */}
                <SectionHeaderLocal title={t('sections.feedback')} />
                <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={openReport}>
                    <View style={styles.rowInfo}>
                        <Text style={styles.rowLabel}>{t('feedback.send')}</Text>
                        <Text style={styles.rowSubtext}>{t('feedback.sendSub')}</Text>
                    </View>
                    <Text style={styles.chevron}>→</Text>
                </TouchableOpacity>

                {/* Logout */}
                <TouchableOpacity
                    style={[common.secondaryButton, styles.logout]}
                    onPress={() => setLogoutConfirmOpen(true)}
                    disabled={loading}
                    activeOpacity={0.7}
                >
                    <Text style={common.secondaryButtonText}>
                        {loading ? t('logoutPending') : t('logout')}
                    </Text>
                </TouchableOpacity>

                <View style={styles.footer}>
                    <View style={styles.hairline} />
                    <Text style={styles.version}>
                        {`GAMETRACE ${formatAppVersion()} · API ${health?.version ?? '—'}`}
                    </Text>
                    <View style={styles.hairline} />
                </View>

            </ScrollView>

            <TimezonePicker
                visible={tzPickerOpen}
                currentValue={timezone}
                onSelect={(z) => { selectTimezone(z); setTzPickerOpen(false); }}
                onClose={() => setTzPickerOpen(false)}
            />

            <ConfirmSheet
                visible={logoutConfirmOpen}
                title={t('logoutConfirm.title')}
                message={t('logoutConfirm.message')}
                confirmLabel={t('logoutConfirm.confirm')}
                onConfirm={handleLogout}
                onCancel={() => setLogoutConfirmOpen(false)}
            />

            <BottomSheet
                visible={policyOpen}
                onClose={() => setPolicyOpen(false)}
                title={t('data.privacy')}
            >
                <PolicyBody showTitle={false} />
            </BottomSheet>

            <AlertSheet
                visible={tzError}
                message={t('errors.timezoneSave')}
                onDismiss={clearTzError}
            />

            <AlertSheet
                visible={langError}
                message={t('errors.languageSave')}
                onDismiss={clearLangError}
            />

            <Modal visible={serverModalOpen} transparent animationType="fade" onRequestClose={() => setServerModalOpen(false)}>
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>{t('serverModal.title')}</Text>
                        <Text style={styles.modalHint}>{t('serverModal.hint')}</Text>
                        <View style={styles.inputWrapper}>
                            <View style={styles.orangeBar} />
                            <TextInput
                                style={styles.modalInput}
                                value={serverInput}
                                onChangeText={setServerInput}
                                placeholder={ts('addressPlaceholder')}
                                placeholderTextColor={colors.text3}
                                autoCapitalize="none"
                                autoCorrect={false}
                                keyboardType="url"
                            />
                        </View>
                        {serverError ? <Text style={styles.modalError}>{serverError}</Text> : null}
                        <View style={styles.modalActions}>
                            <TouchableOpacity onPress={() => setServerModalOpen(false)}>
                                <Text style={styles.modalCancel}>{tc('actions.cancel')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={submitServerChange} disabled={changeLoading}>
                                <Text style={styles.modalConfirm}>
                                    {changeLoading ? ts('connecting') : ts('connect')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <ConfirmSheet
                visible={insecureUrl != null}
                title={ts('insecure.title')}
                message={ts('insecure.message')}
                confirmLabel={ts('insecure.confirm')}
                destructive
                onConfirm={() => { if (insecureUrl) confirmInsecure(insecureUrl); setInsecureUrl(null); setServerModalOpen(false); }}
                onCancel={() => setInsecureUrl(null)}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    content: { paddingHorizontal: 20, paddingBottom: 40 },
    header: { paddingTop: 0, paddingBottom: 20 },

    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 24,
        marginBottom: 10,
        gap: 12,
    },
    sectionHeaderText: {
        fontFamily: displayFont.bold,
        fontSize: 10,
        letterSpacing: 2,
        color: colors.orange,
    },
    sectionLine: {
        flex: 1,
        height: 1,
        backgroundColor: colors.orange,
        opacity: 0.3,
    },

    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
    },
    rowInfo: {
        flex: 1,
        paddingRight: 10,
    },
    rowLabel: {
        fontFamily: bodyFont.regular,
        fontSize: 14,
        color: colors.text,
    },
    rowSubtext: {
        fontFamily: bodyFont.regular,
        fontSize: 11,
        color: colors.text3,
        marginTop: 2,
    },
    rowControl: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rowValue: {
        fontFamily: bodyFont.medium,
        fontSize: 14,
        color: colors.text,
    },

    adminBadge: {
        backgroundColor: colors.orangeDim,
        borderWidth: 1,
        borderColor: colors.orange,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 2,
    },
    adminBadgeText: {
        fontFamily: displayFont.bold,
        fontSize: 10,
        letterSpacing: 1,
        color: colors.orange,
    },

    deleteButton: {
        backgroundColor: colors.warnTint,
        borderWidth: 1,
        borderColor: colors.warnBorder,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 2,
    },
    deleteButtonDisabled: {
        backgroundColor: colors.bg4,
        borderColor: colors.border,
        opacity: 0.6,
    },
    deleteButtonText: {
        fontFamily: displayFont.bold,
        fontSize: 11,
        letterSpacing: 1,
        color: colors.warn,
    },
    deleteButtonTextDisabled: {
        color: colors.text3,
    },

    tzButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.bg3,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 2,
    },
    tzButtonText: {
        fontFamily: bodyFont.regular,
        fontSize: 12,
        color: colors.text,
    },
    langChips: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    langChip: {
        backgroundColor: colors.bg3,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 2,
    },
    langChipSelected: {
        borderColor: colors.orange,
        backgroundColor: colors.orangeDim,
    },
    langChipText: {
        fontFamily: bodyFont.regular,
        fontSize: 12,
        color: colors.text,
    },
    langChipTextSelected: {
        color: colors.orange,
        fontFamily: bodyFont.medium,
    },
    chevron: {
        marginLeft: 6,
        fontFamily: displayFont.bold,
        fontSize: 12,
        color: colors.text3,
    },

    statusValue: {
        fontFamily: bodyFont.medium,
        fontSize: 13,
        color: colors.text,
    },

    logout: { marginTop: 32 },

    footer: {
        marginTop: 40,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
    },
    hairline: {
        flex: 1,
        height: 1,
        backgroundColor: colors.border,
    },
    version: {
        fontFamily: displayFont.bold,
        fontSize: 10,
        color: colors.text3,
        letterSpacing: 2,
        paddingHorizontal: 16,
    },

    inputWrapper: {
        flexDirection: 'row', backgroundColor: colors.bg3, borderWidth: 1,
        borderColor: colors.borderBright, borderRadius: 2, overflow: 'hidden', marginTop: 12,
    },
    orangeBar: { width: 2, backgroundColor: colors.orange },
    modalInput: {
        flex: 1, paddingHorizontal: 14, paddingVertical: 12,
        fontFamily: bodyFont.regular, fontSize: 15, color: colors.text, borderWidth: 0,
    },
    modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', paddingHorizontal: 28 },
    modalCard: { backgroundColor: colors.bg2, borderWidth: 1, borderColor: colors.border, borderRadius: 4, padding: 20 },
    modalTitle: { fontFamily: displayFont.bold, fontSize: 16, color: colors.text },
    modalHint: { fontFamily: bodyFont.regular, fontSize: 12, color: colors.text3, marginTop: 6 },
    modalError: { fontFamily: bodyFont.regular, fontSize: 12, color: colors.orange, marginTop: 8 },
    modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 24, marginTop: 18 },
    modalCancel: { fontFamily: displayFont.bold, fontSize: 12, letterSpacing: 1, color: colors.text3 },
    modalConfirm: { fontFamily: displayFont.bold, fontSize: 12, letterSpacing: 1, color: colors.orange },
});
