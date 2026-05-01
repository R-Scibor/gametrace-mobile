import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Switch, StyleSheet, ScrollView, Alert } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { logout as logoutApi } from '../api/profile';

export default function SettingsScreen() {
    const { user, logout } = useAuthStore();
    const { isDarkMode, timezone, toggleDarkMode, setTimezone } = useSettingsStore();
    const [tzInput, setTzInput] = useState(timezone);
    const [loading, setLoading] = useState(false);

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

    const handleTzSave = () => {
        setTimezone(tzInput.trim() || 'UTC');
        Alert.alert('Zapisano', 'Strefa czasowa zaktualizowana');
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.sectionHeader}>Konto</Text>
            <View style={styles.card}>
                <Text style={styles.label}>Nazwa użytkownika</Text>
                <Text style={styles.value}>{user?.username ?? '—'}</Text>
                <Text style={styles.label}>Discord ID</Text>
                <Text style={styles.value}>{user?.discordId ?? '—'}</Text>
            </View>

            <Text style={styles.sectionHeader}>Wygląd</Text>
            <View style={styles.card}>
                <View style={styles.row}>
                    <Text style={styles.rowLabel}>Tryb ciemny</Text>
                    <Switch value={isDarkMode} onValueChange={toggleDarkMode} />
                </View>
            </View>

            <Text style={styles.sectionHeader}>Lokalizacja</Text>
            <View style={styles.card}>
                <Text style={styles.label}>Strefa czasowa</Text>
                <Text style={styles.hint}>np. Europe/Warsaw, UTC</Text>
                <TextInput
                    style={styles.input}
                    value={tzInput}
                    onChangeText={setTzInput}
                    autoCapitalize="none"
                />
                <TouchableOpacity style={styles.secondaryButton} onPress={handleTzSave}>
                    <Text style={styles.secondaryButtonText}>Zapisz strefę</Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} disabled={loading}>
                <Text style={styles.logoutText}>{loading ? 'Wylogowywanie...' : 'Wyloguj się'}</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 },
    sectionHeader: { fontSize: 12, fontWeight: '700', color: '#718096', textTransform: 'uppercase', marginTop: 20, marginBottom: 8 },
    card: { backgroundColor: '#f7fafc', borderRadius: 8, padding: 16, gap: 4 },
    label: { fontSize: 12, color: '#718096', marginTop: 8 },
    value: { fontSize: 16, fontWeight: '600' },
    hint: { fontSize: 12, color: '#a0aec0', marginBottom: 4 },
    input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, fontSize: 16, backgroundColor: 'white' },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    rowLabel: { fontSize: 16 },
    secondaryButton: { borderWidth: 1, borderColor: '#5865F2', borderRadius: 8, padding: 10, alignItems: 'center', marginTop: 8 },
    secondaryButtonText: { color: '#5865F2', fontWeight: '600' },
    logoutButton: { backgroundColor: '#e53e3e', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 32, marginBottom: 40 },
    logoutText: { color: 'white', fontSize: 16, fontWeight: '600' },
});
