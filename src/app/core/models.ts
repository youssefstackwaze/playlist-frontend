export type Genre =
  | 'ROCK' | 'POP' | 'JAZZ' | 'BLUES' | 'CLASSICAL'
  | 'ELECTRONIC' | 'HIP_HOP' | 'RNB' | 'METAL' | 'FOLK';

export const GENRES: Genre[] = [
  'ROCK', 'POP', 'JAZZ', 'BLUES', 'CLASSICAL', 'ELECTRONIC', 'HIP_HOP', 'RNB', 'METAL', 'FOLK',
];

export interface Song {
  id: number;
  title: string;
  artist: string;
  album: string;
  genre: Genre;
  durationSeconds: number;
  filePath: string;
}

export interface Playlist {
  id: number;
  name: string;
  description: string | null;
  owner: string | null;
  createdAt: string;
  updatedAt: string;
  songCount: number;
  totalDurationSeconds: number;
  songs: Song[];
}

export interface PlaylistRequest {
  name: string;
  description?: string | null;
  owner?: string | null;
  /** Omit to keep the current songs on update. */
  songIds?: number[];
}

export interface ShuffleStrategyInfo {
  name: string;
  description: string;
}

export type PlayerStatus = 'STOPPED' | 'PLAYING' | 'PAUSED';

export interface PlayerState {
  status: PlayerStatus;
  playlistId: number | null;
  playlistName: string | null;
  currentSong: Song | null;
  currentIndex: number;
  queueSize: number;
  shuffleStrategy: string | null;
  repeat: boolean;
  volume: number;
  queue: Song[];
}

export interface SmartPlaylistRequest {
  name: string;
  description?: string | null;
  owner?: string | null;
  seedSongIds: number[];
  recommendationCount: number;
  shuffleStrategy: string;
  autoPlay: boolean;
}

export interface SmartPlaylistResponse {
  playlist: Playlist;
  addedRecommendations: Song[];
  shuffleStrategy: string;
  player: PlayerState;
}

export interface PlaylistAnalysis {
  playlistId: number;
  playlistName: string;
  songCount: number;
  duration: {
    totalSeconds: number;
    formatted: string;
    averageSeconds: number;
    longest?: string;
    shortest?: string;
  };
  genres: {
    counts: Record<string, number>;
    percentages: Record<string, number>;
    dominantGenre?: string;
  };
  artists: {
    uniqueArtists: number;
    songsPerArtist: Record<string, number>;
    diversityRatio: number;
    consecutiveSameArtist: number;
  };
}

export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
}
