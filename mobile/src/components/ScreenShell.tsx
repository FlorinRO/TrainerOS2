import React, { ReactNode } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { colors } from '../constants/colors';

interface ScreenShellProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  includeTopInset?: boolean;
}

export default function ScreenShell({
  children,
  style,
  contentStyle,
  includeTopInset = false,
}: ScreenShellProps) {
  return (
    <View style={[styles.screen, style]}>
      <View style={styles.bgBase} />
      <View style={styles.grid} />
      <View style={styles.glowTop} />
      <View style={styles.glowRight} />
      <View style={styles.glowBottom} />
      <SafeAreaView
        edges={includeTopInset ? ['top', 'left', 'right', 'bottom'] : ['left', 'right', 'bottom']}
        style={[styles.content, contentStyle]}
      >
        {children}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.dark.bg,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
  },
  bgBase: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.dark.bg,
  },
  grid: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.18,
    backgroundColor: 'transparent',
    borderColor: 'rgba(255,255,255,0.02)',
    borderWidth: 0,
  },
  glowTop: {
    position: 'absolute',
    top: -120,
    left: -80,
    width: 280,
    height: 280,
    borderRadius: 999,
    backgroundColor: colors.glow.mint,
  },
  glowRight: {
    position: 'absolute',
    top: -40,
    right: -90,
    width: 300,
    height: 300,
    borderRadius: 999,
    backgroundColor: colors.glow.cyan,
  },
  glowBottom: {
    position: 'absolute',
    bottom: -180,
    left: 20,
    width: 340,
    height: 340,
    borderRadius: 999,
    backgroundColor: colors.glow.violet,
  },
});
