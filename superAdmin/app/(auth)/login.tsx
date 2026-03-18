import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { theme } from '../../src/constants/theme';
import { authService } from '../../src/services/authService';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    const { user, session, error } = await authService.signIn(email, password);

    if (error) {
      setErrorMsg(error.message || 'Login failed.');
      setLoading(false);
      return;
    }

    if (user && session) {
      const result = await authService.isSuperAdmin(user.id, session.access_token);
      if (!result.isSuperAdmin) {
        await authService.signOut();
        setErrorMsg('Access denied. Not a super admin.');
      } else {
        router.replace('/(app)/');
      }
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Animated.View entering={FadeInDown.duration(800).springify()} style={styles.header}>
          <Text style={styles.title}>NexSyrus</Text>
          <Text style={styles.subtitle}>Super Admin Console</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(800).delay(200).springify()} style={styles.form}>
          <Input
            label="Email Address"
            placeholder="admin@nexsyrus.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Input
            label="Password"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {errorMsg ? (
            <Text style={styles.errorText}>{errorMsg}</Text>
          ) : null}

          <Button
            title="Sign In"
            onPress={handleLogin}
            loading={loading}
            style={styles.button}
          />
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xxl,
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.primary,
  },
  form: {
    width: '100%',
  },
  errorText: {
    color: theme.colors.error,
    ...theme.typography.bodySmall,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  button: {
    marginTop: theme.spacing.md,
  },
});
