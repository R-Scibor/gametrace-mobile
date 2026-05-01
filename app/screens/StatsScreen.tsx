import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { getStatsSummary } from '../api/stats';
import { StatsSummary } from '../types/api';

const PERIODS = [7, 30, 90] as const;
type Period = typeof PERIODS[number];

function formatHours(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export default function StatsScreen() {
  const [days, setDays] = useState<Period>(7);
  const [data, setData] = useState<StatsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getStatsSummary(days)
      .then(setData)
      .catch(() => setError('Nie udało się załadować statystyk.'))
      .finally(() => setLoading(false));
  }, [days]);

  return (
    <View style={styles.container}>
      <View style={styles.selector}>
        {PERIODS.map(p => (
          <TouchableOpacity
            key={p}
            style={[styles.pill, days === p && styles.pillActive]}
            onPress={() => setDays(p)}
          >
            <Text style={[styles.pillText, days === p && styles.pillTextActive]}>
              {p}d
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
        </View>
      )}

      {!loading && error && (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {!loading && data && (
        <FlatList
          data={data.per_game}
          keyExtractor={item => String(item.game_id)}
          ListHeaderComponent={
            <View style={styles.totalCard}>
              <Text style={styles.totalValue}>{formatHours(data.total_seconds)}</Text>
              <Text style={styles.totalLabel}>łącznie w ciągu {days} dni</Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <View style={styles.row}>
              <Text style={styles.rank}>{index + 1}</Text>
              <Text style={styles.gameName} numberOfLines={1}>{item.game_name}</Text>
              <Text style={styles.gameTime}>{formatHours(item.total_seconds)}</Text>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>Brak sesji w tym okresie.</Text>
          }
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  selector: { flexDirection: 'row', gap: 8, padding: 16, paddingBottom: 8 },
  pill: {
    paddingHorizontal: 16, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderColor: '#cbd5e0',
  },
  pillActive: { backgroundColor: '#5865F2', borderColor: '#5865F2' },
  pillText: { fontSize: 14, color: '#4a5568' },
  pillTextActive: { color: '#fff', fontWeight: '600' },
  list: { padding: 16, paddingTop: 8 },
  totalCard: {
    backgroundColor: '#f7fafc', borderRadius: 8,
    padding: 16, alignItems: 'center', marginBottom: 16,
  },
  totalValue: { fontSize: 36, fontWeight: 'bold' },
  totalLabel: { fontSize: 13, color: '#718096', marginTop: 4 },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  rank: { width: 28, fontSize: 13, color: '#a0aec0', fontWeight: '600' },
  gameName: { flex: 1, fontSize: 15 },
  gameTime: { fontSize: 14, color: '#4a5568', fontWeight: '600' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: '#e53e3e' },
  empty: { textAlign: 'center', color: '#a0aec0', marginTop: 32 },
});
