import { TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useReportStore } from '../store/reportStore';
import { colors } from '../theme/colors';

// Assumes the bottom tab bar is present; on tab-less pushed screens the FAB
// sits ~TAB_BAR_HEIGHT higher than strictly needed (acceptable dev-only tradeoff).
const TAB_BAR_HEIGHT = 72;

export default function ReportFab() {
    const { t } = useTranslation('report');
    const insets = useSafeAreaInsets();
    const open = useReportStore((s) => s.open);
    return (
        <TouchableOpacity
            style={[styles.fab, { bottom: insets.bottom + TAB_BAR_HEIGHT + 16 }]}
            onPress={open}
            activeOpacity={0.8}
            accessibilityLabel={t('fabA11y')}
        >
            {/* Solid red disc with a light warning triangle; evenodd cuts the
                exclamation so the red fill shows through it. */}
            <Svg width={26} height={26} viewBox="0 0 24 24" style={styles.glyph}>
                <Path
                    d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"
                    fill={colors.text}
                    fillRule="evenodd"
                />
            </Svg>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    fab: {
        position: 'absolute', right: 16, width: 54, height: 54, borderRadius: 27,
        backgroundColor: colors.danger, borderWidth: 2, borderColor: colors.text,
        alignItems: 'center', justifyContent: 'center',
    },
    // Nudge the triangle up so it reads optically centered (its visual mass
    // sits low relative to the geometric center).
    glyph: { marginBottom: 3 },
});
