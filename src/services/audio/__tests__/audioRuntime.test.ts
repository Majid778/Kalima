import { __testing__ as expoAudioTesting } from 'expo-audio';
import {
  getAudioPlaybackState,
  playAyah,
  stopAudio,
  subscribeAudioPlayback,
} from '../audioRuntime';

describe('audioRuntime', () => {
  beforeEach(async () => {
    await stopAudio();
    expoAudioTesting.clearPlayers();
  });

  it('publishes loading and playing state for a streamed ayah URL', async () => {
    const snapshots: ReturnType<typeof getAudioPlaybackState>[] = [];
    const unsubscribe = subscribeAudioPlayback((state) => snapshots.push(state));

    await playAyah('https://everyayah.com/data/Alafasy_128kbps/001001.mp3');

    unsubscribe();
    expect(snapshots).toContainEqual({
      playingUrl: 'https://everyayah.com/data/Alafasy_128kbps/001001.mp3',
      isLoading: true,
    });
    expect(getAudioPlaybackState()).toEqual({
      playingUrl: 'https://everyayah.com/data/Alafasy_128kbps/001001.mp3',
      isLoading: false,
    });
    expect(expoAudioTesting.getPlayers()[0]?.playing).toBe(true);
  });

  it('stops the current player before starting another ayah', async () => {
    await playAyah('https://everyayah.com/data/Alafasy_128kbps/001001.mp3');
    await playAyah('https://everyayah.com/data/Alafasy_128kbps/001002.mp3');

    const players = expoAudioTesting.getPlayers();
    expect(players).toHaveLength(2);
    expect(players[0]?.removed).toBe(true);
    expect(players[0]?.playing).toBe(false);
    expect(players[1]?.playing).toBe(true);
    expect(getAudioPlaybackState().playingUrl).toBe(
      'https://everyayah.com/data/Alafasy_128kbps/001002.mp3',
    );
  });

  it('resets playback state when stopped', async () => {
    await playAyah('https://everyayah.com/data/Alafasy_128kbps/001001.mp3');
    await stopAudio();

    expect(getAudioPlaybackState()).toEqual({
      playingUrl: null,
      isLoading: false,
    });
    expect(expoAudioTesting.getPlayers()[0]?.removed).toBe(true);
  });
});