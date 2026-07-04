import { ReactNode } from 'react';
import { Modal, Pressable, View, Text, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { colors } from '../theme/colors';
import { displayFont, bodyFont } from '../theme/fonts';

export function BottomSheet({ visible, onClose, title, children, keyboardAware = false }: {
    visible: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    keyboardAware?: boolean;
}) {
    const body = (
        <View style={sheetStyles.sheet}>
            <Text style={sheetStyles.title}>{title}</Text>
            {children}
        </View>
    );

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={sheetStyles.scrim}>
                {/* Scrim sits BEHIND the sheet as a sibling so the sheet body is
                    not wrapped in a Pressable (which would swallow child scroll gestures). */}
                <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
                {keyboardAware ? (
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                        {body}
                    </KeyboardAvoidingView>
                ) : (
                    body
                )}
            </View>
        </Modal>
    );
}

export const sheetStyles = StyleSheet.create({
    scrim: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)', justifyContent: 'flex-end' },
    sheet: {
        backgroundColor: colors.bg2,
        borderTopWidth: 1, borderColor: colors.borderBright,
        paddingHorizontal: 20, paddingTop: 18, paddingBottom: 28,
    },
    title: {
        fontFamily: displayFont.bold, fontSize: 14, letterSpacing: 1,
        color: colors.text, marginBottom: 8,
        textAlign: 'center',
    },
    message: {
        fontFamily: bodyFont.regular, fontSize: 13, color: colors.text2,
        marginTop: 4, marginBottom: 8, lineHeight: 18,
        textAlign: 'center',
    },
    row: {
        paddingVertical: 10,
        borderBottomWidth: 1, borderBottomColor: colors.border,
        flexDirection: 'column',
        alignItems: 'center',
    },
    rowLast: { borderBottomWidth: 0 },
    rowText: {
        fontFamily: displayFont.bold, fontSize: 14, letterSpacing: 1, color: colors.text,
        textAlign: 'center',
    },
    rowDesc: {
        fontFamily: bodyFont.regular, fontSize: 12, color: colors.text3, marginTop: 4,
        textAlign: 'center',
    },
    rowWarn: { color: colors.warn },
    rowMuted: { color: colors.text3 },

    // Tinted primary action (for main action in alerts/confirms)
    primaryRow: {
        paddingVertical: 10,
        backgroundColor: 'rgba(255,122,26,0.12)',
        borderWidth: 1,
        borderColor: colors.orange,
        flexDirection: 'column',
        alignItems: 'center',
        marginBottom: 8,
    },
    primaryRowText: {
        fontFamily: displayFont.bold, fontSize: 14, letterSpacing: 1, color: colors.orange,
        textAlign: 'center',
    },
});
