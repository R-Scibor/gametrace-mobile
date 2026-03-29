import { View, Text, StyleSheet } from 'react-native';

export default function EditSessionScreen() {
  return (
    <View style={styles.container}>
      <Text>Edit Session Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
