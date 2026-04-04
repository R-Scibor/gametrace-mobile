import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from '../hooks/useAuth';

export default function AuthScreen() {
    const [discordName, setDiscordName] = useState("");
    const navigation = useNavigation<any>();
    const { login, loading, error } = useAuth();

    const onPress = async () => {
        if (!discordName.trim()) return;
        const token = await login(discordName);
        if (token) {
            navigation.navigate('Main');
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>GameTrace</Text>
            <TextInput
                style={styles.input}
                placeholder="Discord Name"
                value={discordName}
                onChangeText={setDiscordName}
            />
            <TouchableOpacity style={styles.button} onPress={onPress}>
                <Text style={styles.buttonText}>Login</Text>
            </TouchableOpacity>
        </View>
    );
}
const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
    title: { fontSize: 32, fontWeight: 'bold', marginBottom: 32, textAlign: 'center' },
    input: { borderWidth: 1, borderColor: '#f70000', borderRadius: 8, padding: 12, marginBottom: 16, },
    button: { backgroundColor: '#e2f105', padding: 14, borderRadius: 8, alignItems: 'center' },
    buttonText: { color: 'white', fontSize: 16, fontWeight: '600' },
});