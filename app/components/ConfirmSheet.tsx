import { Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BottomSheet, sheetStyles } from './BottomSheet';

export default function ConfirmSheet({
    visible,
    title,
    message,
    confirmLabel,
    cancelLabel,
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
    const { t } = useTranslation('common');
    const displayCancel = cancelLabel ?? t('confirm.defaultCancel');

    return (
        <BottomSheet visible={visible} onClose={onCancel} title={title}>
            {message ? <Text style={[sheetStyles.message, { marginBottom: 24 }]}>{message}</Text> : null}
            <TouchableOpacity style={sheetStyles.primaryRow} onPress={onConfirm} activeOpacity={0.7}>
                <Text style={[sheetStyles.primaryRowText, destructive && sheetStyles.rowWarn]}>{confirmLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[sheetStyles.row, sheetStyles.rowLast]} onPress={onCancel} activeOpacity={0.7}>
                <Text style={[sheetStyles.rowText, sheetStyles.rowMuted]}>{displayCancel}</Text>
            </TouchableOpacity>
        </BottomSheet>
    );
}
