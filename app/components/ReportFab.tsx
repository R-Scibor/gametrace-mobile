import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useReportStore } from '../store/reportStore';
import { colors } from '../theme/colors';
import { displayFont } from '../theme/fonts';

// Assumes the bottom tab bar is present; on tab-less pushed screens the FAB
// sits ~TAB_BAR_HEIGHT higher than strictly needed (acceptable dev-only tradeoff).
const TAB_BAR_HEIGHT = 72;

export default function ReportFab() {
    const insets = useSafeAreaInsets();
    const open = useReportStore((s) => s.open);
    return (
        <TouchableOpacity
            style={[styles.fab, { bottom: insets.bottom + TAB_BAR_HEIGHT + 16 }]}
            onPress={open}
            activeOpacity={0.8}
            accessibilityLabel="Wyślij opinię"
        >
            <Text style={styles.glyph}>✎</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    fab: {
        position: 'absolute', right: 16, width: 52, height: 52, borderRadius: 26,
        backgroundColor: colors.bg2, borderWidth: 1, borderColor: colors.borderBright,
        alignItems: 'center', justifyContent: 'center', opacity: 0.92,
    },
    glyph: { fontFamily: displayFont.bold, fontSize: 20, color: colors.orange },
});
