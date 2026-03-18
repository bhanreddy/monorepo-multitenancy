import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  School,
  CheckCircle2,
  GraduationCap,
  Users,
  Shield,
  ShieldCheck,
  Bell,
  Moon,
  Sun,
  ChevronRight,
  Zap,
  Building2,
  PlusCircle,
  ListChecks,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { useAuth } from '../../../src/hooks/useAuth';
import { superAdminApi } from '../../../src/services/apiService';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 20 * 2 - 12) / 2;

// ─── Light Mode Design Tokens ────────────────────────────────────────────────
const L = {
  // Backgrounds
  bg: '#F5F4F1',            // warm off-white — not cold white
  bgCard: '#FFFFFF',
  bgCardTinted: '#FDFCFA',
  surface: '#FFFFFF',
  surfaceSunk: '#EFEDE9',

  // Borders & dividers
  border: 'rgba(0,0,0,0.07)',
  borderMid: 'rgba(0,0,0,0.1)',
  divider: 'rgba(0,0,0,0.05)',

  // Text
  text: '#111110',
  textSub: '#6B6B6B',
  textMuted: '#A3A3A3',
  textInverse: '#FFFFFF',

  // Brand
  gold: '#E9A800',
  goldLight: '#FFF7E0',
  goldBorder: 'rgba(233,168,0,0.25)',
  goldText: '#C48A00',

  // Stat accent colors
  indigo: '#5B5FEF',
  indigoLight: '#EEF0FD',
  indigoBorder: 'rgba(91,95,239,0.18)',
  indigoText: '#4346C4',

  emerald: '#0EA472',
  emeraldLight: '#E8FAF4',
  emeraldBorder: 'rgba(14,164,114,0.2)',
  emeraldText: '#0B8A60',

  violet: '#7C3AED',
  violetLight: '#F3EEFE',
  violetBorder: 'rgba(124,58,237,0.18)',
  violetText: '#6529C9',

  amber: '#D97706',
  amberLight: '#FEF6E7',
  amberBorder: 'rgba(217,119,6,0.2)',
  amberText: '#B45309',

  // Shadows
  shadow: {
    color: '#1A1A1A',
    sm: { shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
    md: { shadowOpacity: 0.09, shadowRadius: 14, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
    lg: { shadowOpacity: 0.12, shadowRadius: 20, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
  },
};

// ─── Stat Card ───────────────────────────────────────────────────────────────
const StatCard = ({
  icon: Icon,
  value,
  label,
  accent,
  accentLight,
  accentBorder,
  accentText,
  wide = false,
  delay = 0,
}: {
  icon: any;
  value: number | string;
  label: string;
  accent: string;
  accentLight: string;
  accentBorder: string;
  accentText: string;
  wide?: boolean;
  delay?: number;
}) => {
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(20)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 420, delay, useNativeDriver: true }),
      Animated.spring(slide, { toValue: 0, delay, tension: 90, friction: 12, useNativeDriver: true }),
    ]).start();
  }, []);

  const onPressIn = () =>
    Animated.spring(scale, { toValue: 0.97, tension: 200, friction: 10, useNativeDriver: true }).start();
  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, tension: 200, friction: 10, useNativeDriver: true }).start();

  return (
    <Animated.View
      style={[
        statStyles.wrapper,
        wide ? statStyles.wideWrapper : statStyles.halfWrapper,
        { opacity: fade, transform: [{ translateY: slide }, { scale }] },
      ]}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={[
          statStyles.card,
          wide && statStyles.wideCard,
          {
            backgroundColor: L.bgCard,
            borderColor: L.border,
            shadowColor: L.shadow.color,
            ...L.shadow.md,
          },
        ]}
      >
        {/* Subtle tinted top band */}
        <View style={[statStyles.topBand, { backgroundColor: accentLight }]} />

        <View style={wide ? statStyles.wideInner : statStyles.inner}>
          {/* Icon box */}
          <View
            style={[
              statStyles.iconBox,
              {
                backgroundColor: accentLight,
                borderColor: accentBorder,
              },
              wide && statStyles.wideIconBox,
            ]}
          >
            <Icon
              size={wide ? 20 : 18}
              color={accent}
              strokeWidth={2}
            />
          </View>

          {wide ? (
            // Wide layout: horizontal
            <View style={statStyles.wideTextGroup}>
              <Text style={[statStyles.wideValue, { color: L.text }]}>{value}</Text>
              <Text style={[statStyles.wideLabel, { color: accentText }]}>{label}</Text>
            </View>
          ) : (
            // Square layout: vertical
            <View style={statStyles.textGroup}>
              <Text style={[statStyles.value, { color: L.text }]}>{value}</Text>
              <Text style={[statStyles.label, { color: L.textSub }]}>{label}</Text>
            </View>
          )}
        </View>

        {/* Bottom accent line */}
        <View style={[statStyles.accentLine, { backgroundColor: accent }]} />
      </TouchableOpacity>
    </Animated.View>
  );
};

