import { useMemo, useRef, useState } from 'react';
import {
    View, Text, TouchableOpacity, ScrollView, StyleSheet,
    NativeSyntheticEvent, NativeScrollEvent,
} from 'react-native';
import { BottomSheet } from './BottomSheet';
import { colors } from '../theme/colors';
import { displayFont, bodyFont } from '../theme/fonts';
import {
    buildMonthMatrix, combineDateTime, snapIndex, hourOptions, minuteOptions,
} from './dateTime';

const MINUTE_STEP = 1;
const WEEKDAYS = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'];
const MONTHS = [
    'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
    'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień',
];

const ITEM_H = 40;
const VISIBLE = 3; // odd, so one row sits centered under the band

const pad2 = (v: number) => String(v).padStart(2, '0');

type Props = {
    visible: boolean;
    value: Date | null;
    onConfirm: (d: Date) => void;
    onCancel: () => void;
};

function seedDraft(value: Date | null) {
    const b = value ?? new Date();
    return {
        year: b.getFullYear(),
        month: b.getMonth(),
        day: b.getDate(),
        hours: b.getHours(),
        minutes: Math.min(60 - MINUTE_STEP, Math.round(b.getMinutes() / MINUTE_STEP) * MINUTE_STEP),
    };
}

export default function DateTimeSheet({ visible, value, onConfirm, onCancel }: Props) {
    return (
        <BottomSheet visible={visible} onClose={onCancel} title="WYBIERZ DATĘ">
            {/* Mount fresh each open so the draft re-seeds from the current value. */}
            {visible && <DateTimeSheetBody value={value} onConfirm={onConfirm} onCancel={onCancel} />}
        </BottomSheet>
    );
}

// The sheet's content, free of the Modal wrapper so it can be rendered and
// tested directly (RN Modal breaks the test renderer in this environment).
export function DateTimeSheetBody({ value, onConfirm, onCancel }: Omit<Props, 'visible'>) {
    const seeded = useMemo(() => seedDraft(value), []); // mount-only seed
    const [year, setYear] = useState(seeded.year);
    const [month, setMonth] = useState(seeded.month);
    const [day, setDay] = useState(seeded.day);
    const [hours, setHours] = useState(seeded.hours);
    const [minutes, setMinutes] = useState(seeded.minutes);

    const goPrev = () => {
        if (month === 0) { setMonth(11); setYear(year - 1); } else setMonth(month - 1);
    };
    const goNext = () => {
        if (month === 11) { setMonth(0); setYear(year + 1); } else setMonth(month + 1);
    };

    const confirm = () => onConfirm(combineDateTime(year, month, day, hours, minutes));

    return (
        <>
            <View style={styles.monthNav}>
                <TouchableOpacity onPress={goPrev} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Text style={styles.navArrow}>‹</Text>
                </TouchableOpacity>
                <Text style={styles.monthLabel}>{`${MONTHS[month]} ${year}`}</Text>
                <TouchableOpacity onPress={goNext} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Text style={styles.navArrow}>›</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.weekRow}>
                {WEEKDAYS.map((w) => (
                    <View key={w} style={styles.dayCell}>
                        <Text style={styles.weekdayText}>{w}</Text>
                    </View>
                ))}
            </View>

            <MonthGrid year={year} month={month} day={day} onPick={setDay} />

            <View style={styles.divider} />
            <Text style={styles.sectionLabel}>GODZINA</Text>
            <View style={styles.timeRow}>
                <WheelColumn testID="wheel-hours" values={hourOptions()} selected={hours} onSelect={setHours} format={pad2} />
                <Text style={styles.colon}>:</Text>
                <WheelColumn testID="wheel-minutes" values={minuteOptions(MINUTE_STEP)} selected={minutes} onSelect={setMinutes} format={pad2} />
            </View>
            <View style={styles.divider} />

            <View style={styles.actions}>
                <TouchableOpacity style={[styles.btn, styles.btnCancel]} onPress={onCancel} activeOpacity={0.8}>
                    <Text style={styles.btnCancelText}>Anuluj</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btn, styles.btnConfirm]} onPress={confirm} activeOpacity={0.85}>
                    <Text style={styles.btnConfirmText}>Potwierdź</Text>
                </TouchableOpacity>
            </View>
        </>
    );
}

