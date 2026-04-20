import { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getGames, getNeedsReviewGames } from '../api/games';
import { Game } from '../types/api';

const PAGE_SIZE = 20;

export default function LibraryScreen() {
    const navigation = useNavigation<any>();
    const [activeTab, setActiveTab] = useState<'all' | 'needs_review'>('all');
    const [allGames, setAllGames] = useState<Game[]>([]);
    const [reviewGames, setReviewGames] = useState<Game[]>([]);
    const [loading, setLoading] = useState(false);

    const loadMore = async () => {
        if (loading) return;
        setLoading(true);
        try {
            if (activeTab === 'all') {
                const data = await getGames(allGames.length, PAGE_SIZE);
                setAllGames([...allGames, ...data]);
            } else {
                const data = await getNeedsReviewGames(reviewGames.length, PAGE_SIZE);
                setReviewGames([...reviewGames, ...data]);
            }
        } catch {
            // TODO
        }
        setLoading(false);
    };

    useEffect(() => { loadMore(); }, []);

    const games = activeTab === 'all' ? allGames : reviewGames;

    return (
        <View style={styles.container}>
            <View style={styles.tabs}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'all' && styles.tabActive]}
                    onPress={() => setActiveTab('all')}
                >
                    <Text>Wszystkie</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'needs_review' && styles.tabActive]}
                    onPress={() => setActiveTab('needs_review')}
                >
                    <Text>Nierozpoznane</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={games}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.gameRow}
                        onPress={() => navigation.navigate('GameDetail', {
                            gameId: item.id,
                            gameName: item.primary_name,
                        })}
                    >
                        <Text style={styles.gameName}>{item.primary_name}</Text>
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
    tabs: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#ee0a0a' },
    tab: { flex: 1, padding: 12, alignItems: 'center' },
    tabActive: { borderBottomWidth: 2, borderColor: '#33ff00' },
    gameRow: { padding: 16, borderBottomWidth: 1, borderColor: '#1623d1' },
    gameName: { fontSize: 16 },
});
