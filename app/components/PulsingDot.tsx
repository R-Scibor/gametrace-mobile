import { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

const SIZE = 7;

export default function PulsingDot() {
    const progress = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const loop = Animated.loop(
            Animated.timing(progress, {
                toValue: 1,
                duration: 1600,
                useNativeDriver: true,
            }),
        );
        loop.start();
        return () => loop.stop();
    }, [progress]);

    const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [1, 2.6] });
    const opacity = progress.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] });

    return (
        <View style={styles.wrap}>
            <Animated.View style={[styles.halo, { transform: [{ scale }], opacity }]} />
            <View style={styles.dot} />
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: { width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' },
    halo: {
        position: 'absolute',
        width: SIZE, height: SIZE, borderRadius: SIZE / 2,
        backgroundColor: colors.orange,
    },
    dot: { width: SIZE, height: SIZE, borderRadius: SIZE / 2, backgroundColor: colors.orange },
});