function MonthGrid({ year, month, day, onPick }: {
    year: number; month: number; day: number; onPick: (d: number) => void;
}) {
    const matrix = useMemo(() => buildMonthMatrix(year, month), [year, month]);
    const today = new Date();
    const isToday = (d: number) =>
        today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;

    return (
        <View>
            {matrix.map((row, ri) => (
                <View key={ri} style={styles.weekRow}>
                    {row.map((d, ci) => {
                        if (d === null) return <View key={ci} style={styles.dayCell} />;
                        const sel = d === day;
                        return (
                            <TouchableOpacity
                                key={ci}
                                testID={`day-${d}`}
                                style={[styles.dayCell, sel && styles.daySelected, !sel && isToday(d) && styles.dayToday]}
                                onPress={() => onPick(d)}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.dayText, sel && styles.dayTextSelected]}>{d}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            ))}
        </View>
    );
}

function WheelColumn({ testID, values, selected, onSelect, format }: {
    testID: string; values: number[]; selected: number; onSelect: (v: number) => void; format: (v: number) => string;
}) {
    const ref = useRef<ScrollView>(null);
    const pad = ((VISIBLE - 1) / 2) * ITEM_H;
    const index = Math.max(0, values.indexOf(selected));

    const onLayout = () => ref.current?.scrollTo?.({ y: index * ITEM_H, animated: false });

    const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const v = values[snapIndex(e.nativeEvent.contentOffset.y, ITEM_H, values.length)];
        if (v !== selected) onSelect(v);
    };

    return (
        <View style={styles.wheel}>
            <View pointerEvents="none" style={styles.wheelBand} />
            <ScrollView
                ref={ref}
                testID={testID}
                style={styles.wheelScroll}
                showsVerticalScrollIndicator={false}
                snapToInterval={ITEM_H}
                decelerationRate="fast"
                onLayout={onLayout}
                onMomentumScrollEnd={onMomentumEnd}
                contentContainerStyle={{ paddingVertical: pad }}
            >
                {values.map((v) => (
                    <View key={v} style={styles.wheelItem}>
                        <Text style={[styles.wheelText, v === selected && styles.wheelTextSelected]}>{format(v)}</Text>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    monthNav: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingVertical: 6, marginBottom: 4,
    },
    navArrow: { fontFamily: displayFont.bold, fontSize: 22, color: colors.orange, paddingHorizontal: 10 },
    monthLabel: { fontFamily: displayFont.bold, fontSize: 15, letterSpacing: 1, color: colors.text },

    weekRow: { flexDirection: 'row' },
    dayCell: {
        flex: 1, height: 38, alignItems: 'center', justifyContent: 'center',
        borderRadius: 2, margin: 1,
    },
    weekdayText: { fontFamily: displayFont.bold, fontSize: 10, letterSpacing: 1, color: colors.text3 },
    dayText: { fontFamily: bodyFont.regular, fontSize: 14, color: colors.text },
    dayTextSelected: { color: colors.buttonTextOnOrange, fontFamily: bodyFont.medium },
    daySelected: { backgroundColor: colors.orange },
    dayToday: { borderWidth: 1, borderColor: colors.borderBright },

    divider: { height: 1, backgroundColor: colors.border, marginVertical: 14 },
    sectionLabel: {
        fontFamily: displayFont.bold, fontSize: 11, letterSpacing: 2,
        color: colors.text3, marginBottom: 8,
    },
    timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    colon: { fontFamily: displayFont.bold, fontSize: 22, color: colors.text2, marginHorizontal: 14 },

    wheel: { width: 70, height: VISIBLE * ITEM_H, overflow: 'hidden' },
    wheelScroll: { height: VISIBLE * ITEM_H },
    wheelBand: {
        position: 'absolute', top: ((VISIBLE - 1) / 2) * ITEM_H, left: 0, right: 0,
        height: ITEM_H, backgroundColor: colors.orangeGlow, borderRadius: 2,
    },
    wheelItem: { height: ITEM_H, alignItems: 'center', justifyContent: 'center' },
    wheelText: { fontFamily: bodyFont.regular, fontSize: 20, color: colors.text3 },
    wheelTextSelected: { color: colors.text, fontFamily: displayFont.bold },

    actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
    btn: { flex: 1, borderRadius: 2, paddingVertical: 14, alignItems: 'center' },
    btnConfirm: { backgroundColor: colors.orange },
    btnConfirmText: {
        fontFamily: displayFont.bold, fontSize: 13, letterSpacing: 2, color: colors.buttonTextOnOrange,
    },
    btnCancel: { borderWidth: 1, borderColor: colors.borderBright },
    btnCancelText: {
        fontFamily: displayFont.bold, fontSize: 13, letterSpacing: 2, color: colors.text3,
    },
});
