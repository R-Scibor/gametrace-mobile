import { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, Image } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { getGameSessions, getGames, mergeGame } from '../api/games';
import { Session, Game } from '../types/api';

export default function GameDetailScreen() {
    const route = useRoute<any>();
    const navigation = useNavigation<any>();
    const { gameId, gameName, showMerge } = route.params;

    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(false);

    const [mergeQuery, setMergeQuery] = useState('');
    const [mergeResults, setMergeResults] = useState<Game[]>([]);

    const load = async () => {
        if (loading) return;
        setLoading(true);
        try {
            const all: Session[] = [];
            const PAGE = 100;
            while (true) {
                const page = await getGameSessions(gameId, all.length, PAGE);
                all.push(...page);
                if (page.length < PAGE) break;
            }
            setSessions(all);
        } catch {
            // TODO
        }
        setLoading(false);
    };

    useEffect(() => {
        navigation.setOptions({ title: gameName });
        load();
    }, []);

    const searchMergeTarget = async () => {
        try {
            const data = await getGames(0, 20);
            setMergeResults(data.filter(g =>
                g.primary_name.toLowerCase().includes(mergeQuery.toLowerCase()) && g.id !== gameId
            ));
        } catch {
            // TODO
        }
    };

    const handleMerge = async (targetId: number) => {
        try {
            await mergeGame(gameId, targetId);
            navigation.goBack();
        } catch {
            // TODO
        }
    };

    const formatSession = (s: Session) => {
        const start = new Date(s.start_time).toLocaleString();
        const duration = s.duration_seconds
            ? `${Math.round(s.duration_seconds / 60)} min`
            : '—';
        return `${start} · ${duration} · ${s.status}`;
    };

    const formatHM = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.round((seconds % 3600) / 60);
        return h > 0 ? `${h}h ${m}m` : `${m}m`;
    };

    const completed = sessions.filter(s => s.duration_seconds);
    const totalSeconds = completed.reduce((sum, s) => sum + (s.duration_seconds || 0), 0);
    const avgSeconds = completed.length ? Math.round(totalSeconds / completed.length) : 0;
    const cover = sessions[0]?.game?.cover_image_url ?? null;

    const header = (
        <View>
            {showMerge && (
                <View style={styles.mergeBox}>
                    <Text style={styles.mergeTitle}>Połącz z istniejącą grą</Text>
                    <View style={styles.mergeRow}>
                        <TextInput
                            style={styles.mergeInput}
                            placeholder="Szukaj gry..."
                            value={mergeQuery}
                            onChangeText={setMergeQuery}
                        />
                        <TouchableOpacity style={styles.mergeSearchBtn} onPress={searchMergeTarget}>
                            <Text style={{ color: 'white' }}>Szukaj</Text>
                        </TouchableOpacity>
                    </View>
                    {mergeResults.map(game => (
                        <TouchableOpacity
                            key={game.id}
                            style={styles.mergeResult}
                            onPress={() => handleMerge(game.id)}
                        >
                            <Text>{game.primary_name}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            <View style={styles.coverWrap}>
                {cover ? (
                    <Image source={{ uri: cover }} style={styles.cover} />
                ) : (
                    <View style={[styles.cover, styles.coverPlaceholder]}>
                        <Text style={styles.placeholderText}>{gameName?.[0] ?? '?'}</Text>
                    </View>
                )}
            </View>

            <View style={styles.statsRow}>
                <View style={styles.statCell}>
                    <Text style={styles.statValue}>{sessions.length}</Text>
                    <Text style={styles.statLabel}>Sesje</Text>
                </View>
                <View style={styles.statCell}>
                    <Text style={styles.statValue}>{formatHM(totalSeconds)}</Text>
                    <Text style={styles.statLabel}>Łącznie</Text>
                </View>
                <View style={styles.statCell}>
                    <Text style={styles.statValue}>{formatHM(avgSeconds)}</Text>
                    <Text style={styles.statLabel}>Średnio</Text>
                </View>
            </View>
        </View>
    );

    return (
        <FlatList
            style={styles.container}
            data={sessions}
            keyExtractor={(item) => item.id.toString()}
            ListHeaderComponent={header}
            renderItem={({ item }) => (
                <TouchableOpacity
                    style={styles.sessionRow}
                    onPress={() => navigation.navigate('EditSession', { sessionId: item.id, status: item.status })}
                >
                    <Text style={styles.sessionText}>{formatSession(item)}</Text>
                    {item.notes && <Text style={styles.notes}>{item.notes}</Text>}
                </TouchableOpacity>
            )}
        />
    );
}

const COVER_WIDTH = 264 
const COVER_HEIGHT = 362  

const styles = StyleSheet.create({
    container: { flex: 1 },
    mergeBox: { padding: 16, backgroundColor: '#fff3cd', borderBottomWidth: 1, borderColor: '#eee' },
    mergeTitle: { fontWeight: '600', marginBottom: 8 },
    mergeRow: { flexDirection: 'row', gap: 8 },
    mergeInput: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8 },
    mergeSearchBtn: { backgroundColor: '#5865F2', padding: 8, borderRadius: 8, justifyContent: 'center' },
    mergeResult: { padding: 12, borderBottomWidth: 1, borderColor: '#eee' },
    coverWrap: { alignItems: 'center', paddingTop: 24, paddingBottom: 16 },
    cover: { width: COVER_WIDTH, height: COVER_HEIGHT, borderRadius: 12, backgroundColor: '#eee' },
    coverPlaceholder: { alignItems: 'center', justifyContent: 'center' },
    placeholderText: { fontSize: 48, color: '#999' },
    statsRow: { flexDirection: 'row', paddingVertical: 16, borderBottomWidth: 1, borderColor: '#f0f0f0' },
    statCell: { flex: 1, alignItems: 'center' },
    statValue: { fontSize: 18, fontWeight: '600' },
    statLabel: { fontSize: 12, color: '#718096', marginTop: 2 },
    sessionRow: { padding: 16, borderBottomWidth: 1, borderColor: '#f0f0f0' },
    sessionText: { fontSize: 14 },
    notes: { fontSize: 12, color: '#718096', marginTop: 4 },
});
