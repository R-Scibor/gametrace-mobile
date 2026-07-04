import { Text, TouchableOpacity } from 'react-native';
import { BottomSheet, sheetStyles } from './BottomSheet';

export default function AlertSheet({
    visible,
    title = 'BŁĄD',
    message,
    dismissLabel = 'OK',
    onDismiss,
}: {
    visible: boolean;
    title?: string;
    message?: string;
    dismissLabel?: string;
    onDismiss: () => void;
}) {
    return (
        <BottomSheet visible={visible} onClose={onDismiss} title={title}>
            {message ? <Text style={[sheetStyles.message, { marginBottom: 24 }]}>{message}</Text> : null}
            <TouchableOpacity style={sheetStyles.primaryRow} onPress={onDismiss} activeOpacity={0.7}>
                <Text style={sheetStyles.primaryRowText}>{dismissLabel}</Text>
            </TouchableOpacity>
        </BottomSheet>
    );
}
