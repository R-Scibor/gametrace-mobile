import { View, Text, StyleSheet } from 'react-native';

export default function AddSessionScreen() {
  return (
    <View style={styles.container}>
      <Text>Add Session Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
