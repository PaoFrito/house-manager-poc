import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  title?: string;
  elevated?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, style, title, elevated }) => {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: elevated ? theme.colors.surfaceElevated : theme.colors.card,
          borderColor: theme.colors.border,
          shadowColor: theme.isDark ? '#000' : '#b0b8e0',
        },
        style,
      ]}
    >
      {title && (
        <Text
          style={[
            styles.title,
            {
              color: theme.colors.text,
              fontFamily: theme.typography.fontFamily.semiBold,
              fontSize: theme.typography.fontSize.md,
              marginBottom: theme.spacing.md,
            },
          ]}
        >
          {title}
        </Text>
      )}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    letterSpacing: 0.2,
  },
});
