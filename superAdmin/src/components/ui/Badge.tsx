import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface BadgeProps {
  label: string;
  variant?: 'success' | 'warning' | 'error' | 'primary';
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'primary' }) => {
  const { colors } = useTheme();
  
  const getColors = () => {
    switch (variant) {
      case 'success':
        return { bg: `${colors.success}22`, text: colors.success };
      case 'warning':
        return { bg: `${colors.warning}22`, text: colors.warning };
      case 'error':
        return { bg: `${colors.error}22`, text: colors.error };
      case 'primary':
      default:
        return { bg: colors.primaryDim, text: colors.primary };
    }
  };

  const { bg, text } = getColors();

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color: text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9999,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
