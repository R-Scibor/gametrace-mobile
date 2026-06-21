import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import DateTimeSheet from './DateTimeSheet';
import { colors } from '../theme/colors';
import { bodyFont } from '../theme/fonts';

type Props = {
    value: Date | null;
    onChange: (d: Date) => void;
    placeholder?: string;
};

export default function DateTimeField({ value, onChange, placeholder = 'Wybierz...' }: Props) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <TouchableOpacity style={styles.wrapper} onPress={() => setOpen(true)} activeOpacity={0.8}>
                <View style={styles.orangeBar} />
                <Text style={[styles.value, !value && styles.placeholder]}>
                    {value ? value.toLocaleString('pl') : placeholder}
                </Text>
            </TouchableOpacity>
            <DateTimeSheet
                visible={open}
                value={value}
                onConfirm={(d) => { onChange(d); setOpen(false); }}
                onCancel={() => setOpen(false)}
            />
        </>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        flexDirection: 'row',
        backgroundColor: colors.bg3,
        borderWidth: 1, borderColor: colors.borderBright,
        borderRadius: 2, overflow: 'hidden',
    },
    orangeBar: { width: 2, alignSelf: 'stretch', backgroundColor: colors.orange },
    value: {
        flex: 1, paddingHorizontal: 14, paddingVertical: 12,
        fontFamily: bodyFont.regular, fontSize: 15, color: colors.text,
    },
    placeholder: { color: colors.text3 },
});
