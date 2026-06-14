import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { __testing__ as expoAudioTesting } from 'expo-audio';
import { AyahAudioButton } from '../AyahAudioButton';
import { getAudioPlaybackState, stopAudio } from '../../../services/audio/audioRuntime';
import { useSettingsStore } from '../../../stores/settingsStore';

describe('AyahAudioButton', () => {
  beforeEach(async () => {
    await stopAudio();
    expoAudioTesting.clearPlayers();
    useSettingsStore.setState({
      theme: 'dark',
      reciterId: 'alafasy',
    });
  });

  it('plays and stops the selected ayah when pressed', async () => {
    const { findByLabelText } = render(
      <AyahAudioButton surahNumber={1} ayahNumber={1} />,
    );

    fireEvent.press(await findByLabelText('Play ayah 1:1 recitation'));
    expect(getAudioPlaybackState().playingUrl).toBe(
      'https://everyayah.com/data/Alafasy_128kbps/001001.mp3',
    );

    fireEvent.press(await findByLabelText('Stop ayah 1:1 recitation'));
    expect(getAudioPlaybackState()).toEqual({
      playingUrl: null,
      isLoading: false,
    });
  });

  it('uses the reciter setting by default', async () => {
    useSettingsStore.getState().setReciterId('husary');

    const { findByLabelText } = render(
      <AyahAudioButton surahNumber={2} ayahNumber={255} />,
    );

    fireEvent.press(await findByLabelText('Play ayah 2:255 recitation'));

    expect(getAudioPlaybackState().playingUrl).toBe(
      'https://everyayah.com/data/Husary_128kbps/002255.mp3',
    );
  });
});