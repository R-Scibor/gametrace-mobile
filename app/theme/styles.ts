import { StyleSheet } from 'react-native';
import { colors } from './colors';
import { displayFont, bodyFont } from './fonts';

export const common = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },

    eyebrow: {
        fontFamily: displayFont.bold, fontSize: 11, letterSpacing: 3,
        color: colors.orange, marginBottom: 4,
    },
    title: {
        fontFamily: displayFont.bold, fontSize: 22, letterSpacing: -0.5, color: colors.text,
    },
    label: {
        fontFamily: displayFont.bold, fontSize: 11, letterSpacing: 2,
        color: colors.text3, marginTop: 20, marginBottom: 8,
    },

    inputWrapper: {
        flexDirection: 'row',
        backgroundColor: colors.bg3,
        borderWidth: 1, borderColor: colors.borderBright,
        borderRadius: 2, overflow: 'hidden',
    },
    orangeBar: { width: 2, backgroundColor: colors.orange },
    input: {
        flex: 1, paddingHorizontal: 14, paddingVertical: 12,
        fontFamily: bodyFont.regular, fontSize: 15, color: colors.text,
    },

    button: {
        backgroundColor: colors.orange, borderRadius: 2,
        paddingVertical: 15, alignItems: 'center', marginTop: 32,
    },
    buttonDisabled: { backgroundColor: colors.bg4 },
    buttonText: {
        fontFamily: displayFont.bold, fontSize: 13, letterSpacing: 2,
        color: colors.buttonTextOnOrange,
    },
    buttonTextDisabled: { color: colors.text3 },
    secondaryButton: {
        borderWidth: 1, borderColor: colors.borderBright, borderRadius: 2,
        paddingVertical: 13, alignItems: 'center', marginTop: 10,
    },
    secondaryButtonText: {
        fontFamily: displayFont.bold, fontSize: 13, letterSpacing: 2, color: colors.text3,
    },
});
