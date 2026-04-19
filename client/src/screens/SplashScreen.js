import React, { useEffect, useContext } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { AuthContext } from '../contexts/AuthContext';
import { theme } from '../theme';

export default function SplashScreen({ navigation }) {
  const { user, isLoading } = useContext(AuthContext);

  useEffect(() => {
    if (!isLoading) {
      if (!user && navigation?.replace) {
        navigation.replace('Login');
      }
    }
  }, [isLoading, user, navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.brandMark}>
        <Text style={styles.brandInitial}>S</Text>
      </View>
      <Text style={styles.title}>Stock Inventory</Text>
      <Text style={styles.subtitle}>A cleaner way to manage products, requests, and stock flow.</Text>
      <ActivityIndicator size="large" color={theme.colors.accent} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: 24,
  },
  brandMark: {
    width: 84,
    height: 84,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    ...theme.shadow.floating,
  },
  brandInitial: {
    color: '#fff',
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.muted,
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: 300,
  },
});
