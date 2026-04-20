import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  StyleProp,
} from 'react-native';
import { colors } from '../constants/colors';

interface ButtonProps {
  onPress: () => void;
  title: string;
  variant?: 'primary' | 'outline' | 'secondary';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export default function Button({
  onPress,
  title,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  textStyle,
}: ButtonProps) {
  const buttonStyles = [
    styles.button,
    variant === 'primary' && styles.primaryButton,
    variant === 'outline' && styles.outlineButton,
    variant === 'secondary' && styles.secondaryButton,
    (disabled || loading) && styles.disabledButton,
    style,
  ];

  const textStyles = [
    styles.text,
    variant === 'primary' && styles.primaryText,
    variant === 'outline' && styles.outlineText,
    variant === 'secondary' && styles.secondaryText,
    (disabled || loading) && styles.disabledText,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.88}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.text.darkOnAccent : colors.text.primary} />
      ) : (
        <Text style={textStyles}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 20,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    minHeight: 50,
  },
  primaryButton: {
    backgroundColor: colors.brand.primary,
    borderWidth: 1,
    borderColor: colors.brand.secondary,
    shadowColor: colors.brand.secondary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.26,
    shadowRadius: 26,
    elevation: 8,
  },
  outlineButton: {
    backgroundColor: 'rgba(114, 202, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(114, 202, 255, 0.30)',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.045)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
  },
  disabledButton: {
    opacity: 0.5,
  },
  text: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  disabledText: {
    opacity: 0.7,
  },
  primaryText: {
    color: colors.text.darkOnAccent,
  },
  outlineText: {
    color: '#CFF5FF',
  },
  secondaryText: {
    color: colors.text.primary,
  },
});
