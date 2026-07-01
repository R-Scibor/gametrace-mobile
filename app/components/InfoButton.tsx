import { useState } from 'react';
import { Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { BottomSheet, sheetStyles } from './BottomSheet';
import { common } from '../theme/styles';
import { colors } from '../theme/colors';

// Small ⓘ glyph — outlined circle + dot/stem, matches the SVG icon set (TimeIcons).
function InfoGlyph({ color, size = 15 }: { color: string; size?: number }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
            <Circle cx="10" cy="10" r="7.5" stroke={color} strokeWidth={1.4} />
            <Circle cx="10" cy="6.4" r="1" fill={color} />
            <Path d="M10 9v5" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
        </Svg>
    );
}

// Self-contained info affordance: a muted ⓘ that opens a styled bottom sheet with
// explanatory copy. Owns its own open state so callers stay stateless.
export default function InfoButton({ title, body }: { title: string; body: string }) {
    const [open, setOpen] = useState(false);
    return (
        <>
            <TouchableOpacity
                onPress={() => setOpen(true)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                activeOpacity={0.6}
            >
                <InfoGlyph color={colors.text3} />
            </TouchableOpacity>
            <BottomSheet visible={open} onClose={() => setOpen(false)} title={title}>
                <Text style={sheetStyles.message}>{body}</Text>
                <TouchableOpacity
                    style={[sheetStyles.row, sheetStyles.rowLast]}
                    onPress={() => setOpen(false)}
                    activeOpacity={0.7}
                >
                    <Text style={[sheetStyles.rowText, sheetStyles.rowMuted]}>ROZUMIEM</Text>
                </TouchableOpacity>
            </BottomSheet>
        </>
    );
}

// Sub-label (common.label) paired with an InfoButton. The row carries the label's
// vertical spacing so the icon centers on the glyphs instead of the margins.
export function InfoLabel({ label, title, body }: { label: string; title?: string; body: string }) {
    return (
        <View style={styles.row}>
            <Text style={[common.label, styles.labelReset]}>{label}</Text>
            <InfoButton title={title ?? label} body={body} />
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        marginTop: 20, marginBottom: 8,
    },
    labelReset: { marginTop: 0, marginBottom: 0 },
});
