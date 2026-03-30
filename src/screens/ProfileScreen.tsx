import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { useSettingsStore } from '../stores/settingsStore';
import { SegmentedControl } from '../components/SegmentedControl';
import { ArabicFontSize } from '../theme/typography';

const FONT_SIZE_SEGMENTS: { label: string; value: ArabicFontSize }[] = [
  { label: 'S', value: 'small' },
  { label: 'M', value: 'medium' },
  { label: 'L', value: 'large' },
];

export function ProfileScreen() {
  const arabicFontSize = useSettingsStore((s) => s.arabicFontSize);
  const showTransliteration = useSettingsStore((s) => s.showTransliteration);
  const setArabicFontSize = useSettingsStore((s) => s.setArabicFontSize);
  const setShowTransliteration = useSettingsStore((s) => s.setShowTransliteration);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Section header per D-06 */}
        <Text style={styles.sectionHeader}>Display</Text>

        {/* Arabic Font Size row per D-07, D-08 */}
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Arabic Font Size</Text>
          <SegmentedControl
            segments={FONT_SIZE_SEGMENTS}
            selectedValue={arabicFontSize}
            onValueChange={setArabicFontSize}
          />
        </View>

        {/* Transliteration toggle per D-07, D-13, D-14 */}
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Show Transliteration</Text>
          <Switch
            value={showTransliteration}
            onValueChange={setShowTransliteration}
            trackColor={{ false: '#3e3e3e', true: colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
  },
  sectionHeader: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowLabel: {
    color: colors.text,
    fontSize: 16,
  },
});
