import { useState } from 'react';
import { Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

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
            <TouchableOpacity style={styles.input} onPress={open}>
                <Text>{value ? value.toLocaleString() : placeholder}</Text>
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
    input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12 },
});
