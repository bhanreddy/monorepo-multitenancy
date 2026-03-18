import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Sun, Moon } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
  showThemeToggle?: boolean;
}

export function ScreenHeader({
  title,
  subtitle,
  showBack = true,
  rightAction,
  showThemeToggle = true,
}: ScreenHeaderProps) {
  const router = useRouter();
  const { colors, isDark, toggleTheme } = useTheme();
  const backScaleAnim = useRef(new Animated.Value(1)).current;
  const toggleScaleAnim = useRef(new Animated.Value(1)).current;

  const onBackPressIn = () => {
    Animated.spring(backScaleAnim, {
      toValue: 0.85,
      tension: 300,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  const onBackPressOut = () => {
    Animated.spring(backScaleAnim, {
      toValue: 1,
      tension: 200,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  const onTogglePressIn = () => {
    Animated.spring(toggleScaleAnim, {
      toValue: 0.85,
      tension: 300,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  const onTogglePressOut = () => {
    Animated.spring(toggleScaleAnim, {
      toValue: 1,
      tension: 200,
      friction: 10,
      useNativeDriver: true,
    }).start();
    toggleTheme();
  };

  const statusBarHeight =
    Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 48;

  const glassButtonStyle = {
    backgroundColor: colors.glassBackground,
    borderColor: colors.glassBorder,
  };

  return (
    <View style={[styles.wrapper, { paddingTop: statusBarHeight, backgroundColor: colors.headerGradientStart }]}>
      <LinearGradient
        colors={[colors.headerGradientStart, colors.headerGradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.container}>
        {/* Left: Back button */}
        {showBack ? (
          <Animated.View style={{ transform: [{ scale: backScaleAnim }] }}>
            <TouchableOpacity
              onPress={() => router.back()}
              onPressIn={onBackPressIn}
              onPressOut={onBackPressOut}
              activeOpacity={1}
              style={[styles.backButton, glassButtonStyle]}
            >
              <ArrowLeft size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <View style={styles.backPlaceholder} />
        )}

        {/* Center: Title & Subtitle */}
        <View style={styles.titleBlock}>
          <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>

        {/* Right: Theme toggle + Action slot */}
        <View style={styles.rightArea}>
          {showThemeToggle && (
            <Animated.View style={{ transform: [{ scale: toggleScaleAnim }] }}>
              <TouchableOpacity
                onPressIn={onTogglePressIn}
                onPressOut={onTogglePressOut}
                activeOpacity={1}
                style={[styles.themeToggleButton, glassButtonStyle]}
              >
                {isDark ? (
                  <Sun size={18} color="#F5A623" />
                ) : (
                  <Moon size={18} color="#6C63FF" />
                )}
              </TouchableOpacity>
            </Animated.View>
          )}
          {rightAction && (
            <View style={styles.rightSlot}>{rightAction}</View>
          )}
        </View>
      </View>

      {/* Bottom gradient separator */}
      <LinearGradient
        colors={[
          isDark ? 'rgba(108, 99, 255, 0.15)' : 'rgba(108, 99, 255, 0.08)',
          'rgba(108, 99, 255, 0)',
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.bottomGlow}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {},
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backPlaceholder: {
    width: 40,
  },
  titleBlock: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
    letterSpacing: 0.2,
  },
  rightArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  themeToggleButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightSlot: {},
  bottomGlow: {
    height: 3,
  },
});
