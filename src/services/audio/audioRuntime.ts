import { useEffect, useState } from 'react';

export interface AudioPlaybackState {
  playingUrl: string | null;
  isLoading: boolean;
}

interface AudioPlayer {
  play: () => void;
  pause?: () => void;
  replace?: (source: string | null) => void;
  remove?: () => void;
  seekTo?: (seconds: number) => Promise<void> | void;
}

interface ExpoAudioModule {
  createAudioPlayer: (source?: string | null) => AudioPlayer;
  setAudioModeAsync?: (options: {
    playsInSilentMode?: boolean;
    shouldPlayInBackground?: boolean;
    interruptionMode?: string;
  }) => Promise<void>;
}

type Listener = (state: AudioPlaybackState) => void;

let state: AudioPlaybackState = {
  playingUrl: null,
  isLoading: false,
};
let currentPlayer: AudioPlayer | null = null;
let requestId = 0;
let warnedMissingExpoAudio = false;

const listeners = new Set<Listener>();

function emit(nextState: AudioPlaybackState): void {
  state = nextState;
  listeners.forEach((listener) => listener(state));
}

function loadExpoAudio(): ExpoAudioModule | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const expoAudio = require('expo-audio') as Partial<ExpoAudioModule>;

    if (typeof expoAudio.createAudioPlayer === 'function') {
      return expoAudio as ExpoAudioModule;
    }
  } catch {
    // expo-audio is optional in this sandbox fallback path.
  }

  return null;
}

function reportMissingExpoAudio(): void {
  if (warnedMissingExpoAudio) return;
  warnedMissingExpoAudio = true;
  console.warn('expo-audio is unavailable; ayah recitation is disabled until the native module is installed.');
}

function disposeCurrentPlayer(): void {
  const player = currentPlayer;
  currentPlayer = null;

  if (!player) return;

  try {
    player.pause?.();
    player.remove?.();
  } catch {
    // Playback cleanup is best-effort and should never block UI flows.
  }
}

export function getAudioPlaybackState(): AudioPlaybackState {
  return state;
}

export function subscribeAudioPlayback(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useAudioPlayback(): AudioPlaybackState {
  const [playbackState, setPlaybackState] = useState<AudioPlaybackState>(() => getAudioPlaybackState());

  useEffect(() => subscribeAudioPlayback(setPlaybackState), []);

  return playbackState;
}

export async function stopAudio(): Promise<void> {
  requestId += 1;
  disposeCurrentPlayer();
  emit({ playingUrl: null, isLoading: false });
}

export async function playAyah(url: string): Promise<void> {
  const activeRequestId = requestId + 1;
  requestId = activeRequestId;

  disposeCurrentPlayer();
  emit({ playingUrl: url, isLoading: true });

  try {
    const expoAudio = loadExpoAudio();
    if (!expoAudio) {
      reportMissingExpoAudio();
      if (requestId === activeRequestId) {
        emit({ playingUrl: null, isLoading: false });
      }
      return;
    }

    await expoAudio.setAudioModeAsync?.({ playsInSilentMode: true });

    const player = expoAudio.createAudioPlayer(url);
    currentPlayer = player;
    player.seekTo?.(0);
    player.play();

    if (requestId === activeRequestId) {
      emit({ playingUrl: url, isLoading: false });
    }
  } catch (error) {
    console.warn('Unable to play ayah audio:', error);
    if (requestId === activeRequestId) {
      disposeCurrentPlayer();
      emit({ playingUrl: null, isLoading: false });
    }
  }
}