const statStyles = StyleSheet.create({
  wrapper: {
    overflow: 'visible',
  },
  halfWrapper: {
    width: CARD_WIDTH,
  },
  wideWrapper: {
    width: '100%',
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 16,
  },
  wideCard: {
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  topBand: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    opacity: 0.7,
  },
  inner: {
    gap: 12,
  },
  wideInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wideIconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
  },
  textGroup: {
    gap: 2,
  },
  wideTextGroup: {
    gap: 2,
    flex: 1,
  },
  value: {
    fontSize: 30,
    fontWeight: '800',
    color: L.text,
    letterSpacing: -1,
    lineHeight: 34,
  },
  wideValue: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -1,
    lineHeight: 36,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
  wideLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  accentLine: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2.5,
    opacity: 0.5,
  },
});

// ─── Quick Action Row ─────────────────────────────────────────────────────────
const QuickActionRow = ({
  icon: Icon,
  title,
  subtitle,
  accent,
  accentLight,
  accentBorder,
  onPress,
  delay = 0,
}: {
  icon: any;
  title: string;
  subtitle: string;
  accent: string;
  accentLight: string;
  accentBorder: string;
  onPress: () => void;
  delay?: number;
}) => {
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(16)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 400, delay, useNativeDriver: true }),
      Animated.spring(slide, { toValue: 0, delay, tension: 90, friction: 12, useNativeDriver: true }),
    ]).start();
  }, []);

  const onPressIn = () =>
    Animated.spring(scale, { toValue: 0.975, tension: 200, friction: 10, useNativeDriver: true }).start();
  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, tension: 200, friction: 10, useNativeDriver: true }).start();

  return (
    <Animated.View style={{ opacity: fade, transform: [{ translateY: slide }, { scale }] }}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
      >
        <View
          style={[
            qaStyles.card,
            {
              backgroundColor: L.bgCard,
              borderColor: L.border,
              shadowColor: L.shadow.color,
              ...L.shadow.sm,
            },
          ]}
        >
          {/* Left accent stripe */}
          <View style={[qaStyles.stripe, { backgroundColor: accent }]} />

          {/* Icon */}
          <View
            style={[
              qaStyles.iconBox,
              { backgroundColor: accentLight, borderColor: accentBorder },
            ]}
          >
            <Icon size={18} color={accent} strokeWidth={2} />
          </View>

          {/* Text */}
          <View style={qaStyles.textGroup}>
            <Text style={[qaStyles.title, { color: L.text }]}>{title}</Text>
            <Text style={[qaStyles.subtitle, { color: L.textSub }]}>{subtitle}</Text>
          </View>

          {/* Arrow */}
          <View
            style={[
              qaStyles.arrow,
              { backgroundColor: accentLight, borderColor: accentBorder },
            ]}
          >
            <ChevronRight size={14} color={accent} strokeWidth={2.5} />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const qaStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    paddingRight: 14,
    gap: 14,
    overflow: 'hidden',
  },
  stripe: {
    position: 'absolute',
    left: 0,
    top: 10,
    bottom: 10,
    width: 3.5,
    borderRadius: 2,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textGroup: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 0.1,
  },
  arrow: {
    width: 30,
    height: 30,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// ─── Live Badge ──────────────────────────────────────────────────────────────
const LiveBadge = () => {
  const pulseScale = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseScale, { toValue: 1.6, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseOpacity, { toValue: 0, duration: 800, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(pulseScale, { toValue: 1, duration: 0, useNativeDriver: true }),
          Animated.timing(pulseOpacity, { toValue: 1, duration: 0, useNativeDriver: true }),
        ]),
        Animated.delay(600),
      ])
    ).start();
  }, []);

  return (
    <View style={liveStyles.badge}>
      <View style={liveStyles.dotWrapper}>
        {/* Pulse ring */}
        <Animated.View
          style={[
            liveStyles.pulseRing,
            { transform: [{ scale: pulseScale }], opacity: pulseOpacity },
          ]}
        />
        <View style={liveStyles.dot} />
      </View>
      <Text style={liveStyles.text}>Live</Text>
    </View>
  );
};

