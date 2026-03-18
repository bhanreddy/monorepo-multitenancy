import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Switch, Alert, StatusBar, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Shield, ArrowLeft } from 'lucide-react-native';
import { Input } from '../../../src/components/ui/Input';
import { Button } from '../../../src/components/ui/Button';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { superAdminApi } from '../../../src/services/apiService';
import { ScreenHeader } from '../../../src/components/ui/ScreenHeader';
import { LinearGradient } from 'expo-linear-gradient';

export default function AddSchoolScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [address, setAddress] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  // First admin toggle & fields
  const [seedAdmin, setSeedAdmin] = useState(false);
  const [adminFirstName, setAdminFirstName] = useState('');
  const [adminLastName, setAdminLastName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const router = useRouter();

  const handleCreate = async () => {
    if (!name || !code) {
      setErrorMsg('Name and Code are required identifiers.');
      return;
    }

    if (seedAdmin) {
      if (!adminFirstName || !adminLastName || !adminEmail || !adminPassword) {
        setErrorMsg('All admin fields are required when seeding first admin.');
        return;
      }
    }

    setLoading(true);
    setErrorMsg('');

    try {
      // 1. Create the school
      const newSchool = await superAdminApi.createSchool({
        name,
        code,
        address: address || undefined,
        logo_url: logoUrl || undefined,
      });

      // 2. Seed school defaults
      await superAdminApi.seedSchoolDefaults(newSchool.id);

      // 3. If admin toggle is on, create the first admin
      if (seedAdmin) {
        await superAdminApi.addFirstAdmin(newSchool.id, {
          email: adminEmail,
          first_name: adminFirstName,
          last_name: adminLastName,
          password: adminPassword,
        });
      }

      // Show success with School ID
      Alert.alert(
        '🎉 School Created!',
        `School "${newSchool.name}" created successfully.\n\nSchool ID: ${newSchool.id}\nCode: ${newSchool.code}${seedAdmin ? '\n\nFirst admin account has been provisioned.' : ''}`,
        [
          {
            text: 'View School',
            onPress: () => router.replace(`/schools/${newSchool.id}` as any),
          },
          {
            text: 'View Setup Guide →',
            onPress: () => router.replace(`/schools/${newSchool.id}/setup-guide` as any),
          },
        ]
      );
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.response?.data?.error || err.message || 'Failed to create school.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <LinearGradient
        colors={isDark ? ['#0A0A0B', '#121214'] : [colors.background, colors.surface]}
        style={StyleSheet.absoluteFillObject}
      />

      <ScreenHeader
        title="Register School"
        subtitle="Create a new tenant entity"
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          <Input
            label="School Name *"
            placeholder="e.g. Springfield High School"
            value={name}
            onChangeText={setName}
            containerStyle={{ marginBottom: 16 }}
          />
          <Input
            label="School Code *"
            placeholder="e.g. SMHS"
            value={code}
            onChangeText={(text) => setCode(text.toUpperCase())}
            autoCapitalize="characters"
            containerStyle={{ marginBottom: 16 }}
          />
          <Input
            label="Address"
            placeholder="123 Education Lane"
            value={address}
            onChangeText={setAddress}
            multiline
            numberOfLines={3}
            containerStyle={{ marginBottom: 16 }}
          />
          <Input
            label="Logo URL"
            placeholder="https://example.com/logo.png"
            value={logoUrl}
            onChangeText={setLogoUrl}
            keyboardType="url"
            autoCapitalize="none"
            containerStyle={{ marginBottom: 16 }}
          />

          {/* ── Seed First Admin Toggle ── */}
          <View style={[styles.toggleSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.toggleRow}>
              <View style={styles.toggleLabel}>
                <Shield size={20} color={colors.primary} />
                <Text style={[styles.toggleTitle, { color: colors.textPrimary }]}>Seed First Admin</Text>
              </View>
              <Switch
                value={seedAdmin}
                onValueChange={setSeedAdmin}
                trackColor={{ false: colors.border, true: colors.primaryDim }}
                thumbColor={seedAdmin ? colors.primary : colors.textSecondary}
              />
            </View>
            <Text style={[styles.toggleHint, { color: colors.textSecondary }]}>
              Provision the school's first admin account during setup.
            </Text>
          </View>

          {seedAdmin && (
            <View style={styles.adminSection}>
              <View style={[styles.adminDivider, { backgroundColor: colors.primary }]} />
              <Text style={[styles.adminSectionTitle, { color: colors.primary }]}>Admin Account Details</Text>
              <Input
                label="First Name *"
                placeholder="John"
                value={adminFirstName}
                onChangeText={setAdminFirstName}
                containerStyle={{ marginBottom: 16 }}
              />
              <Input
                label="Last Name *"
                placeholder="Doe"
                value={adminLastName}
                onChangeText={setAdminLastName}
                containerStyle={{ marginBottom: 16 }}
              />
              <Input
                label="Email *"
                placeholder="admin@school.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={adminEmail}
                onChangeText={setAdminEmail}
                containerStyle={{ marginBottom: 16 }}
              />
              <Input
                label="Temporary Password *"
                placeholder="Secure Password"
                secureTextEntry
                value={adminPassword}
                onChangeText={setAdminPassword}
                containerStyle={{ marginBottom: 16 }}
              />
            </View>
          )}

          {errorMsg ? <Text style={[styles.errorText, { color: colors.error }]}>{errorMsg}</Text> : null}

          <View style={styles.buttonGroup}>
            <Button
              title="Cancel"
              variant="secondary"
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/');
                }
              }}
              style={styles.actionButton}
            />
            <Button
              title={seedAdmin ? 'Create & Seed' : 'Create School'}
              variant="primary"
              onPress={handleCreate}
              loading={loading}
              style={styles.actionButton}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  themeToggle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  form: {
    gap: 8,
  },
  toggleSection: {
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  toggleHint: {
    fontSize: 12,
    marginTop: 4,
  },
  adminSection: {
    gap: 8,
    marginTop: 16,
  },
  adminDivider: {
    height: 1,
    opacity: 0.3,
    marginVertical: 8,
  },
  adminSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    marginTop: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 16,
  },
  actionButton: {
    flex: 1,
  },
});
