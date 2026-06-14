declare module 'expo-audio' {
  export interface AudioPlayer {
    play: () => void;
    pause: () => void;
    replace: (source: string | null) => void;
    remove: () => void;
    seekTo: (seconds: number) => Promise<void> | void;
    playing: boolean;
    removed: boolean;
  }

  export function createAudioPlayer(source?: string | null): AudioPlayer;

  export function setAudioModeAsync(options: {
    playsInSilentMode?: boolean;
    shouldPlayInBackground?: boolean;
    interruptionMode?: string;
  }): Promise<void>;

  export const __testing__: {
    clearPlayers: () => void;
    getPlayers: () => AudioPlayer[];
  };
}