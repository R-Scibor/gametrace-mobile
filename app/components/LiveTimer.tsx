import { useEffect, useState } from 'react';
import { Text, TextStyle, StyleProp } from 'react-native';

type Props = {
    startIso: string;
    style?: StyleProp<TextStyle>;
};

const fmt = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
};

export default function LiveTimer({ startIso, style }: Props) {
    const start = new Date(startIso).getTime();
    const [now, setNow] = useState(Date.now());

    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(id);
    }, []);

    const elapsed = Math.max(0, Math.floor((now - start) / 1000));
    return <Text style={style}>{fmt(elapsed)}</Text>;
}
