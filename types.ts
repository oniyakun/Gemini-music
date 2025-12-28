export interface LyricLine {
  time: number; // Start time in seconds
  text: string;
  translation?: string;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  audioUrl: string;
  duration: number; // in seconds
  lyrics: LyricLine[];
  dominantColor?: string;
}

export enum PlaybackState {
  PAUSED,
  PLAYING,
}

export type ViewMode = 'LIBRARY' | 'LYRICS';