// ─── Color Tokens ───────────────────────────────────────────────────────────
export interface ThemeColors {
  background: string;
  surface: string;
  card: string;
  border: string;
  primary: string;
  primaryDim: string;
  accent: string;
  textPrimary: string;
  textSecondary: string;
  success: string;
  warning: string;
  error: string;

  // Tab bar
  tabBarBackground: string;
  tabBarGlass: string;
  tabBarBorder: string;
  tabBarActive: string;
  tabBarInactive: string;

  // Header
  headerGradientStart: string;
  headerGradientEnd: string;

  // Glass
  glassBackground: string;
  glassBorder: string;
}

// ─── Shared Tokens (spacing, radius, typography) ────────────────────────────
const sharedTokens = {
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    xxl: 24,
    full: 9999,
  },
  typography: {
    h1: { fontSize: 32, fontWeight: '700' as const },
    h2: { fontSize: 24, fontWeight: '700' as const },
    h3: { fontSize: 20, fontWeight: '600' as const },
    body: { fontSize: 16, fontWeight: '400' as const },
    bodySmall: { fontSize: 14, fontWeight: '400' as const },
    caption: { fontSize: 12, fontWeight: '400' as const },
  },
};

// ─── Dark Theme ─────────────────────────────────────────────────────────────
export const darkTheme = {
  colors: {
    background: '#0A0A0F',
    surface: '#13131A',
    card: '#1C1C27',
    border: '#2A2A3D',
    primary: '#6C63FF',
    primaryDim: '#6C63FF22',
    accent: '#FF6B6B',
    textPrimary: '#FFFFFF',
    textSecondary: '#9999BB',
    success: '#00D68F',
    warning: '#FFB800',
    error: '#FF4D4D',

    tabBarBackground: '#0C0F1D',
    tabBarGlass: 'rgba(12, 15, 29, 0.82)',
    tabBarBorder: 'rgba(108, 99, 255, 0.12)',
    tabBarActive: '#6C63FF',
    tabBarInactive: '#4A4E6A',

    headerGradientStart: '#0D1226',
    headerGradientEnd: '#080B18',

    glassBackground: 'rgba(255, 255, 255, 0.04)',
    glassBorder: 'rgba(255, 255, 255, 0.08)',
  } as ThemeColors,
  ...sharedTokens,
};

// ─── Light Theme ────────────────────────────────────────────────────────────
export const lightTheme = {
  colors: {
    background: '#F4F5FA',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    border: '#E2E4ED',
    primary: '#6C63FF',
    primaryDim: '#6C63FF18',
    accent: '#FF6B6B',
    textPrimary: '#1A1B2E',
    textSecondary: '#6B6F8A',
    success: '#00B876',
    warning: '#E5A600',
    error: '#E04040',

    tabBarBackground: '#FFFFFF',
    tabBarGlass: 'rgba(255, 255, 255, 0.92)',
    tabBarBorder: 'rgba(108, 99, 255, 0.10)',
    tabBarActive: '#6C63FF',
    tabBarInactive: '#A0A3B5',

    headerGradientStart: '#EDEEF5',
    headerGradientEnd: '#F4F5FA',

    glassBackground: 'rgba(0, 0, 0, 0.03)',
    glassBorder: 'rgba(0, 0, 0, 0.06)',
  } as ThemeColors,
  ...sharedTokens,
};

// ─── Default export for backward compatibility ──────────────────────────────
export const theme = darkTheme;
