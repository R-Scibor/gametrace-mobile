import { useMemo, useRef, useState } from 'react';
import {
    View, Text, TouchableOpacity, ScrollView, StyleSheet,
    NativeSyntheticEvent, NativeScrollEvent, useWindowDimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { BottomSheet } from './BottomSheet';
import { colors } from '../theme/colors';
import { displayFont, bodyFont } from '../theme/fonts';
import {
    buildMonthMatrix, combineDateTime, snapIndex, hourOptions, minuteOptions,
} from './dateTime';

const MINUTE_STEP = 1;
const WEEKDAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

const VISIBLE = 3; // odd, so one row sits centered under the band

// Below this window height the sheet cannot fit its ~571dp of content plus
// BottomSheet chrome, so every vertical metric shrinks. Never solved with an
// outer ScrollView: the time wheels are ScrollViews and the parent would win
// the drag.
const COMPACT_BELOW_HEIGHT = 700;

const DEFAULT_METRICS = {
    dayCell: 38, itemH: 40, dividerMargin: 14, navPadding: 6, labelMargin: 8, actionPadding: 14,
};
const COMPACT_METRICS = {
    dayCell: 30, itemH: 32, dividerMargin: 8, navPadding: 3, labelMargin: 4, actionPadding: 10,
};

export type Metrics = typeof DEFAULT_METRICS;

export function pickMetrics(windowHeight: number): Metrics {
    return windowHeight < COMPACT_BELOW_HEIGHT ? COMPACT_METRICS : DEFAULT_METRICS;
}

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
    const { t } = useTranslation('datetime');
    return (
        <BottomSheet visible={visible} onClose={onCancel} title={t('title')}>
            {/* Mount fresh each open so the draft re-seeds from the current value. */}
            {visible && <DateTimeSheetBody value={value} onConfirm={onConfirm} onCancel={onCancel} />}
        </BottomSheet>
    );
}

// The sheet's content, free of the Modal wrapper so it can be rendered and
// tested directly (RN Modal breaks the test renderer in this environment).
export function DateTimeSheetBody({ value, onConfirm, onCancel }: Omit<Props, 'visible'>) {
    const { t } = useTranslation('datetime');
    const { height } = useWindowDimensions();
    const m = pickMetrics(height);
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
            <View style={[styles.monthNav, { paddingVertical: m.navPadding }]}>
                <TouchableOpacity onPress={goPrev} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Text style={styles.navArrow}>‹</Text>
                </TouchableOpacity>
                <Text style={styles.monthLabel}>{`${t(`months.${month}`)} ${year}`}</Text>
                <TouchableOpacity onPress={goNext} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Text style={styles.navArrow}>›</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.weekRow}>
                {WEEKDAY_KEYS.map((key) => (
                    <View key={key} style={[styles.dayCell, { height: m.dayCell }]}>
                        <Text style={styles.weekdayText}>{t(`weekdays.${key}`)}</Text>
                    </View>
                ))}
            </View>

            <MonthGrid year={year} month={month} day={day} onPick={setDay} metrics={m} />

            <View style={[styles.divider, { marginVertical: m.dividerMargin }]} />
            <Text style={[styles.sectionLabel, { marginBottom: m.labelMargin }]}>{t('timeLabel')}</Text>
            <View style={styles.timeRow}>
                <WheelColumn testID="wheel-hours" values={hourOptions()} selected={hours} onSelect={setHours} format={pad2} itemHeight={m.itemH} />
                <Text style={styles.colon}>:</Text>
                <WheelColumn testID="wheel-minutes" values={minuteOptions(MINUTE_STEP)} selected={minutes} onSelect={setMinutes} format={pad2} itemHeight={m.itemH} />
            </View>
            <View style={[styles.divider, { marginVertical: m.dividerMargin }]} />

            <View style={styles.actions}>
                <TouchableOpacity style={[styles.btn, styles.btnCancel, { paddingVertical: m.actionPadding }]} onPress={onCancel} activeOpacity={0.8}>
                    <Text style={styles.btnCancelText}>{t('cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btn, styles.btnConfirm, { paddingVertical: m.actionPadding }]} onPress={confirm} activeOpacity={0.85}>
                    <Text style={styles.btnConfirmText}>{t('confirm')}</Text>
                </TouchableOpacity>
            </View>
        </>
    );
}

