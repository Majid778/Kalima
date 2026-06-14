type AudioSource = string | null;

interface MockAudioPlayer {
  source: AudioSource;
  playing: boolean;
  removed: boolean;
  play: () => void;
  pause: () => void;
  replace: (source: AudioSource) => void;
  remove: () => void;
  seekTo: (seconds: number) => Promise<void>;
}

const players: MockAudioPlayer[] = [];

export function createAudioPlayer(source: AudioSource = null): MockAudioPlayer {
  const player: MockAudioPlayer = {
    source,
    playing: false,
    removed: false,
    play() {
      player.playing = true;
    },
    pause() {
      player.playing = false;
    },
    replace(nextSource: AudioSource) {
      player.source = nextSource;
    },
    remove() {
      player.removed = true;
      player.playing = false;
    },
    async seekTo() {
      return Promise.resolve();
    },
  };

  players.push(player);
  return player;
}

export async function setAudioModeAsync(): Promise<void> {
  return Promise.resolve();
}

export const __testing__ = {
  clearPlayers(): void {
    players.length = 0;
  },
  getPlayers(): MockAudioPlayer[] {
    return [...players];
  },
};