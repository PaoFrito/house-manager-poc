import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled,
  loading,
  icon,
  style,
  textStyle,
}) => {
  const theme = useTheme();

  const sizeStyles = {
    sm: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8 },
    md: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12 },
    lg: { paddingVertical: 16, paddingHorizontal: 28, borderRadius: 14 },
  };

  const textSizes = {
    sm: 13,
    md: 15,
    lg: 16,
  };

  const variantStyles: Record<string, ViewStyle> = {
    primary: { backgroundColor: theme.colors.brand.primary },
    secondary: { backgroundColor: theme.colors.surfaceElevated, borderWidth: 1, borderColor: theme.colors.border },
    ghost: { backgroundColor: 'transparent' },
    danger: { backgroundColor: theme.colors.brand.error },
  };

  const variantTextColor: Record<string, string> = {
    primary: '#ffffff',
    secondary: theme.colors.text,
    ghost: theme.colors.brand.primary,
    danger: '#ffffff',
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.base,
        sizeStyles[size],
        variantStyles[variant],
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variantTextColor[variant]} size="small" />
      ) : (
        <View style={styles.row}>
          {icon && <View style={styles.iconWrap}>{icon}</View>}
          <Text
            style={[
              styles.text,
              { color: variantTextColor[variant], fontSize: textSizes[size] },
              textStyle,
            ]}
          >
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    marginRight: 8,
  },
  text: {
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  disabled: {
    opacity: 0.45,
  },
});
