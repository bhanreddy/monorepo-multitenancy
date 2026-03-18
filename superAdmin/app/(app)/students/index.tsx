import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { Users, ChevronRight } from 'lucide-react-native';
import { superAdminApi } from '../../../src/services/apiService';
import { Student } from '../../../src/types/student';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { Card } from '../../../src/components/ui/Card';
import { Badge } from '../../../src/components/ui/Badge';
import { ScreenHeader } from '../../../src/components/ui/ScreenHeader';
import { LinearGradient } from 'expo-linear-gradient';

export default function StudentsScreen() {
  const { colors, isDark } = useTheme();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const data = await superAdminApi.getStudents();
      setStudents(data);
    } catch (err: any) {
      console.error('Failed to fetch students:', err.message || err);
    } finally {
      setLoading(false);
    }
  };

  const renderStudentItem = ({ item }: { item: Student }) => (
    <TouchableOpacity onPress={() => {}} activeOpacity={0.7}>
      <Card
        style={[
          styles.studentCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderWidth: 1,
          }
        ]}
      >
        <View style={styles.studentInfo}>
          <View style={styles.studentHeader}>
            <View style={[styles.iconContainer, { backgroundColor: isDark ? 'rgba(108, 99, 255, 0.1)' : colors.primaryDim }]}>
              <Users size={24} color={colors.primary} />
            </View>
            <View style={styles.studentText}>
              <Text style={[styles.studentName, { color: colors.textPrimary }]} numberOfLines={1}>
                {item.first_name} {item.last_name}
              </Text>
              <View style={styles.studentMeta}>
                <Text style={[styles.admissionNo, { color: colors.textSecondary }]}>{item.admission_no}</Text>
                <Text style={[styles.schoolName, { color: colors.primary }]}>{item.school_name}</Text>
              </View>
            </View>
          </View>
          <View style={styles.badgeContainer}>
            <Badge
              label={item.status_name || 'Active'}
              variant="success"
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
        title="Students"
        subtitle="Manage students across schools"
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : students.length === 0 ? (
        <View style={styles.center}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No students found.</Text>
        </View>
      ) : (
        <FlatList
          data={students}
          keyExtractor={(item) => item.id}
          renderItem={renderStudentItem}
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
  listContainer: {
    padding: 16,
    gap: 16,
    paddingBottom: 100,
  },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
  },
  studentInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 12,
  },
  studentHeader: {
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
  studentText: {
    flex: 1,
  },
  studentName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  admissionNo: {
    fontSize: 14,
    fontWeight: '500',
  },
  studentMeta: {
    flexDirection: 'column',
    gap: 2,
  },
  schoolName: {
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
