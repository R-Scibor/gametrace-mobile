import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";

export default function AuthScreen() {
    const [discordName, setDiscordName] = useState("");
    const navigation = useNavigation<any>();

    const handleLogin = () => {
        if (!discordName.trim()) {
            Alert.alert("Error", "Please enter your Discord name.");
            return;
        }
        // TODO: Api call here
        navigation.navigate('Main');
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
            <TouchableOpacity style={styles.button} onPress={handleLogin}>
                <Text style={styles.buttonText}>Login</Text>
            </TouchableOpacity>
        </View>
    );
}
const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
    title: { fontSize: 32, fontWeight: 'bold', marginBottom: 32, textAlign: 'center' },
    input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 16, },
    button: { backgroundColor: '#5865F2', padding: 14, borderRadius: 8, alignItems: 'center' },
    buttonText: { color: 'white', fontSize: 16, fontWeight: '600' },
});