function MonthGrid({ year, month, day, onPick, metrics }: {
    year: number; month: number; day: number; onPick: (d: number) => void; metrics: Metrics;
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
                        if (d === null) return <View key={ci} style={[styles.dayCell, { height: metrics.dayCell }]} />;
                        const sel = d === day;
                        return (
                            <TouchableOpacity
                                key={ci}
                                testID={`day-${d}`}
                                style={[styles.dayCell, { height: metrics.dayCell }, sel && styles.daySelected, !sel && isToday(d) && styles.dayToday]}
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

function WheelColumn({ testID, values, selected, onSelect, format, itemHeight }: {
    testID: string; values: number[]; selected: number; onSelect: (v: number) => void; format: (v: number) => string; itemHeight: number;
}) {
    const ref = useRef<ScrollView>(null);
    const pad = ((VISIBLE - 1) / 2) * itemHeight;
    const index = Math.max(0, values.indexOf(selected));
    const wheelHeight = VISIBLE * itemHeight;

    const onLayout = () => ref.current?.scrollTo?.({ y: index * itemHeight, animated: false });

    const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const v = values[snapIndex(e.nativeEvent.contentOffset.y, itemHeight, values.length)];
        if (v !== selected) onSelect(v);
    };

    return (
        <View style={[styles.wheel, { height: wheelHeight }]}>
            <View pointerEvents="none" style={[styles.wheelBand, { top: pad, height: itemHeight }]} />
            <ScrollView
                ref={ref}
                testID={testID}
                style={{ height: wheelHeight }}
                showsVerticalScrollIndicator={false}
                snapToInterval={itemHeight}
                decelerationRate="fast"
                onLayout={onLayout}
                onMomentumScrollEnd={onMomentumEnd}
                contentContainerStyle={{ paddingVertical: pad }}
            >
                {values.map((v) => (
                    <View key={v} style={[styles.wheelItem, { height: itemHeight }]}>
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
        marginBottom: 4,
    },
    navArrow: { fontFamily: displayFont.bold, fontSize: 22, color: colors.orange, paddingHorizontal: 10 },
    monthLabel: { fontFamily: displayFont.bold, fontSize: 15, letterSpacing: 1, color: colors.text },

    weekRow: { flexDirection: 'row' },
    dayCell: {
        flex: 1, alignItems: 'center', justifyContent: 'center',
        borderRadius: 2, margin: 1,
    },
    weekdayText: { fontFamily: displayFont.bold, fontSize: 10, letterSpacing: 1, color: colors.text3 },
    dayText: { fontFamily: bodyFont.regular, fontSize: 14, color: colors.text },
    dayTextSelected: { color: colors.buttonTextOnOrange, fontFamily: bodyFont.medium },
    daySelected: { backgroundColor: colors.orange },
    dayToday: { borderWidth: 1, borderColor: colors.borderBright },

    divider: { height: 1, backgroundColor: colors.border },
    sectionLabel: {
        fontFamily: displayFont.bold, fontSize: 11, letterSpacing: 2,
        color: colors.text3,
    },
    timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    colon: { fontFamily: displayFont.bold, fontSize: 22, color: colors.text2, marginHorizontal: 14 },

    wheel: { width: 70, overflow: 'hidden' },
    wheelBand: {
        position: 'absolute', left: 0, right: 0,
        backgroundColor: colors.orangeGlow, borderRadius: 2,
    },
    wheelItem: { alignItems: 'center', justifyContent: 'center' },
    wheelText: { fontFamily: bodyFont.regular, fontSize: 20, color: colors.text3 },
    wheelTextSelected: { color: colors.text, fontFamily: displayFont.bold },

    actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
    btn: { flex: 1, borderRadius: 2, alignItems: 'center' },
    btnConfirm: { backgroundColor: colors.orange },
    btnConfirmText: {
        fontFamily: displayFont.bold, fontSize: 13, letterSpacing: 2, color: colors.buttonTextOnOrange,
    },
    btnCancel: { borderWidth: 1, borderColor: colors.borderBright },
    btnCancelText: {
        fontFamily: displayFont.bold, fontSize: 13, letterSpacing: 2, color: colors.text3,
    },
});
