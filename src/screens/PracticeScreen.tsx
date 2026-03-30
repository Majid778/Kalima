import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

export function PracticeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Practice</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: colors.textMuted,
    fontSize: 16,
  },
});
