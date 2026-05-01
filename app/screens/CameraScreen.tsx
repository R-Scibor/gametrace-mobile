import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';

export default function CameraScreen() {
    const handleRecord = () => {
        Alert.alert('Wkrótce', 'Nagrywanie sesji głosowych będzie dostępne w kolejnej wersji');
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Sesja głosowa</Text>
            <Text style={styles.subtitle}>
                Nagraj co grałeś — Whisper rozpozna grę i doda sesję automatycznie.
            </Text>
            <TouchableOpacity style={styles.recordButton} onPress={handleRecord}>
                <Text style={styles.recordIcon}>🎙️</Text>
                <Text style={styles.recordLabel}>Nagraj sesję</Text>
            </TouchableOpacity>
            <Text style={styles.coming}>Funkcja w trakcie implementacji</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
    title: { fontSize: 22, fontWeight: 'bold', marginBottom: 12 },
    subtitle: { fontSize: 15, color: '#718096', textAlign: 'center', marginBottom: 48 },
    recordButton: {
        width: 120, height: 120, borderRadius: 60,
        backgroundColor: '#5865F2', justifyContent: 'center', alignItems: 'center',
        marginBottom: 16,
    },
    recordIcon: { fontSize: 36 },
    recordLabel: { color: 'white', fontSize: 13, fontWeight: '600', marginTop: 4 },
    coming: { fontSize: 12, color: '#a0aec0', marginTop: 8 },
});
