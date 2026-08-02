import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { colors } from '../theme/colors';
import { displayFont, bodyFont } from '../theme/fonts';

// Logo + GameTrace wordmark + tagline + rule. The tagline differs per screen
// (setup form vs. first-run welcome), so it comes in as a prop.
export default function Wordmark({ tagline }: { tagline: string }) {
    return (
        <View style={styles.wordmark}>
            <Image
                source={require('../../assets/splash-icon.png')}
                style={styles.logo}
                contentFit="contain"
            />
            <Text style={styles.title}>
                Game<Text style={styles.titleAccent}>Trace</Text>
            </Text>
            <Text style={styles.tagline}>{tagline}</Text>
            <View style={styles.rule} />
        </View>
    );
}

const styles = StyleSheet.create({
    wordmark: { alignItems: 'center', marginBottom: 20 },
    logo: { width: 168, height: 168 },
    title: { fontFamily: displayFont.bold, fontSize: 38, letterSpacing: -1, color: colors.text, lineHeight: 38 },
    titleAccent: { color: colors.orange },
    tagline: { fontFamily: bodyFont.regular, fontSize: 12, letterSpacing: 1, color: colors.text3, marginTop: 8 },
    rule: { width: 40, height: 1, backgroundColor: colors.orange, marginTop: 16 },
});
