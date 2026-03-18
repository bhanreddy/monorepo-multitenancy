import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Sun, Moon } from 'lucide-react-native';
import { theme } from '../../src/constants/theme';
import { useAuth } from '../../src/hooks/useAuth';
import { superAdminApi } from '../../src/services/apiService';
import { useTheme } from '../../src/contexts/ThemeContext';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48 - 12) / 2;

// ─── Animated Stat Card ───────────────────────────────────────────────────────
function StatCard({
  title,
  value,
  gradientColors,
  delay = 0,
  icon,
  onPress,
}: {
  title: string;
  value: string;
  gradientColors: string[];
  delay?: number;
  icon: string;
  onPress?: () => void;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;

  const { colors, isDark } = useTheme();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        delay,
        tension: 80,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        delay,
        tension: 80,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
        },
        styles.statCardWrapper,
      ]}
    >
      <TouchableOpacity activeOpacity={0.9} onPress={onPress} disabled={!onPress}>
        <LinearGradient
          colors={gradientColors as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.statCard, { borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)' }]}
        >
          {/* Gloss overlay */}
          <View style={styles.glossOverlay} />

          <Text style={styles.statIcon}>{icon}</Text>
          <Text style={[styles.statValue, { color: isDark ? '#FFFFFF' : colors.textPrimary }]}>{value}</Text>
          <Text style={[styles.statTitle, { color: isDark ? 'rgba(255,255,255,0.55)' : colors.textSecondary }]}>{title}</Text>

          {/* Decorative ring */}
          <View style={styles.decorativeRing} />
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Quick Action Card ────────────────────────────────────────────────────────
function ActionCard({
  label,
  subtitle,
  icon,
  accentColor,
  onPress,
  delay = 0,
}: {
  label: string;
  subtitle: string;
  icon: string;
  accentColor: string;
  onPress: () => void;
  delay?: number;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const pressAnim = useRef(new Animated.Value(1)).current;

  const { colors, isDark } = useTheme();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 450, delay, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, delay, tension: 70, friction: 11, useNativeDriver: true }),
    ]).start();
  }, []);

  const onPressIn = () =>
    Animated.spring(pressAnim, { toValue: 0.97, useNativeDriver: true, tension: 200, friction: 10 }).start();
  const onPressOut = () =>
    Animated.spring(pressAnim, { toValue: 1, useNativeDriver: true, tension: 200, friction: 10 }).start();

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: pressAnim }] }}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
      >
        <View style={[styles.actionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Left accent bar */}
          <View style={[styles.actionAccentBar, { backgroundColor: accentColor }]} />

          {/* Icon badge */}
          <View style={[styles.actionIconBadge, { backgroundColor: accentColor + '1A' }]}>
            <Text style={styles.actionIcon}>{icon}</Text>
          </View>

          {/* Text */}
          <View style={styles.actionTextBlock}>
            <Text style={[styles.actionLabel, { color: colors.textPrimary }]}>{label}</Text>
            <Text style={[styles.actionSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
          </View>

          {/* Arrow */}
          <View style={[styles.actionArrowBadge, { backgroundColor: accentColor + '20' }]}>
            <Text style={[styles.actionArrow, { color: accentColor }]}>›</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function DashboardScreen() {
  const { currentAdmin } = useAuth();
  const router = useRouter();
  const { colors, isDark, toggleTheme } = useTheme();
  const toggleScaleAnim = useRef(new Animated.Value(1)).current;

  const [dashboardStats, setDashboardStats] = useState({
    total_schools: 0,
    active_schools: 0,
    total_students: 0,
    total_staff: 0,
    total_super_admins: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const headerFade = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerFade, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(headerSlide, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }),
    ]).start();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await superAdminApi.getDashboardStats();
      setDashboardStats(data);
    } catch (err) {
      console.error('Failed to fetch dashboard stats', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  const stats = [
    {
      title: 'Total Schools',
      value: dashboardStats.total_schools.toString(),
      gradientColors: isDark ? ['#1A1F3A', '#2D3561'] : ['#E0E7FF', '#F1F5F9'],
      icon: '🏫',
      delay: 100,
      route: '/(app)/schools',
    },
    {
      title: 'Active Schools',
      value: dashboardStats.active_schools.toString(),
      gradientColors: isDark ? ['#0F3443', '#1A6B5A'] : ['#DCFCE7', '#F1F5F9'],
      icon: '✅',
      delay: 180,
      route: '/(app)/schools',
    },
    {
      title: 'Total Students',
      value: dashboardStats.total_students.toString(),
      gradientColors: isDark ? ['#2C1654', '#4A2080'] : ['#F3E8FF', '#F1F5F9'],
      icon: '🎓',
      delay: 260,
    },
    {
      title: 'Total Staff',
      value: dashboardStats.total_staff.toString(),
      gradientColors: isDark ? ['#3B1F1F', '#6B2D2D'] : ['#FEE2E2', '#F1F5F9'],
      icon: '👨‍💼',
      delay: 340,
    },
    {
      title: 'Super Admins',
      value: dashboardStats.total_super_admins.toString(),
      gradientColors: isDark ? ['#1A2F1A', '#2D5A3D'] : ['#ECFDF5', '#F1F5F9'],
      icon: '⚡',
      delay: 420,
      route: '/(app)/admins',
    },
  ];

  const quickActions = [
    {
      label: 'Add New School',
      subtitle: 'Register & onboard a school',
      icon: '🏫',
      accentColor: '#6C63FF',
      route: '/schools/add',
      delay: 500,
    },
    {
      label: 'View All Schools',
      subtitle: 'Manage school directory',
      icon: '📋',
      accentColor: '#00C9A7',
      route: '/(app)/schools',
      delay: 570,
    },
    {
      label: 'Add Super Admin',
      subtitle: 'Grant console access',
      icon: '🔐',
      accentColor: '#F5A623',
      route: '/admins/add',
      delay: 640,
    },
  ];

  const adminName = currentAdmin?.full_name || currentAdmin?.email?.split('@')[0] || 'Admin';
  const timeOfDay = new Date().getHours();
  const greeting =
    timeOfDay < 12 ? 'Good Morning' : timeOfDay < 17 ? 'Good Afternoon' : 'Good Evening';

  const onTogglePressIn = () =>
    Animated.spring(toggleScaleAnim, { toValue: 0.85, tension: 300, friction: 10, useNativeDriver: true }).start();
  const onTogglePressOut = () => {
    Animated.spring(toggleScaleAnim, { toValue: 1, tension: 200, friction: 10, useNativeDriver: true }).start();
    toggleTheme();
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Background */}
      <LinearGradient
        colors={isDark ? ['#080B18', '#0D1226', '#080B18'] : [colors.background, colors.surface, colors.background]}
        style={StyleSheet.absoluteFill}
      />

      {/* Ambient glow blobs */}
      {isDark && (
        <>
          <View style={[styles.glowBlob, { top: -60, left: -80, backgroundColor: '#6C63FF22' }]} />
          <View style={[styles.glowBlob, { top: 180, right: -100, backgroundColor: '#00C9A722' }]} />
        </>
      )}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6C63FF"
            colors={['#6C63FF']}
          />
        }
      >
        {/* ── Header ── */}
        <Animated.View
          style={[
            styles.header,
            { opacity: headerFade, transform: [{ translateY: headerSlide }] },
          ]}
        >
          <View style={styles.headerTop}>
            <View>
              <Text style={[styles.greeting, { color: colors.textSecondary }]}>{greeting} 👋</Text>
              <Text style={[styles.adminName, { color: colors.textPrimary }]}>{adminName}</Text>
            </View>

            <View style={styles.headerRight}>
              {/* Theme toggle */}
              <Animated.View style={{ transform: [{ scale: toggleScaleAnim }] }}>
                <TouchableOpacity
                  onPressIn={onTogglePressIn}
                  onPressOut={onTogglePressOut}
                  activeOpacity={1}
                  style={[
                    styles.notificationBell,
                    {
                      backgroundColor: isDark ? '#1A1F3A' : '#F0F1F8',
                      borderColor: isDark ? '#2D3561' : '#E2E4ED',
                    },
                  ]}
                >
                  {isDark ? (
                    <Sun size={18} color="#F5A623" />
                  ) : (
                    <Moon size={18} color="#6C63FF" />
                  )}
                </TouchableOpacity>
              </Animated.View>

              {/* Notification bell */}
              <View style={[
                styles.notificationBell,
                {
                  backgroundColor: isDark ? '#1A1F3A' : '#F0F1F8',
                  borderColor: isDark ? '#2D3561' : '#E2E4ED',
                },
              ]}>
                <Text style={styles.bellIcon}>🔔</Text>
                <View style={styles.notifBadge} />
              </View>

              {/* Avatar with online dot */}
              <View style={[styles.avatarRing, { backgroundColor: isDark ? '#1A1F3A' : '#E2E4ED' }]}>
                <LinearGradient
                  colors={['#6C63FF', '#00C9A7']}
                  style={styles.avatarGradient}
                >
                  <Text style={styles.avatarText}>
                    {adminName.charAt(0).toUpperCase()}
                  </Text>
                </LinearGradient>
                <View style={[styles.onlineDot, { borderColor: isDark ? '#080B18' : colors.background }]} />
              </View>
            </View>
          </View>

          {/* Console badge */}
          <View style={[
            styles.consoleBadge,
            {
              backgroundColor: isDark ? '#1A1F3A' : '#F0F1F8',
              borderColor: isDark ? '#2D3561' : '#E2E4ED',
            },
          ]}>
            <View style={styles.consoleDot} />
            <Text style={[styles.consoleBadgeText, { color: colors.textSecondary }]}>Super Admin Console  •  NexSyrus</Text>
          </View>

          {/* Brand mark */}
          <Text style={[styles.brandMark, { color: colors.textSecondary }]}>⚡ NexSyrus Platform</Text>

          {/* Gradient separator */}
          <LinearGradient
            colors={['rgba(108,99,255,0.25)', 'rgba(0,201,167,0.10)', 'rgba(108,99,255,0)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.headerSeparator}
          />
        </Animated.View>

        {/* ── Stats Section ── */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Overview</Text>
          <View style={[styles.sectionPill, { backgroundColor: isDark ? '#0F3443' : colors.success + '1A' }]}>
            <Text style={[styles.sectionPillText, { color: isDark ? '#00C9A7' : colors.success }]}>Live</Text>
            <View style={[styles.liveDot, { backgroundColor: isDark ? '#00C9A7' : colors.success }]} />
          </View>
        </View>

        {loading && !refreshing ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#6C63FF" />
            <Text style={styles.loaderText}>Fetching data…</Text>
          </View>
        ) : (
          <>
            {/* 2-column grid */}
            <View style={styles.statsGrid}>
              {stats.slice(0, 4).map((stat, i) => (
                <StatCard 
                  key={i} 
                  {...stat} 
                  onPress={() => stat.route && router.push(stat.route as any)} 
                />
              ))}
            </View>
            {/* Full-width last card */}
            <View style={styles.statsFullRow}>
              <Animated.View style={[styles.statCardFullWrapper]}>
                <TouchableOpacity 
                  activeOpacity={0.9} 
                  onPress={() => stats[4].route && router.push(stats[4].route as any)}
                >
                  <LinearGradient
                    colors={stats[4].gradientColors as any}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.statCardFull, { borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)' }]}
                  >
                    <View style={styles.glossOverlay} />
                    <View style={styles.statCardFullInner}>
                      <Text style={styles.statIcon}>{stats[4].icon}</Text>
                      <View>
                        <Text style={[styles.statValueLarge, { color: isDark ? '#FFFFFF' : colors.textPrimary }]}>{stats[4].value}</Text>
                        <Text style={[styles.statTitleLight, { color: isDark ? 'rgba(255,255,255,0.55)' : colors.textSecondary }]}>{stats[4].title}</Text>
                      </View>
                    </View>
                    <View style={[styles.decorativeRing, { right: -20, bottom: -20, width: 90, height: 90 }]} />
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </>
        )}

        {/* ── Quick Actions ── */}
        <View style={[styles.sectionHeader, { marginTop: 28 }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Quick Actions</Text>
        </View>

        <View style={styles.actionsList}>
          {quickActions.map((action, i) => (
            <ActionCard
              key={i}
              label={action.label}
              subtitle={action.subtitle}
              icon={action.icon}
              accentColor={action.accentColor}
              delay={action.delay}
              onPress={() => router.push(action.route as any)}
            />
          ))}
        </View>

        {/* Bottom padding for floating tab bar */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 48 : 56,
    paddingBottom: 20,
  },

  // Ambient
  glowBlob: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    opacity: 0.6,
  },

  // ── Header
  header: {
    marginBottom: 32,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  notificationBell: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  bellIcon: {
    fontSize: 18,
  },
  notifBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF4D4D',
    borderWidth: 2,
    borderColor: '#1A1F3A',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#00D68F',
    borderWidth: 2,
  },
  brandMark: {
    fontSize: 11,
    color: '#5B6080',
    fontWeight: '600',
    letterSpacing: 0.8,
    marginTop: 10,
  },
  headerSeparator: {
    height: 2,
    borderRadius: 1,
    marginTop: 18,
  },
  greeting: {
    fontSize: 14,
    color: '#8B8FA8',
    fontWeight: '500',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  adminName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#F0F2FF',
    letterSpacing: -0.5,
  },
  avatarRing: {
    padding: 2,
    borderRadius: 26,
  },
  avatarGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '800',
  },
  consoleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  consoleDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#00C9A7',
    marginRight: 8,
  },
  consoleBadgeText: {
    fontSize: 12,
    color: '#8B8FA8',
    fontWeight: '600',
    letterSpacing: 0.2,
  },

  // ── Section Header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F0F2FF',
    letterSpacing: -0.2,
  },
  sectionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 5,
  },
  sectionPillText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00C9A7',
  },

  // ── Stat Cards (2-col grid)
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  statCardWrapper: {
    width: CARD_WIDTH,
  },
  statCard: {
    borderRadius: 20,
    padding: 20,
    minHeight: 130,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  glossOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '45%',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  statIcon: {
    fontSize: 26,
    marginBottom: 10,
  },
  statValue: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  statTitle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  decorativeRing: {
    position: 'absolute',
    right: -16,
    bottom: -16,
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 12,
    borderColor: 'rgba(255,255,255,0.05)',
  },

  // ── Full-width stat card
  statsFullRow: {
    marginBottom: 4,
  },
  statCardFullWrapper: {
    width: '100%',
  },
  statCardFull: {
    borderRadius: 20,
    padding: 20,
    overflow: 'hidden',
    borderWidth: 1,
  },
  statCardFullInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  statValueLarge: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1,
  },
  statTitleLight: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginTop: 2,
  },

  // ── Action Cards
  actionsList: {
    gap: 10,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    paddingVertical: 14,
    paddingRight: 14,
    paddingLeft: 0,
    gap: 14,
  },
  actionAccentBar: {
    width: 4,
    height: '100%',
    borderRadius: 2,
    minHeight: 52,
  },
  actionIconBadge: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: {
    fontSize: 22,
  },
  actionTextBlock: {
    flex: 1,
  },
  actionLabel: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.1,
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#5B6080',
    fontWeight: '500',
  },
  actionArrowBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionArrow: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 26,
  },

  // ── Loader
  loaderContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  loaderText: {
    color: '#5B6080',
    fontSize: 13,
    fontWeight: '500',
  },
});