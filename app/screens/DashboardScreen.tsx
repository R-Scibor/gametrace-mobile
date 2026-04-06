import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDashboard } from '../hooks/useDashboard';

export default function DashboardScreen() {
  const { data, loading, error, refresh } = useDashboard();
  const navigation = useNavigation<any>();
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Loading dashboard...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={refresh}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>

      {/* Error session banner */}
      {data?.pending_errors && data.pending_errors.length > 0 && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>
            {data.pending_errors.length} pending errors
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('EditSession', {
            sessionId: data.pending_errors[0].id,
          })}>
            <Text style={styles.bannerAction}>View Details</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Active sessions */}
      {data?.active_session && (
        <View style={styles.activeCard}>
          <Text style={styles.activeLabel}>You are now playing:</Text>
          <Text style={styles.activeName}>{data.active_session.game_name}</Text>
        </View>
      )}

      {/* Stats summary */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {Math.round((data?.total_seconds_7d ?? 0) / 3600)}h
          </Text>
          <Text style={styles.statLabel}>this week</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {Math.round((data?.total_seconds_30d ?? 0) / 3600)}h
          </Text>
          <Text style={styles.statLabel}>this month</Text>
        </View>
      </View>
    </ScrollView>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorBanner: {
    backgroundColor: '#fff3cd', borderRadius: 8, padding: 12,
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 16,
  },
  errorBannerText: { fontSize: 14, color: '#856404' },
  bannerAction: { fontSize: 14, fontWeight: '600', color: '#5865F2' },
  activeCard: {
    backgroundColor: '#ebf8ff', borderRadius: 8,
    padding: 16, marginBottom: 16,
  },
  activeLabel: { fontSize: 12, color: '#2b6cb0' },
  activeName: { fontSize: 20, fontWeight: 'bold', color: '#1a365d' },
  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: {
    flex: 1, backgroundColor: '#f7fafc', borderRadius: 8,
    padding: 16, alignItems: 'center',
  },
  statValue: { fontSize: 28, fontWeight: 'bold' },
  statLabel: { fontSize: 12, color: '#718096', marginTop: 4 },
  errorText: { color: '#e53e3e', marginBottom: 8 },
  retryText: { color: '#5865F2', fontWeight: '600' },
});
