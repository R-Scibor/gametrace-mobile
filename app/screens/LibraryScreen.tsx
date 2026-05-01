import { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getGames, getNeedsReviewGames } from '../api/games';
import { Game } from '../types/api';

const PAGE_SIZE = 20;
const GRID_COLUMNS = 2;         //TODO: Allow user to choose??

export default function LibraryScreen() {
    const navigation = useNavigation<any>();
    const [activeTab, setActiveTab] = useState<'all' | 'needs_review'>('all');
    const [allGames, setAllGames] = useState<Game[]>([]);
    const [reviewGames, setReviewGames] = useState<Game[]>([]);
    const [loading, setLoading] = useState(false);
    const [query, setQuery] = useState('');

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
    const filtered = query.trim()
        ? games.filter(g => g.primary_name.toLowerCase().includes(query.toLowerCase()))
        : games;

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

            <TextInput
                style={styles.search}
                placeholder="Szukaj gry..."
                value={query}
                onChangeText={setQuery}
            />

            <FlatList
                data={filtered}
                keyExtractor={(item) => item.id.toString()}
                numColumns={GRID_COLUMNS}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.cell}
                        onPress={() => navigation.navigate('GameDetail', {
                            gameId: item.id,
                            gameName: item.primary_name,
                        })}
                    >
                        {item.cover_image_url ? (
                            <Image source={{ uri: item.cover_image_url }} style={styles.cover} />
                        ) : (
                            <View style={styles.coverPlaceholder}>
                                <Text style={styles.placeholderText}>{item.primary_name[0]}</Text>
                            </View>
                        )}
                        <Text style={styles.cellName} numberOfLines={2}>{item.primary_name}</Text>
                    </TouchableOpacity>
                )}
                onEndReached={loadMore}
                onEndReachedThreshold={0.5}
            />
        </View>
    );
}

const CELL_WIDTH = 164    // TODO: calculate based on screen width and GRID_COLUMNS???
const CELL_HEIGHT = 218  // IGDB standard cover size is 264x362, we scale it down to fit better on mobile screens

const styles = StyleSheet.create({
    container: { flex: 1 },
    tabs: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#ee0a0a' },
    tab: { flex: 1, padding: 12, alignItems: 'center' },
    tabActive: { borderBottomWidth: 2, borderColor: '#33ff00' },
    search: { margin: 8, padding: 8, borderWidth: 1, borderColor: '#ccc', borderRadius: 6 },
    cell: { flex: 1, margin: 6, alignItems: 'center' },
    cover: { width: CELL_WIDTH, height: CELL_HEIGHT, borderRadius: 4, backgroundColor: '#222' },
    coverPlaceholder: {
        width: CELL_WIDTH,
        height: CELL_HEIGHT,
        borderRadius: 4,
        backgroundColor: '#333',
        alignItems: 'center',
        justifyContent: 'center',
    },
    placeholderText: { fontSize: 48, color: '#888' },
    cellName: { marginTop: 4, fontSize: 12, textAlign: 'center', width: CELL_WIDTH },
});
