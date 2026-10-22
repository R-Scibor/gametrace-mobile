import { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { FALLBACK_ZONES, getAllZones } from '../utils/timezones';
import { colors } from '../theme/colors';
import { bodyFont, displayFont } from '../theme/fonts';
import { common } from '../theme/styles';

type Props = {
    value: string;
    onSelect: (zone: string) => void;
};

function zoneLabel(zone: string): string {
    return zone.replace(/_/g, ' ');
}

function matches(zone: string, query: string): boolean {
    const needle = query.trim().toLowerCase();
    return zone.toLowerCase().includes(needle) || zoneLabel(zone).toLowerCase().includes(needle);
}

export default function TimezonePicker({ value, onSelect }: Props) {
    const { t } = useTranslation('settings');
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const allZones = useMemo(() => getAllZones(), []);

    const trimmed = query.trim();
    const zones = useMemo(() => {
        if (!trimmed) {
            const common = FALLBACK_ZONES.includes(value) ? FALLBACK_ZONES : [value, ...FALLBACK_ZONES];
            return common;
        }
        return allZones.filter((zone) => matches(zone, trimmed));
    }, [allZones, trimmed, value]);

    const close = () => {
        setOpen(false);
        setQuery('');
    };

    const choose = (zone: string) => {
        if (zone !== value) onSelect(zone);
        close();
    };

    if (!open) {
        return (
            <TouchableOpacity
                testID="timezone-chip"
                style={styles.chip}
                onPress={() => setOpen(true)}
                activeOpacity={0.8}
            >
                <View style={styles.chipRule} />
                <Text style={styles.chipName} numberOfLines={1}>{zoneLabel(value)}</Text>
                <Text style={styles.chipAction}>{t('timezonePicker.change')}</Text>
            </TouchableOpacity>
        );
    }

    return (
        <View>
            <View style={common.inputWrapper}>
                <View style={common.orangeBar} />
                <TextInput
                    testID="timezone-search"
                    style={common.input}
                    placeholder={t('timezonePicker.search')}
                    placeholderTextColor={colors.text3}
                    value={query}
                    onChangeText={setQuery}
                    autoFocus
                    autoCapitalize="none"
                    autoCorrect={false}
                />
            </View>

            <View style={styles.dropdown}>
                <ScrollView style={styles.list} keyboardShouldPersistTaps="handled" nestedScrollEnabled>
                    {!trimmed && <Text style={styles.groupHeader}>{t('timezonePicker.groupCommon')}</Text>}
                    {zones.map((zone) => {
                        const selected = zone === value;
                        return (
                            <TouchableOpacity
                                key={zone}
                                style={styles.row}
                                activeOpacity={0.7}
                                onPress={() => choose(zone)}
                            >
                                <Text style={[styles.rowText, selected && styles.rowTextSelected]} numberOfLines={1}>
                                    {zoneLabel(zone)}
                                </Text>
                                {selected && <Text style={styles.check}>✓</Text>}
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
                {trimmed.length > 0 && zones.length === 0 && (
                    <Text style={styles.status}>{t('timezonePicker.noResults')}</Text>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    chip: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: colors.bg2,
        borderWidth: 1, borderColor: colors.border,
        borderRadius: 2, overflow: 'hidden',
    },
    chipRule: { width: 2, alignSelf: 'stretch', backgroundColor: colors.orange },
    chipName: {
        flex: 1, paddingHorizontal: 14, paddingVertical: 12,
        fontFamily: bodyFont.medium, fontSize: 15, color: colors.text,
    },
    chipAction: {
        fontFamily: displayFont.regular, fontSize: 11, letterSpacing: 1,
        color: colors.text3, paddingRight: 14,
    },
    dropdown: {
        marginTop: 2,
        backgroundColor: colors.bg2,
        borderWidth: 1, borderColor: colors.border,
        borderRadius: 2,
    },
    list: { maxHeight: 260 },
    groupHeader: {
        fontFamily: displayFont.bold, fontSize: 10, letterSpacing: 2.5,
        color: colors.text3, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 6,
    },
    row: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 14, paddingVertical: 12,
    },
    rowText: { flex: 1, fontFamily: bodyFont.regular, fontSize: 15, color: colors.text },
    rowTextSelected: { color: colors.orange, fontFamily: bodyFont.medium },
    check: { fontFamily: displayFont.bold, fontSize: 14, color: colors.orange, marginLeft: 8 },
    status: {
        fontFamily: bodyFont.regular, fontSize: 13, color: colors.text3,
        paddingHorizontal: 14, paddingVertical: 12,
    },
});
