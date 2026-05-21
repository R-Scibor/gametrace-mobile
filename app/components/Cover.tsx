import { Image, View, Text, StyleSheet, ImageStyle, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { useLocalCoversStore } from '../store/localCoversStore';
import { colors } from '../theme/colors';
import { displayFont } from '../theme/fonts';

type Props = {
    gameId: number | null | undefined;
    fallbackUri: string | null | undefined;
    style?: StyleProp<ImageStyle>;
    placeholderStyle?: StyleProp<ViewStyle>;
    placeholderTextStyle?: StyleProp<TextStyle>;
    placeholderChar?: string;
};

export default function Cover({
    gameId,
    fallbackUri,
    style,
    placeholderStyle,
    placeholderTextStyle,
    placeholderChar,
}: Props) {
    const localUri = useLocalCoversStore((s) =>
        gameId != null ? s.covers[gameId] : undefined
    );
    const uri = localUri ?? fallbackUri ?? null;

    if (uri) {
        return <Image source={{ uri }} style={style} />;
    }
    return (
        <View style={[style, styles.placeholder, placeholderStyle]}>
            <Text style={[styles.placeholderText, placeholderTextStyle]}>
                {placeholderChar ?? '?'}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    placeholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg3 },
    placeholderText: { fontFamily: displayFont.bold, fontSize: 32, color: colors.text3 },
});
