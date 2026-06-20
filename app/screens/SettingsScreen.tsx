import { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Modal, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { useServerStore } from '../store/serverStore';
import { useChangeServer } from './useChangeServer';
import { logout as logoutApi } from '../api/profile';
import { getHealth } from '../api/health';
import { HealthResponse } from '../types/api';
import TimezonePicker from '../components/TimezonePicker';
import { formatUptime, botColor } from '../utils/bot';
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
    const { user, logout } = useAuthStore();
    const { isDarkMode, timezone, toggleDarkMode, setTimezone } = useSettingsStore();
    const serverUrl = useServerStore((s) => s.serverUrl);
    const { change, confirmInsecure, loading: changeLoading } = useChangeServer();
    const [serverModalOpen, setServerModalOpen] = useState(false);
    const [serverInput, setServerInput] = useState('');
    const [serverError, setServerError] = useState<string | null>(null);

    const submitServerChange = async () => {
        if (changeLoading) return;
        setServerError(null);
        const result = await change(serverInput);
        if (result.status === 'ok') {
            setServerModalOpen(false);
        } else if (result.status === 'insecure') {
            Alert.alert(
                'Połączenie nieszyfrowane',
                'Ten serwer jest dostępny tylko przez nieszyfrowane HTTP. Połączyć mimo to?',
                [
                    { text: 'Anuluj', style: 'cancel' },
                    { text: 'Połącz mimo to', onPress: () => { confirmInsecure(result.baseUrl); setServerModalOpen(false); } },
                ]
            );
        } else if (result.status === 'invalid') {
            setServerError('Podaj adres serwera (host:port)');
        } else {
            setServerError('Nie można połączyć się z serwerem');
        }
    };

    const [loading, setLoading] = useState(false);
    const [tzPickerOpen, setTzPickerOpen] = useState(false);
    const [health, setHealth] = useState<HealthResponse | null>(null);

    useEffect(() => {
        (async () => {
            try {
                setHealth(await getHealth());
            } catch {
                // TODO
            }
        })();
    }, []);

    const handleLogout = async () => {
        if (loading) return;
        setLoading(true);
        try {
            await logoutApi();
        } catch {
            // TODO
        }
        logout();
    };

    return (
        <SafeAreaView style={common.safe} edges={['top']}>
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

                {/* Header */}
                <View style={styles.header}>
                    <Text style={common.eyebrow}>◈ GAMETRACE</Text>
                    <Text style={common.title}>Ustawienia</Text>
                </View>

                {/* Account */}
                <SectionHeaderLocal title="KONTO" />
                <SettingsRow label="Użytkownik" subtext={user?.discordId ? `ID: ${user.discordId}` : undefined}>
                    <Text style={styles.rowValue}>{user?.username ?? '—'}</Text>
                </SettingsRow>

                {/* Appearance */}
                <SectionHeaderLocal title="PREFERENCJE" />
                <SettingsRow label="Tryb ciemny" subtext="Interfejs aplikacji">
                    <Switch
                        value={isDarkMode}
                        onValueChange={toggleDarkMode}
                        trackColor={{ false: colors.bg4, true: colors.orangeDim }}
                        thumbColor={isDarkMode ? colors.orange : colors.text3}
                        ios_backgroundColor={colors.bg4}
                    />
                </SettingsRow>

                <SettingsRow label="Strefa czasowa" subtext={timezone}>
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
                <SectionHeaderLocal title="STATUS" />
                <SettingsRow label="Bot">
                    <Text style={[styles.statusValue, health && botColor(health.bot.status)]}>
                        {health ? health.bot.status.toUpperCase() : '—'}
                    </Text>
                </SettingsRow>
                {health?.bot.uptime_seconds != null && (
                    <SettingsRow label="Bot aktywny od">
                        <Text style={styles.statusValue}>{formatUptime(health.bot.uptime_seconds)}</Text>
                    </SettingsRow>
                )}

                {/* Data */}
                <SectionHeaderLocal title="DANE" />
                <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={() => navigation.navigate('Trash')}>
                    <View style={styles.rowInfo}>
                        <Text style={styles.rowLabel}>Kosz</Text>
                        <Text style={styles.rowSubtext}>Odrzucone sesje</Text>
                    </View>
                    <Text style={styles.chevron}>→</Text>
                </TouchableOpacity>

                {/* Connection */}
                <SectionHeaderLocal title="POŁĄCZENIE" />
                <TouchableOpacity
                    style={styles.row}
                    activeOpacity={0.7}
                    onPress={() => { setServerInput(''); setServerError(null); setServerModalOpen(true); }}
                >
                    <View style={styles.rowInfo}>
                        <Text style={styles.rowLabel}>Serwer</Text>
                        <Text style={styles.rowSubtext} numberOfLines={1}>{serverUrl ?? '—'}</Text>
                    </View>
                    <Text style={styles.chevron}>→</Text>
                </TouchableOpacity>

                {/* Logout */}
                <TouchableOpacity
                    style={[common.secondaryButton, styles.logout]}
                    onPress={handleLogout}
                    disabled={loading}
                    activeOpacity={0.7}
                >
                    <Text style={common.secondaryButtonText}>
                        {loading ? 'WYLOGOWYWANIE...' : 'WYLOGUJ SIĘ'}
                    </Text>
                </TouchableOpacity>

                <View style={styles.footer}>
                    <View style={styles.hairline} />
                    <Text style={styles.version}>GAMETRACE {health?.version ?? '—'}</Text>
                    <View style={styles.hairline} />
                </View>

            </ScrollView>

            <TimezonePicker
                visible={tzPickerOpen}
                currentValue={timezone}
                onSelect={(z) => { setTimezone(z); setTzPickerOpen(false); }}
                onClose={() => setTzPickerOpen(false)}
            />

            <Modal visible={serverModalOpen} transparent animationType="fade" onRequestClose={() => setServerModalOpen(false)}>
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Zmień serwer</Text>
                        <Text style={styles.modalHint}>Po zmianie serwera zostaniesz wylogowany.</Text>
                        <View style={styles.inputWrapper}>
                            <View style={styles.orangeBar} />
                            <TextInput
                                style={styles.modalInput}
                                value={serverInput}
                                onChangeText={setServerInput}
                                placeholder="host:port"
                                placeholderTextColor={colors.text3}
                                autoCapitalize="none"
                                autoCorrect={false}
                                keyboardType="url"
                            />
                        </View>
                        {serverError ? <Text style={styles.modalError}>{serverError}</Text> : null}
                        <View style={styles.modalActions}>
                            <TouchableOpacity onPress={() => setServerModalOpen(false)}>
                                <Text style={styles.modalCancel}>ANULUJ</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={submitServerChange} disabled={changeLoading}>
                                <Text style={styles.modalConfirm}>{changeLoading ? 'ŁĄCZENIE...' : 'POŁĄCZ'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    content: { paddingHorizontal: 20, paddingBottom: 40 },
    header: { paddingTop: 16, paddingBottom: 20 },

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
