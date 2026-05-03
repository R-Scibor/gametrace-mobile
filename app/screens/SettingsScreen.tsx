import { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Switch, StyleSheet, ScrollView, FlatList, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { logout as logoutApi } from '../api/profile';
import { colors } from '../theme/colors';
import { bodyFont, displayFont } from '../theme/fonts';
import { common } from '../theme/styles';

const FALLBACK_ZONES = [
    'UTC',
    'Europe/Warsaw', 'Europe/London', 'Europe/Berlin', 'Europe/Paris', 'Europe/Madrid', 'Europe/Rome', 'Europe/Moscow', 'Europe/Istanbul',
    'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'America/Toronto', 'America/Mexico_City', 'America/Sao_Paulo', 'America/Buenos_Aires',
    'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Hong_Kong', 'Asia/Singapore', 'Asia/Seoul', 'Asia/Bangkok', 'Asia/Dubai', 'Asia/Kolkata', 'Asia/Jakarta',
    'Australia/Sydney', 'Australia/Melbourne', 'Australia/Perth',
    'Pacific/Auckland',
    'Africa/Cairo', 'Africa/Johannesburg',
];

function getAllZones(): string[] {
    try {
        const fn = (Intl as any).supportedValuesOf;
        if (typeof fn === 'function') return fn('timeZone');
    } catch {
        // TODO
    }
    return FALLBACK_ZONES;
}

export default function SettingsScreen() {
    const { user, logout } = useAuthStore();
    const { isDarkMode, timezone, toggleDarkMode, setTimezone } = useSettingsStore();
    const [loading, setLoading] = useState(false);
    const [tzPickerOpen, setTzPickerOpen] = useState(false);
    const [tzSearch, setTzSearch] = useState('');

    const allZones = useMemo(() => getAllZones(), []);
    const filteredZones = tzSearch.trim()
        ? allZones.filter(z => z.toLowerCase().includes(tzSearch.toLowerCase()))
        : allZones;

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

    const pickZone = (z: string) => {
        setTimezone(z);
        setTzPickerOpen(false);
        setTzSearch('');
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
                <Text style={common.label}>KONTO</Text>
                <Text style={styles.field}>Nazwa użytkownika</Text>
                <Text style={styles.value}>{user?.username ?? '—'}</Text>
                <Text style={styles.field}>Discord ID</Text>
                <Text style={styles.value}>{user?.discordId ?? '—'}</Text>

                {/* Appearance */}
                <Text style={common.label}>WYGLĄD</Text>
                <View style={styles.toggleRow}>
                    <Text style={styles.toggleLabel}>Tryb ciemny</Text>
                    <Switch
                        value={isDarkMode}
                        onValueChange={toggleDarkMode}
                        trackColor={{ false: colors.bg4, true: colors.orange }}
                        thumbColor={colors.text}
                    />
                </View>

                {/* Timezone */}
                <Text style={common.label}>STREFA CZASOWA</Text>
                <TouchableOpacity
                    style={common.inputWrapper}
                    onPress={() => setTzPickerOpen(true)}
                    activeOpacity={0.8}
                >
                    <View style={common.orangeBar} />
                    <Text style={styles.tzValue}>{timezone}</Text>
                    <Text style={styles.chevron}>▾</Text>
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

            </ScrollView>

            {/* Timezone picker */}
            <Modal
                visible={tzPickerOpen}
                animationType="slide"
                onRequestClose={() => setTzPickerOpen(false)}
            >
                <SafeAreaView style={common.safe} edges={['top', 'bottom']}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setTzPickerOpen(false)} hitSlop={12}>
                            <Text style={styles.back}>← ZAMKNIJ</Text>
                        </TouchableOpacity>
                        <Text style={common.title}>Strefa czasowa</Text>
                    </View>

                    <View style={styles.modalSearch}>
                        <View style={common.inputWrapper}>
                            <View style={common.orangeBar} />
                            <TextInput
                                style={common.input}
                                placeholder="Szukaj..."
                                placeholderTextColor={colors.text3}
                                value={tzSearch}
                                onChangeText={setTzSearch}
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                        </View>
                    </View>

                    <FlatList
                        data={filteredZones}
                        keyExtractor={z => z}
                        keyboardShouldPersistTaps="handled"
                        renderItem={({ item }) => {
                            const selected = item === timezone;
                            return (
                                <TouchableOpacity
                                    style={styles.tzRow}
                                    onPress={() => pickZone(item)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[styles.tzText, selected && styles.tzTextSelected]}>
                                        {item}
                                    </Text>
                                    {selected && <Text style={styles.tzCheck}>✓</Text>}
                                </TouchableOpacity>
                            );
                        }}
                    />
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    content: { paddingHorizontal: 20, paddingBottom: 40 },
    header: { paddingTop: 16, paddingBottom: 20 },

    field: { fontFamily: bodyFont.regular, fontSize: 13, color: colors.text3, marginTop: 8 },
    value: { fontFamily: bodyFont.medium, fontSize: 16, color: colors.text, marginTop: 2 },

    toggleRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: colors.bg2,
        borderWidth: 1, borderColor: colors.border, borderRadius: 2,
        paddingHorizontal: 14, paddingVertical: 8,
    },
    toggleLabel: { fontFamily: bodyFont.regular, fontSize: 15, color: colors.text },

    tzValue: {
        flex: 1, paddingHorizontal: 14, paddingVertical: 12,
        fontFamily: bodyFont.regular, fontSize: 15, color: colors.text,
    },
    chevron: {
        paddingRight: 14,
        fontFamily: displayFont.bold, fontSize: 14, color: colors.text3,
    },

    logout: { marginTop: 32 },

    // Modal
    modalHeader: { paddingTop: 16, paddingBottom: 20, paddingHorizontal: 20, gap: 12 },
    back: { fontFamily: displayFont.bold, fontSize: 11, letterSpacing: 2, color: colors.text3 },
    modalSearch: { paddingHorizontal: 20, paddingBottom: 12 },

    tzRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingVertical: 14,
        borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    tzText: { fontFamily: bodyFont.regular, fontSize: 15, color: colors.text },
    tzTextSelected: { color: colors.orange, fontFamily: bodyFont.medium },
    tzCheck: { fontFamily: displayFont.bold, fontSize: 14, color: colors.orange },
});
