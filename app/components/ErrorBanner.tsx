import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { colors } from '../theme/colors';
import { displayFont, bodyFont } from '../theme/fonts';

type Props = {
    message?: string;
    label?: string;
    style?: StyleProp<ViewStyle>;
};

export default function ErrorBanner({
    message = 'Nie udało się pobrać danych. Sprawdź połączenie.',
    label = 'BŁĄD POŁĄCZENIA',
    style,
}: Props) {
    return (
        <View style={[styles.container, style]}>
            <View style={styles.bar} />
            <View style={styles.body}>
                <Text style={styles.label}>{label}</Text>
                <Text style={styles.message}>{message}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: colors.warnTint,
        borderWidth: 1, borderColor: colors.warnBorder,
    },
    bar: { width: 2, backgroundColor: colors.warn },
    body: { flex: 1, paddingHorizontal: 14, paddingVertical: 10 },
    label: {
        fontFamily: displayFont.bold, fontSize: 10, letterSpacing: 2.5,
        color: colors.warn, marginBottom: 4,
    },
    message: {
        fontFamily: bodyFont.regular, fontSize: 13, color: colors.text2, lineHeight: 18,
    },
});
