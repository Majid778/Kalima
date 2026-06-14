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

  const handlePress = useCallback(() => {
    hapticLight();
    if (isPlayingThisAyah) {
      stopAudio();
    } else {
      playAyah(audioUrl);
    }
  }, [isPlayingThisAyah, audioUrl]);

  const accessibilityLabel = isPlayingThisAyah
    ? `Stop ayah ${surahNumber}:${ayahNumber} recitation`
    : `Play ayah ${surahNumber}:${ayahNumber} recitation`;

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.button,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: pressed ? theme.action.actionPressed : theme.action.action,
        },
      ]}
      accessible
      accessibilityLabel={accessibilityLabel}
      testID={`ayah-button-${surahNumber}-${ayahNumber}`}
    >
      <View style={styles.iconContainer}>
        {isLoading ? (
          <ActivityIndicator size="small" color={theme.text.onAction} />
        ) : isPlayingThisAyah ? (
          <Ionicons name="pause" size={size * 0.5} color={theme.text.onAction} />
        ) : (
          <Ionicons name="play" size={size * 0.5} color={theme.text.onAction} />
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
