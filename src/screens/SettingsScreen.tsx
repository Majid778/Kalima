import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSettingsStore } from '../stores/settingsStore';
import { SegmentedControl } from '../components/SegmentedControl';
import { AppIcon } from '../components/AppIcon';
import { display, fonts } from '../theme/typography';
import { mushafPalette } from '../theme/palette';
import { ArabicFontSize } from '../theme/typography';
import type { RootStackParamList } from '../navigation/RootStackNavigator';
import { RECITERS, getReciterById } from '../services/audio/audioSource';

const FONT_SIZE_SEGMENTS: { label: string; value: ArabicFontSize }[] = [
  { label: 'S', value: 'small' },
  { label: 'M', value: 'medium' },
  { label: 'L', value: 'large' },
];

const RECITER_SEGMENTS = RECITERS.map((reciter) => ({
  label: reciter.name.split(' ')[0],
  value: reciter.id,
}));

const APP_VERSION = '1.0.0';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

function formatReminderTime(hour: number): string {
  if (hour <= 6) return 'After Fajr';
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:00 ${period}`;
}

export function SettingsScreen() {
  const navigation = useNavigation<NavProp>();

  const themeName = useSettingsStore((s) => s.theme);
  const arabicFontSize = useSettingsStore((s) => s.arabicFontSize);
  const showTransliteration = useSettingsStore((s) => s.showTransliteration);
  const reciterId = useSettingsStore((s) => s.reciterId);
  const notificationsEnabled = useSettingsStore((s) => s.notifications.enabled);
  const preferredHour = useSettingsStore((s) => s.notifications.preferredHour);
  const setNotificationPrefs = useSettingsStore((s) => s.setNotificationPrefs);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const setArabicFontSize = useSettingsStore((s) => s.setArabicFontSize);
  const setShowTransliteration = useSettingsStore((s) => s.setShowTransliteration);
  const setReciterId = useSettingsStore((s) => s.setReciterId);
  const autoPlayAudio = useSettingsStore((s) => s.autoPlayAudio);
  const setAutoPlayAudio = useSettingsStore((s) => s.setAutoPlayAudio);

  const selectedReciter = useMemo(() => getReciterById(reciterId), [reciterId]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Back"
          activeOpacity={0.8}
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <AppIcon name="chevron-left" size={22} color={mushafPalette.ink} strokeWidth={1.8} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>RECITATION</Text>
        <View style={styles.card}>
          <View style={styles.rowStacked}>
            <View style={styles.rowTextBlock}>
              <Text style={styles.rowLabel}>Reciter</Text>
              <Text style={styles.rowHint}>{selectedReciter.name}</Text>
            </View>
            <SegmentedControl
              segments={RECITER_SEGMENTS}
              selectedValue={reciterId}
              onValueChange={setReciterId}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Auto-play recitation</Text>
            <GoldToggle
              value={autoPlayAudio}
              onValueChange={setAutoPlayAudio}
              accessibilityLabel="Auto-play recitation"
            />
          </View>
        </View>

        <Text style={styles.eyebrow}>READING</Text>
        <View style={styles.card}>
          <View style={styles.rowStacked}>
            <Text style={styles.rowLabel}>Arabic font size</Text>
            <SegmentedControl
              segments={FONT_SIZE_SEGMENTS}
              selectedValue={arabicFontSize}
              onValueChange={setArabicFontSize}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <View style={styles.rowTextBlock}>
              <Text style={styles.rowLabel}>Theme</Text>
              <Text style={styles.rowHint}>{themeName === 'dark' ? 'Dark' : 'Mushaf'}</Text>
            </View>
            <GoldToggle
              value={themeName === 'dark'}
              onValueChange={(enabled) => setTheme(enabled ? 'dark' : 'mushaf')}
              accessibilityLabel="Theme"
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Show transliteration</Text>
            <GoldToggle
              value={showTransliteration}
              onValueChange={setShowTransliteration}
              accessibilityLabel="Show transliteration"
            />
          </View>
        </View>

        <Text style={styles.eyebrow}>REMINDERS</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Daily reminder</Text>
            <GoldToggle
              value={notificationsEnabled}
              onValueChange={(enabled) => setNotificationPrefs({ enabled })}
              accessibilityLabel="Daily reminder"
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Reminder time</Text>
            <Text style={styles.rowValueGold}>{formatReminderTime(preferredHour)}</Text>
          </View>
        </View>

        <Text style={styles.eyebrow}>ABOUT</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>About Kalima</Text>
            <AppIcon name="chevron-right" size={18} color={mushafPalette.goldDeep} strokeWidth={1.7} />
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Version</Text>
            <Text style={styles.rowValueMuted}>{APP_VERSION}</Text>
          </View>
        </View>

        <Text style={styles.dua}>{'رَّبِّ زِدْنِى عِلْمًا'}</Text>
        <Text style={styles.duaGloss}>My Lord, increase me in knowledge</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function GoldToggle({
  value,
  onValueChange,
  accessibilityLabel,
}: {
  value: boolean;
  onValueChange: (val: boolean) => void;
  accessibilityLabel: string;
}) {
  return (
    <TouchableOpacity
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value }}
      activeOpacity={0.8}
      onPress={() => onValueChange(!value)}
      style={[toggleStyles.track, value ? toggleStyles.trackOn : toggleStyles.trackOff]}
    >
      <View style={[toggleStyles.thumb, value ? toggleStyles.thumbOn : toggleStyles.thumbOff]} />
    </TouchableOpacity>
  );
}

const toggleStyles = StyleSheet.create({
  track: {
    width: 44,
    height: 26,
    borderRadius: 999,
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  trackOn: {
    backgroundColor: mushafPalette.gold,
  },
  trackOff: {
    backgroundColor: mushafPalette.goldRing,
  },
  thumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: mushafPalette.paper,
  },
  thumbOn: {
    alignSelf: 'flex-end',
  },
  thumbOff: {
    alignSelf: 'flex-start',
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: mushafPalette.parchment,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: mushafPalette.goldLine,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: mushafPalette.paper,
    borderWidth: 1,
    borderColor: mushafPalette.goldLine,
  },
  headerTitle: {
    fontSize: 21,
    color: mushafPalette.ink,
    fontFamily: display.bold,
  },
  content: {
    paddingHorizontal: 22,
    paddingBottom: 36,
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 1.2,
    color: mushafPalette.muted,
    marginHorizontal: 4,
    marginTop: 18,
    marginBottom: 8,
    fontFamily: display.semibold,
  },
  card: {
    backgroundColor: mushafPalette.paper,
    borderWidth: 1,
    borderColor: mushafPalette.goldLine,
    borderRadius: 16,
    paddingHorizontal: 14,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  rowStacked: {
    paddingVertical: 14,
    gap: 12,
  },
  rowTextBlock: {
    flexShrink: 1,
    marginRight: 12,
  },
  rowLabel: {
    fontSize: 13,
    color: mushafPalette.ink,
    fontFamily: display.regular,
  },
  rowHint: {
    fontSize: 12,
    color: mushafPalette.muted,
    marginTop: 3,
    fontFamily: display.regular,
  },
  rowValueGold: {
    fontSize: 13,
    color: mushafPalette.goldDeep,
    fontFamily: display.medium,
  },
  rowValueMuted: {
    fontSize: 13,
    color: mushafPalette.muted,
    fontFamily: display.regular,
  },
  divider: {
    height: 1,
    backgroundColor: mushafPalette.goldLine,
    opacity: 0.7,
  },
  dua: {
    textAlign: 'center',
    color: mushafPalette.goldDeep,
    fontSize: 19,
    lineHeight: 30,
    marginTop: 22,
    opacity: 0.9,
    fontFamily: fonts.arabic,
  },
  duaGloss: {
    textAlign: 'center',
    fontSize: 11,
    color: mushafPalette.muted,
    marginTop: 5,
    fontFamily: display.regular,
  },
});