const liveStyles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#EDFAF4',
    borderWidth: 1,
    borderColor: 'rgba(14,164,114,0.22)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  dotWrapper: {
    width: 8,
    height: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: L.emerald,
    opacity: 0.3,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: L.emerald,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
    color: L.emeraldText,
    letterSpacing: 0.3,
  },
});

// ─── Section Header ──────────────────────────────────────────────────────────
const SectionHeader = ({
  title,
  right,
}: {
  title: string;
  right?: React.ReactNode;
}) => (
  <View style={sectionStyles.row}>
    <Text style={sectionStyles.title}>{title}</Text>
    {right}
  </View>
);

const sectionStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: L.text,
    letterSpacing: -0.4,
  },
});

// ─── Avatar Button ────────────────────────────────────────────────────────────
const AvatarButton = ({ email }: { email?: string }) => {
  const initials = (email ?? 'SA').split('@')[0].slice(0, 2).toUpperCase();
  return (
    <View style={avatarBtnStyles.wrap}>
      <LinearGradient
        colors={[L.gold, '#E08000']}
        style={avatarBtnStyles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={avatarBtnStyles.text}>{initials}</Text>
      </LinearGradient>
      {/* Online dot */}
      <View style={avatarBtnStyles.dot} />
    </View>
  );
};

const avatarBtnStyles = StyleSheet.create({
  wrap: {
    width: 40,
    height: 40,
    borderRadius: 13,
    overflow: 'visible',
    shadowColor: L.gold,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  gradient: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  dot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: L.emerald,
    borderWidth: 2,
    borderColor: L.bg,
  },
});

// ─── Icon Button ──────────────────────────────────────────────────────────────
const IconBtn = ({
  children,
  badge,
  onPress,
}: {
  children: React.ReactNode;
  badge?: boolean;
  onPress?: () => void;
}) => (
  <TouchableOpacity onPress={onPress} style={iconBtnStyles.btn} activeOpacity={0.75}>
    {children}
    {badge && <View style={iconBtnStyles.badge} />}
  </TouchableOpacity>
);

const iconBtnStyles = StyleSheet.create({
  btn: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: L.bgCard,
    borderWidth: 1,
    borderColor: L.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: L.shadow.color,
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  badge: {
    position: 'absolute',
    top: 7,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#F59E0B',
    borderWidth: 1.5,
    borderColor: L.bg,
  },
});

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function SuperAdminDashboard() {
  const router = useRouter();
  const { colors, isDark, toggleTheme } = useTheme();
  const { currentAdmin } = useAuth();

  // ── State (keep all variable names from original) ──
  const [stats, setStats] = useState({
    total_schools: 0,
    active_schools: 0,
    total_students: 0,
    total_staff: 0,
    total_super_admins: 0,
  });
  const [loading, setLoading] = useState(true);

  const headerFade = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerFade, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(headerSlide, { toValue: 0, tension: 80, friction: 12, useNativeDriver: true }),
    ]).start();
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const data = await superAdminApi.getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // ── Force light background for this component ──
  const bg = L.bg;

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      <StatusBar barStyle="dark-content" backgroundColor={bg} />

      {/* Warm gradient fill */}
      <LinearGradient
        colors={['#F0EDE7', '#F5F4F1', '#F8F7F5']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Very faint top decoration */}
      <View style={styles.topDecor} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* ── Header ── */}
        <Animated.View
          style={[
            styles.header,
            { opacity: headerFade, transform: [{ translateY: headerSlide }] },
          ]}
        >
          {/* Left: greeting + name */}
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>
              {getGreeting()} 👋
            </Text>
            <Text style={styles.name}>Super Admin</Text>
          </View>

          {/* Right: actions */}
          <View style={styles.headerActions}>
            <IconBtn onPress={toggleTheme}>
              <Moon size={17} color={L.textSub} strokeWidth={2} />
            </IconBtn>
            <IconBtn badge>
              <Bell size={17} color={L.textSub} strokeWidth={2} />
            </IconBtn>
            <AvatarButton email={currentAdmin?.email} />
          </View>
        </Animated.View>

        {/* ── Breadcrumb / Platform Tag ── */}
        <View style={styles.breadcrumbRow}>
          <View style={styles.breadcrumbPill}>
            <View style={[styles.breadcrumbDot, { backgroundColor: L.emerald }]} />
            <Text style={styles.breadcrumbText}>Super Admin Console</Text>
            <View style={styles.breadcrumbSep} />
            <Text style={[styles.breadcrumbText, { fontWeight: '700', color: L.goldText }]}>
              NexSyrus
            </Text>
          </View>
        </View>

        {/* Platform badge */}
        <View style={styles.platformRow}>
          <View style={[styles.platformBadge, { backgroundColor: L.goldLight, borderColor: L.goldBorder }]}>
            <Zap size={11} color={L.gold} strokeWidth={2.5} fill={L.gold} />
            <Text style={[styles.platformText, { color: L.goldText }]}>NexSyrus Platform</Text>
          </View>
        </View>

        {/* ── Overview Section ── */}
        <View style={styles.section}>
          <SectionHeader title="Overview" right={<LiveBadge />} />

          {/* 2×2 Grid */}
          <View style={styles.statsGrid}>
            <StatCard
              icon={School}
              value={stats.total_schools}
              label="Total Schools"
              accent={L.indigo}
              accentLight={L.indigoLight}
              accentBorder={L.indigoBorder}
              accentText={L.indigoText}
              delay={80}
            />
            <StatCard
              icon={CheckCircle2}
              value={stats.active_schools}
              label="Active Schools"
              accent={L.emerald}
              accentLight={L.emeraldLight}
              accentBorder={L.emeraldBorder}
              accentText={L.emeraldText}
              delay={140}
            />
            <StatCard
              icon={GraduationCap}
              value={stats.total_students}
              label="Total Students"
              accent={L.violet}
              accentLight={L.violetLight}
              accentBorder={L.violetBorder}
              accentText={L.violetText}
              delay={200}
            />
            <StatCard
              icon={Users}
              value={stats.total_staff}
              label="Total Staff"
              accent={L.amber}
              accentLight={L.amberLight}
              accentBorder={L.amberBorder}
              accentText={L.amberText}
              delay={260}
            />
          </View>

          {/* Wide Super Admins card */}
          <View style={{ marginTop: 12 }}>
            <StatCard
              icon={ShieldCheck}
              value={stats.total_super_admins}
              label="Super Admins"
              accent={L.gold}
              accentLight={L.goldLight}
              accentBorder={L.goldBorder}
              accentText={L.goldText}
              wide
              delay={320}
            />
          </View>
        </View>

        {/* ── Quick Actions ── */}
        <View style={styles.section}>
          <SectionHeader title="Quick Actions" />

          <View style={styles.actionsList}>
            <QuickActionRow
              icon={Building2}
              title="Add New School"
              subtitle="Register & onboard a school"
              accent={L.indigo}
              accentLight={L.indigoLight}
              accentBorder={L.indigoBorder}
              onPress={() => router.push('/schools/add' as any)}
              delay={100}
            />
            <QuickActionRow
              icon={ListChecks}
              title="View All Schools"
              subtitle="Manage school directory"
              accent={L.emerald}
              accentLight={L.emeraldLight}
              accentBorder={L.emeraldBorder}
              onPress={() => router.push('/schools' as any)}
              delay={180}
            />
            <QuickActionRow
              icon={Shield}
              title="Manage Admins"
              subtitle="Super admin access control"
              accent={L.gold}
              accentLight={L.goldLight}
              accentBorder={L.goldBorder}
              onPress={() => router.push('/admins' as any)}
              delay={260}
            />
          </View>
        </View>

        {/* Bottom breathing room */}
        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

