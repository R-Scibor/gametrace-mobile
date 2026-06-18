import { ReactNode } from 'react';
import { Modal, Pressable, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { displayFont, bodyFont } from '../theme/fonts';

export function BottomSheet({ visible, onClose, title, children }: {
    visible: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
}) {
    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <Pressable style={sheetStyles.scrim} onPress={onClose}>
                <Pressable style={sheetStyles.sheet} onPress={() => {}}>
                    <Text style={sheetStyles.title}>{title}</Text>
                    {children}
                </Pressable>
            </Pressable>
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
        fontFamily: displayFont.bold, fontSize: 11, letterSpacing: 2,
        color: colors.text3, marginBottom: 6,
    },
    message: {
        fontFamily: bodyFont.regular, fontSize: 13, color: colors.text2,
        marginTop: 4, marginBottom: 8, lineHeight: 18,
    },
    row: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
    rowLast: { borderBottomWidth: 0 },
    rowText: { fontFamily: displayFont.bold, fontSize: 14, letterSpacing: 1, color: colors.text },
    rowDesc: { fontFamily: bodyFont.regular, fontSize: 12, color: colors.text3, marginTop: 4 },
    rowWarn: { color: colors.warn },
    rowMuted: { color: colors.text3 },
});
