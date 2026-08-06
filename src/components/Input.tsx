import React from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  hint?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  containerStyle,
  hint,
  style,
  ...rest
}) => {
  const theme = useTheme();

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text
          style={[
            styles.label,
            {
              color: theme.colors.textSecondary,
              fontFamily: theme.typography.fontFamily.medium,
              fontSize: theme.typography.fontSize.sm,
            },
          ]}
        >
          {label}
        </Text>
      )}
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: theme.colors.surface,
            borderColor: error ? theme.colors.brand.error : theme.colors.border,
            color: theme.colors.text,
            fontFamily: theme.typography.fontFamily.regular,
            fontSize: theme.typography.fontSize.base,
          },
          style,
        ]}
        placeholderTextColor={theme.colors.textMuted}
        {...rest}
      />
      {hint && !error && (
        <Text style={[styles.hint, { color: theme.colors.textMuted }]}>{hint}</Text>
      )}
      {error && (
        <Text style={[styles.error, { color: theme.colors.brand.error }]}>{error}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  label: {
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 46,
  },
  hint: {
    marginTop: 4,
    fontSize: 12,
  },
  error: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '500',
  },
});
