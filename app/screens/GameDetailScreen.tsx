import { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { getGameSessions, getGames, mergeGame } from '../api/games';
import { Session, Game } from '../types/api';

const PAGE_SIZE = 20;

export default function GameDetailScreen() {
    const route = useRoute<any>();
    const navigation = useNavigation<any>();
    const { gameId, gameName, showMerge } = route.params;

    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(false);

    const [mergeQuery, setMergeQuery] = useState('');
    const [mergeResults, setMergeResults] = useState<Game[]>([]);

    const loadMore = async () => {
        if (loading) return;
        setLoading(true);
        try {
            const data = await getGameSessions(gameId, sessions.length, PAGE_SIZE);
            setSessions([...sessions, ...data]);
        } catch {
            // TODO
        }
        setLoading(false);
    };

    useEffect(() => {
        navigation.setOptions({ title: gameName });
        loadMore();
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

    return (
        <View style={styles.container}>
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

            <FlatList
                data={sessions}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.sessionRow}
                        onPress={() => navigation.navigate('EditSession', { sessionId: item.id, status: item.status })}
                    >
                        <Text style={styles.sessionText}>{formatSession(item)}</Text>
                        {item.notes && <Text style={styles.notes}>{item.notes}</Text>}
                    </TouchableOpacity>
                )}
                onEndReached={loadMore}
                onEndReachedThreshold={0.5}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    mergeBox: { padding: 16, backgroundColor: '#fff3cd', borderBottomWidth: 1, borderColor: '#eee' },
    mergeTitle: { fontWeight: '600', marginBottom: 8 },
    mergeRow: { flexDirection: 'row', gap: 8 },
    mergeInput: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8 },
    mergeSearchBtn: { backgroundColor: '#5865F2', padding: 8, borderRadius: 8, justifyContent: 'center' },
    mergeResult: { padding: 12, borderBottomWidth: 1, borderColor: '#eee' },
    sessionRow: { padding: 16, borderBottomWidth: 1, borderColor: '#f0f0f0' },
    sessionText: { fontSize: 14 },
    notes: { fontSize: 12, color: '#718096', marginTop: 4 },
});
