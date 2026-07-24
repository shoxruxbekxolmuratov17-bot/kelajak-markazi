import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Topilmadi' }} />
      <View style={styles.container}>
        <Text style={styles.title}>Sahifa topilmadi</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Bosh sahifaga qaytish</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#F5F5F7',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#373737',
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
  linkText: {
    fontSize: 14,
    color: '#9588E8',
  },
});