// ─── Root Styles ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: L.bg,
  },
  topDecor: {
    position: 'absolute',
    top: -80,
    right: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(233,168,0,0.07)',
  },
  scroll: {
    paddingTop: Platform.OS === 'android' ? 52 : 60,
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  headerLeft: {
    gap: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  greeting: {
    fontSize: 13,
    fontWeight: '500',
    color: L.textSub,
    letterSpacing: 0.1,
  },
  name: {
    fontSize: 30,
    fontWeight: '900',
    color: L.text,
    letterSpacing: -0.8,
    lineHeight: 34,
  },

  // ── Breadcrumb ──
  breadcrumbRow: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 6,
  },
  breadcrumbPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: L.bgCard,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: L.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 8,
    shadowColor: L.shadow.color,
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  breadcrumbDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  breadcrumbText: {
    fontSize: 12,
    fontWeight: '500',
    color: L.textSub,
    letterSpacing: 0.1,
  },
  breadcrumbSep: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: L.textMuted,
  },

  // ── Platform badge ──
  platformRow: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 6,
  },
  platformBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  platformText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // ── Section ──
  section: {
    paddingHorizontal: 20,
    marginBottom: 28,
  },

  // ── Stats grid ──
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },

  // ── Actions list ──
  actionsList: {
    gap: 10,
  },
});