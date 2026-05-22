import { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useVoiceRecord } from '../hooks/useVoiceRecord';
import { transcribeAudio } from '../api/voice';
import { resolveGame } from '../api/games';
import { colors } from '../theme/colors';
import { displayFont, bodyFont } from '../theme/fonts';
import { common } from '../theme/styles';

const BAR_COUNT = 9;

function formatElapsed(s: number) {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const r = (s % 60).toString().padStart(2, '0');
    return `${m}:${r}`;
}

export default function VoiceScreen() {
    const navigation = useNavigation<any>();
    const { isRecording, start, stop } = useVoiceRecord();
    const [processing, setProcessing] = useState(false);
    const [elapsed, setElapsed] = useState(0);

    const pulse = useRef(new Animated.Value(0)).current;
    const bars = useRef(Array.from({ length: BAR_COUNT }, () => new Animated.Value(0.2))).current;
    const sweep = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (!isRecording) {
            pulse.setValue(0);
            bars.forEach(b => b.setValue(0.2));
            setElapsed(0);
            return;
        }

        const pulseLoop = Animated.loop(Animated.sequence([
            Animated.timing(pulse, { toValue: 1, duration: 1100, easing: Easing.out(Easing.quad), useNativeDriver: true }),
            Animated.timing(pulse, { toValue: 0, duration: 0, useNativeDriver: true }),
        ]));
        pulseLoop.start();

        const barLoops = bars.map((bar, i) => Animated.loop(Animated.sequence([
            Animated.timing(bar, { toValue: 0.4 + Math.random() * 0.6, duration: 180 + i * 30, useNativeDriver: false }),
            Animated.timing(bar, { toValue: 0.2 + Math.random() * 0.4, duration: 220 + i * 20, useNativeDriver: false }),
        ])));
        barLoops.forEach(a => a.start());

        const t = setInterval(() => setElapsed(e => e + 1), 1000);
        return () => {
            pulseLoop.stop();
            barLoops.forEach(a => a.stop());
            clearInterval(t);
        };
    }, [isRecording]);

    useEffect(() => {
        if (!processing) return;
        const loop = Animated.loop(Animated.timing(sweep, {
            toValue: 1, duration: 1200, easing: Easing.linear, useNativeDriver: true,
        }));
        loop.start();
        return () => { loop.stop(); sweep.setValue(0); };
    }, [processing]);

    const handlePress = async () => {
        if (processing) return;

        if (!isRecording) {
            try {
                await start();
            } catch (e: any) {
                if (e?.message === 'PERMISSION_DENIED') {
                    Alert.alert('Brak dostępu', 'Zezwól na mikrofon w ustawieniach.');
                } else {
                    Alert.alert('Błąd', 'Nagrywanie nie powiodło się.');
                }
            }
            return;
        }

        let uri: string;
        try {
            uri = await stop();
        } catch {
            Alert.alert('Błąd', 'Nagrywanie nie powiodło się.');
            return;
        }

        setProcessing(true);
        try {
            const result = await transcribeAudio(uri);
            const match = result.game ? await resolveGame(result.game) : null;
            navigation.navigate('Main', {
                screen: 'AddSession',
                params: {
                    gameId: match?.game_id,
                    date: result.date,
                    startTime: result.start_time,
                    endTime: result.end_time,
                    note: result.raw_transcript,
                },
            });
        } catch (e: any) {
            console.log('transcribe failed', e?.response?.status, e?.response?.data, e?.message);
            const detail = e?.response?.data?.detail;
            const msg = typeof detail === 'string' ? detail : 'Nie udało się wysłać nagrania.';
            Alert.alert('Błąd', msg);
        } finally {
            setProcessing(false);
        }
    };

    const status = processing ? 'PRZETWARZANIE' : isRecording ? 'NAGRYWANIE' : 'GOTOWY';
    const statusColor = processing ? colors.warn : isRecording ? colors.orange : colors.text2;
    const cta = processing ? 'ANALIZA NAGRANIA...' : isRecording ? 'ZATRZYMAJ' : 'ROZPOCZNIJ NAGRYWANIE';

    return (
        <SafeAreaView style={common.safe} edges={['top']}>
            <View style={styles.content}>

                {/* Header */}
                <View style={styles.header}>
                    <View style={common.headerTop}>
                        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
                            <Text style={common.back}>← COFNIJ</Text>
                        </TouchableOpacity>
                        <Text style={common.eyebrow}>◈ GAMETRACE</Text>
                    </View>
                    <Text style={common.title}>Sesja głosowa</Text>
                </View>

                {/* Status strip */}
                <View style={styles.statusRow}>
                    <Text style={styles.statusLabel}>STATUS</Text>
                    <View style={styles.statusDivider} />
                    <Text style={[styles.statusValue, { color: statusColor }]}>{status}</Text>
                    {isRecording && <Text style={styles.statusElapsed}>{formatElapsed(elapsed)}</Text>}
                </View>

                {/* Hero record control */}
                <View style={styles.hero}>
                    {isRecording && (
                        <Animated.View
                            pointerEvents="none"
                            style={[styles.pulseRing, {
                                opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] }),
                                transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.45] }) }],
                            }]}
                        />
                    )}

                    <TouchableOpacity
                        style={[styles.recordButton, isRecording && styles.recordButtonActive]}
                        onPress={handlePress}
                        disabled={processing}
                        activeOpacity={0.85}
                    >
                        <View style={styles.recHeader}>
                            <View style={[styles.recDot, isRecording && styles.recDotActive]} />
                            <Text style={[styles.recLabel, isRecording && styles.recLabelActive]}>
                                {isRecording ? 'REC' : 'MIC'}
                            </Text>
                        </View>

                        <View style={styles.waveform}>
                            {bars.map((bar, i) => (
                                <Animated.View
                                    key={i}
                                    style={[styles.bar, {
                                        backgroundColor: isRecording ? colors.orange : colors.borderBright,
                                        height: bar.interpolate({ inputRange: [0, 1], outputRange: [4, 38] }),
                                    }]}
                                />
                            ))}
                        </View>

                        <Text style={styles.recHint}>{isRecording ? 'TRWA' : 'NACIŚNIJ'}</Text>
                    </TouchableOpacity>
                </View>

                {/* CTA label */}
                <Text style={[styles.cta, processing && { color: colors.warn }]}>{cta}</Text>

                {/* Processing sweep */}
                <View style={styles.sweepTrack}>
                    {processing && (
                        <Animated.View
                            style={[styles.sweepBar, {
                                transform: [{ translateX: sweep.interpolate({ inputRange: [0, 1], outputRange: [-80, 320] }) }],
                            }]}
                        />
                    )}
                </View>

                {/* Hint block */}
                <View style={styles.hintBlock}>
                    <View style={common.orangeBar} />
                    <View style={styles.hintBody}>
                        <Text style={styles.hintLabel}>PRZYKŁAD</Text>
                        <Text style={styles.hintText}>
                            „Grałem w Baldur's Gate od osiemnastej do dwudziestej drugiej."
                        </Text>
                    </View>
                </View>

                <Text style={styles.footer}>
                    Whisper rozpoznaje grę i wstępnie wypełnia formularz sesji.
                </Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    content: { flex: 1, paddingHorizontal: 20, paddingBottom: 40 },
    header: { paddingTop: 16, paddingBottom: 16 },

    statusRow: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingHorizontal: 12, paddingVertical: 10,
        backgroundColor: colors.bg2,
        borderWidth: 1, borderColor: colors.border,
        borderLeftWidth: 2, borderLeftColor: colors.orange,
    },
    statusLabel: {
        fontFamily: displayFont.bold, fontSize: 10, letterSpacing: 2.5, color: colors.text3,
    },
    statusDivider: { width: 1, height: 10, backgroundColor: colors.border },
    statusValue: {
        fontFamily: displayFont.bold, fontSize: 11, letterSpacing: 2,
    },
    statusElapsed: {
        marginLeft: 'auto',
        fontFamily: displayFont.bold, fontSize: 13, color: colors.orange, letterSpacing: 1,
    },

    hero: {
        alignItems: 'center', justifyContent: 'center',
        marginTop: 36, marginBottom: 20, height: 220,
    },
    pulseRing: {
        position: 'absolute', width: 180, height: 180, borderRadius: 90,
        borderWidth: 2, borderColor: colors.orange,
    },
    recordButton: {
        width: 180, height: 180, borderRadius: 90,
        backgroundColor: colors.bg2,
        borderWidth: 1.5, borderColor: colors.borderBright,
        alignItems: 'center', justifyContent: 'space-between',
        paddingVertical: 28,
    },
    recordButtonActive: {
        borderColor: colors.orange,
        backgroundColor: colors.bg3,
    },
    recHeader: { flexDirection: 'row', alignItems: 'center', gap: 7 },
    recDot: {
        width: 8, height: 8, borderRadius: 4, backgroundColor: colors.borderBright,
    },
    recDotActive: { backgroundColor: colors.orange },
    recLabel: {
        fontFamily: displayFont.bold, fontSize: 11, letterSpacing: 3, color: colors.text3,
    },
    recLabelActive: { color: colors.orange },

    waveform: {
        flexDirection: 'row', alignItems: 'center', gap: 4, height: 40,
    },
    bar: { width: 3, borderRadius: 1 },

    recHint: {
        fontFamily: displayFont.bold, fontSize: 10, letterSpacing: 2.5, color: colors.text3,
    },

    cta: {
        fontFamily: displayFont.bold, fontSize: 13, letterSpacing: 2.5,
        color: colors.text2, textAlign: 'center', marginBottom: 12,
    },

    sweepTrack: {
        height: 2, backgroundColor: colors.bg3,
        marginHorizontal: 40, overflow: 'hidden', marginBottom: 24,
    },
    sweepBar: { width: 80, height: 2, backgroundColor: colors.warn },

    hintBlock: {
        flexDirection: 'row',
        backgroundColor: colors.bg2,
        borderWidth: 1, borderColor: colors.border,
        marginTop: 12,
    },
    hintBody: { flex: 1, paddingHorizontal: 14, paddingVertical: 12 },
    hintLabel: {
        fontFamily: displayFont.bold, fontSize: 10, letterSpacing: 2.5,
        color: colors.text3, marginBottom: 6,
    },
    hintText: {
        fontFamily: bodyFont.regular, fontSize: 14, color: colors.text2,
        fontStyle: 'italic', lineHeight: 20,
    },

    footer: {
        marginTop: 18,
        fontFamily: bodyFont.regular, fontSize: 12, color: colors.text3,
        textAlign: 'center',
    },
});
