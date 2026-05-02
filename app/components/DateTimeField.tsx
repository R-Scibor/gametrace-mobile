import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors } from '../theme/colors';
import { bodyFont } from '../theme/fonts';

type Props = {
    value: Date | null;
    onChange: (d: Date) => void;
    placeholder?: string;
};

type Picker = { mode: 'date' | 'time' | 'datetime'; base?: Date };

export default function DateTimeField({ value, onChange, placeholder = 'Wybierz...' }: Props) {
    const [picker, setPicker] = useState<Picker | null>(null);

    const open = () => setPicker({ mode: Platform.OS === 'ios' ? 'datetime' : 'date' });

    return (
        <>
            <TouchableOpacity style={styles.wrapper} onPress={open} activeOpacity={0.8}>
                <View style={styles.orangeBar} />
                <Text style={[styles.value, !value && styles.placeholder]}>
                    {value ? value.toLocaleString('pl') : placeholder}
                </Text>
            </TouchableOpacity>
            {picker && (
                <DateTimePicker
                    value={picker.base ?? value ?? new Date()}
                    mode={picker.mode}
                    onChange={(event, d) => {
                        if (event.type === 'dismissed' || !d) { setPicker(null); return; }
                        if (picker.mode === 'date') {
                            setPicker({ mode: 'time', base: d });
                            return;
                        }
                        if (picker.mode === 'time') {
                            const combined = new Date(picker.base ?? new Date());
                            combined.setHours(d.getHours(), d.getMinutes(), 0, 0);
                            onChange(combined);
                        } else {
                            onChange(d);
                        }
                        setPicker(null);
                    }}
                />
            )}
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
