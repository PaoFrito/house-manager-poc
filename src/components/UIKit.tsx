import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';

interface BadgeProps {
  label: string;
  color?: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'muted';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ label, color = 'primary', size = 'sm' }) => {
  const theme = useTheme();

  const colorMap = {
    primary: { bg: theme.colors.brand.primary + '30', text: theme.colors.brand.primary },
    success: { bg: theme.colors.brand.success + '30', text: theme.colors.brand.success },
    warning: { bg: theme.colors.brand.warning + '30', text: theme.colors.brand.warning },
    error: { bg: theme.colors.brand.error + '30', text: theme.colors.brand.error },
    info: { bg: theme.colors.brand.info + '30', text: theme.colors.brand.info },
    muted: { bg: theme.colors.borderSubtle, text: theme.colors.textMuted },
  };

  const { bg, text } = colorMap[color];

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: bg, paddingHorizontal: size === 'sm' ? 8 : 12, paddingVertical: size === 'sm' ? 3 : 5 },
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: text, fontSize: size === 'sm' ? 11 : 13 },
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  action?: { label: string; onPress: () => void };
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, subtitle, action }) => {
  const theme = useTheme();
  return (
    <View style={styles.emptyContainer}>
      {icon && (
        <Ionicons
          name={icon}
          size={48}
          color={theme.colors.textMuted}
          style={styles.emptyIcon}
        />
      )}
      <Text style={[styles.emptyTitle, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily.semiBold }]}>
        {title}
      </Text>
      {subtitle && (
        <Text style={[styles.emptySubtitle, { color: theme.colors.textMuted }]}>{subtitle}</Text>
      )}
      {action && (
        <TouchableOpacity style={[styles.emptyAction, { borderColor: theme.colors.brand.primary }]} onPress={action.onPress}>
          <Text style={[styles.emptyActionText, { color: theme.colors.brand.primary }]}>{action.label}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

interface FABProps {
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
}

export const FAB: React.FC<FABProps> = ({ onPress, icon = 'add' }) => {
  const theme = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[
        styles.fab,
        { backgroundColor: theme.colors.brand.primary, shadowColor: theme.colors.brand.primary },
      ]}
    >
      <Ionicons name={icon} size={28} color="#fff" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: 17,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyAction: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  emptyActionText: {
    fontWeight: '600',
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
});
