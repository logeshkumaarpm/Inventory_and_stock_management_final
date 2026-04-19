import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { AuthContext } from '../contexts/AuthContext';
import { theme } from '../theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('admin@test.com');
  const [password, setPassword] = useState('123');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (!result.success) {
      Alert.alert('Login Failed', result.message);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <View style={styles.brandMark}>
            <Text style={styles.brandInitial}>S</Text>
          </View>
          <Text style={styles.kicker}>Inventory control for teams</Text>
          <Text style={styles.title}>Welcome back.</Text>
          <Text style={styles.subtitle}>Sign in to track stock, requests, and approvals from one polished workspace.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Email</Text>
          <TextInput 
            style={styles.input} 
            placeholder="admin@test.com" 
            placeholderTextColor={theme.colors.muted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <Text style={styles.fieldLabel}>Password</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Password"
            placeholderTextColor={theme.colors.muted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={true}
          />
          
          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]} 
            onPress={handleLogin}
            disabled={loading === true}
            activeOpacity={0.9}
          >
            <Text style={styles.buttonText}>{loading ? 'Signing in...' : 'Login'}</Text>
          </TouchableOpacity>

          <View style={styles.helperCard}>
            <Text style={styles.helperTitle}>Demo access</Text>
            <Text style={styles.helperText}>Admin: admin@test.com / 123</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  hero: {
    marginBottom: 18,
    paddingHorizontal: 4,
  },
  brandMark: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    ...theme.shadow.floating,
  },
  brandInitial: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '800',
  },
  kicker: {
    color: theme.colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 8,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.muted,
    maxWidth: 360,
  },
  card: {
    backgroundColor: theme.colors.surface,
    padding: 22,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(217,226,238,0.75)',
    ...theme.shadow.card,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 8,
    marginTop: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  input: {
    minHeight: 54,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius.md,
    paddingHorizontal: 16,
    marginBottom: 8,
    backgroundColor: theme.colors.surfaceSoft,
    fontSize: 16,
    color: theme.colors.text,
  },
  button: {
    backgroundColor: theme.colors.primary,
    minHeight: 54,
    borderRadius: theme.radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    ...theme.shadow.floating,
  },
  buttonDisabled: {
    opacity: 0.75,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  helperCard: {
    marginTop: 16,
    padding: 14,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primarySoft,
  },
  helperTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.primary,
    marginBottom: 4,
  },
  helperText: {
    color: theme.colors.primary,
    fontSize: 13,
  }
});
