import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { Plus, Building2, ChevronRight, Sun, Moon } from 'lucide-react-native';
import { superAdminApi } from '../../../src/services/apiService';
import { School } from '../../../src/types/school';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { Card } from '../../../src/components/ui/Card';
import { Badge } from '../../../src/components/ui/Badge';
import { ScreenHeader } from '../../../src/components/ui/ScreenHeader';
import { LinearGradient } from 'expo-linear-gradient';

export default function SchoolsListScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    try {
      setLoading(true);
      const data = await superAdminApi.getSchools();
      setSchools(data);
    } catch (err: any) {
      console.error('Failed to fetch schools:', err.message || err);
    } finally {
      setLoading(false);
    }
  };

  const renderSchoolItem = ({ item }: { item: School }) => (
    <TouchableOpacity
      onPress={() => router.push(`/(app)/schools/${item.id}` as Href<string>)}
      activeOpacity={0.7}
    >
      <Card
        style={[
          styles.schoolCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderWidth: 1,
          }
        ]}
      >
        <View style={styles.schoolInfo}>
          <View style={styles.schoolHeader}>
            <View style={[styles.iconContainer, { backgroundColor: isDark ? 'rgba(108, 99, 255, 0.1)' : colors.primaryDim }]}>
              <Building2 size={24} color={colors.primary} />
            </View>
            <View style={styles.schoolText}>
              <Text style={[styles.schoolName, { color: colors.textPrimary }]} numberOfLines={1}>{item.name}</Text>
              <View style={styles.schoolMeta}>
                <Text style={[styles.schoolCode, { color: colors.textSecondary }]}>{item.code}</Text>
                <Text style={[styles.schoolIdText, { color: colors.primary }]}>ID: {item.id}</Text>
              </View>
            </View>
          </View>
          <View style={styles.badgeContainer}>
            <Badge
              label={item.is_active ? 'Active' : 'Inactive'}
              variant={item.is_active ? 'success' : 'error'}
            />
          </View>
        </View>
        <ChevronRight size={20} color={colors.textSecondary} />
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <LinearGradient
        colors={isDark ? ['#0A0A0B', '#121214'] : [colors.background, colors.surface]}
        style={StyleSheet.absoluteFillObject}
      />

      <ScreenHeader
        title="All Schools"
        subtitle="School directory"
        rightAction={
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.themeToggle, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={toggleTheme}
            >
              {isDark ? <Sun size={18} color="#FFD700" /> : <Moon size={18} color={colors.primary} />}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/(app)/schools/add')}
            >
              <Plus size={18} color="#FFF" />
            </TouchableOpacity>
          </View>
        }
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : schools.length === 0 ? (
        <View style={styles.center}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No schools found.</Text>
        </View>
      ) : (
        <FlatList
          data={schools}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderSchoolItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  themeToggle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6C63FF',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  listContainer: {
    padding: 16,
    gap: 16,
    paddingBottom: 100,
  },
  schoolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
  },
  schoolInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 12,
  },
  schoolHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  schoolText: {
    flex: 1,
  },
  schoolName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  schoolCode: {
    fontSize: 14,
    fontWeight: '500',
  },
  schoolMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  schoolIdText: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.8,
  },
  badgeContainer: {
    marginLeft: 12,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

