import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Modal, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAllZones } from '../utils/timezones';
import { colors } from '../theme/colors';
import { bodyFont, displayFont } from '../theme/fonts';
import { common } from '../theme/styles';

interface TimezonePickerProps {
    visible: boolean;
    currentValue: string;
    onSelect: (zone: string) => void;
    onClose: () => void;
}

export default function TimezonePicker({ visible, currentValue, onSelect, onClose }: TimezonePickerProps) {
    const [search, setSearch] = useState('');
    const allZones = useMemo(() => getAllZones(), []);

    const filteredZones = search.trim()
        ? allZones.filter(z => z.toLowerCase().includes(search.toLowerCase()))
        : allZones;

    const handleSelect = (z: string) => {
        onSelect(z);
        setSearch('');
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            onRequestClose={onClose}
        >
            <SafeAreaView style={common.safe} edges={['top', 'bottom']}>
                <View style={styles.modalHeader}>
                    <TouchableOpacity onPress={onClose} hitSlop={12}>
                        <Text style={styles.back}>← ZAMKNIJ</Text>
                    </TouchableOpacity>
                    <Text style={common.title}>Strefa czasowa</Text>
                </View>

                <View style={styles.modalSearch}>
                    <View style={common.inputWrapper}>
                        <View style={common.orangeBar} />
                        <TextInput
                            style={common.input}
                            placeholder="Szukaj..."
                            placeholderTextColor={colors.text3}
                            value={search}
                            onChangeText={setSearch}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                    </View>
                </View>

                <FlatList
                    data={filteredZones}
                    keyExtractor={z => z}
                    keyboardShouldPersistTaps="handled"
                    renderItem={({ item }) => {
                        const selected = item === currentValue;
                        return (
                            <TouchableOpacity
                                style={styles.tzRow}
                                onPress={() => handleSelect(item)}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.tzText, selected && styles.tzTextSelected]}>
                                    {item}
                                </Text>
                                {selected && <Text style={styles.tzCheck}>✓</Text>}
                            </TouchableOpacity>
                        );
                    }}
                />
            </SafeAreaView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalHeader: { paddingTop: 16, paddingBottom: 20, paddingHorizontal: 20, gap: 12 },
    back: { fontFamily: displayFont.bold, fontSize: 11, letterSpacing: 2, color: colors.text3 },
    modalSearch: { paddingHorizontal: 20, paddingBottom: 12 },

    tzRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingVertical: 14,
        borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    tzText: { fontFamily: bodyFont.regular, fontSize: 15, color: colors.text },
    tzTextSelected: { color: colors.orange, fontFamily: bodyFont.medium },
    tzCheck: { fontFamily: displayFont.bold, fontSize: 14, color: colors.orange },
});
