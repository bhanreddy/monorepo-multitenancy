import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, TouchableOpacityProps } from 'react-native';
import { theme } from '../../constants/theme';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
}

export const Button: React.FC<ButtonProps> = ({ title, loading, variant = 'primary', style, ...props }) => {
  const getBackgroundColor = () => {
    switch (variant) {
      case 'secondary': return theme.colors.surface;
      case 'danger': return theme.colors.error;
      case 'primary':
      default: return theme.colors.primary;
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'secondary': return theme.colors.textPrimary;
      case 'danger': return theme.colors.textPrimary;
      case 'primary':
      default: return theme.colors.textPrimary;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: getBackgroundColor() },
        props.disabled && styles.disabled,
        style,
      ]}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <Text style={[styles.text, { color: getTextColor() }]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    ...theme.typography.h3,
  },
});
