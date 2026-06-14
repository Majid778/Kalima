import React, { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/useTheme';
import { hapticLight } from '../../theme/motion';
import { useAudioPlayback, playAyah, stopAudio } from '../../services/audio/audioRuntime';
import { ayahAudioUrl, getReciterById } from '../../services/audio/audioSource';
import { useSettingsStore } from '../../stores/settingsStore';

export interface AyahAudioButtonProps {
  surahNumber: number;
  ayahNumber: number;
  reciterId?: string;
  size?: number;
}

export function AyahAudioButton({
  surahNumber,
  ayahNumber,
  reciterId: customReciterId,
  size = 48,
}: AyahAudioButtonProps): React.ReactElement {
  const theme = useTheme();
  const playbackState = useAudioPlayback();
  const settingsReciterId = useSettingsStore((s) => s.reciterId);

  const reciterId = customReciterId ?? settingsReciterId;
  const reciter = useMemo(() => getReciterById(reciterId), [reciterId]);
  const audioUrl = useMemo(
    () => ayahAudioUrl(reciter, surahNumber, ayahNumber),
    [reciter, surahNumber, ayahNumber],
  );

  const isPlayingThisAyah = playbackState.playingUrl === audioUrl;
  const isLoading = playbackState.isLoading && isPlayingThisAyah;

  const handlePress = useCallback(async () => {
    await hapticLight();
    if (isPlayingThisAyah) {
      await stopAudio();
    } else {
      await playAyah(audioUrl);
    }
  }, [isPlayingThisAyah, audioUrl]);

  const accessibilityLabel = isPlayingThisAyah
    ? `Stop āyah ${surahNumber}:${ayahNumber} recitation`
    : `Play āyah ${surahNumber}:${ayahNumber} recitation`;

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.button,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: pressed ? theme.colors.primaryDark : theme.colors.primary,
        },
      ]}
      accessible
      accessibilityLabel={accessibilityLabel}
      testID={`ayah-button-${surahNumber}-${ayahNumber}`}
    >
      <View style={styles.iconContainer}>
        {isLoading ? (
          <ActivityIndicator size="small" color={theme.colors.text} />
        ) : isPlayingThisAyah ? (
          <Ionicons name="pause" size={size * 0.5} color={theme.colors.text} />
        ) : (
          <Ionicons name="play" size={size * 0.5} color={theme.colors.text} />
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
