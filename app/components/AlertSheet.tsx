import { Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BottomSheet, sheetStyles } from './BottomSheet';

export default function AlertSheet({
    visible,
    title,
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
    const { t } = useTranslation('common');
    const displayTitle = title ?? t('alert.defaultTitle');

    return (
        <BottomSheet visible={visible} onClose={onDismiss} title={displayTitle}>
            {message ? <Text style={[sheetStyles.message, { marginBottom: 24 }]}>{message}</Text> : null}
            <TouchableOpacity style={sheetStyles.primaryRow} onPress={onDismiss} activeOpacity={0.7}>
                <Text style={sheetStyles.primaryRowText}>{dismissLabel}</Text>
            </TouchableOpacity>
        </BottomSheet>
    );
}
