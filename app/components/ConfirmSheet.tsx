import { Text, TouchableOpacity } from 'react-native';
import { BottomSheet, sheetStyles } from './BottomSheet';

export default function ConfirmSheet({
    visible,
    title,
    message,
    confirmLabel,
    cancelLabel = 'Anuluj',
    destructive,
    onConfirm,
    onCancel,
}: {
    visible: boolean;
    title: string;
    message?: string;
    confirmLabel: string;
    cancelLabel?: string;
    destructive?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}) {
    return (
        <BottomSheet visible={visible} onClose={onCancel} title={title}>
            {message ? <Text style={sheetStyles.message}>{message}</Text> : null}
            <TouchableOpacity style={sheetStyles.row} onPress={onConfirm} activeOpacity={0.7}>
                <Text style={[sheetStyles.rowText, destructive && sheetStyles.rowWarn]}>{confirmLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[sheetStyles.row, sheetStyles.rowLast]} onPress={onCancel} activeOpacity={0.7}>
                <Text style={[sheetStyles.rowText, sheetStyles.rowMuted]}>{cancelLabel}</Text>
            </TouchableOpacity>
        </BottomSheet>
    );
}
