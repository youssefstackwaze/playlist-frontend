import { HttpClient, HttpContext, HttpContextToken, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { apiBaseUrl } from './config';
import {
  Genre,
  PlayerState,
  Playlist,
  PlaylistAnalysis,
  PlaylistRequest,
  ShuffleStrategyInfo,
  SmartPlaylistRequest,
  SmartPlaylistResponse,
  Song,
} from './models';

/** When set on a request, the error interceptor does not show a toast. */
export const SILENT_ERRORS = new HttpContextToken<boolean>(() => false);

/** Thin typed wrapper around the Spring Boot REST API (proxied on /api). */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly base = apiBaseUrl;

  // ---------- Songs ----------

  songs(genre?: Genre | null, artist?: string | null): Observable<Song[]> {
    let params = new HttpParams();
    if (genre) params = params.set('genre', genre);
    if (artist) params = params.set('artist', artist);
    return this.http.get<Song[]>(`${this.base}/songs`, { params });
  }

  // ---------- Playlists ----------

  playlists(): Observable<Playlist[]> {
    return this.http.get<Playlist[]>(`${this.base}/playlists`);
  }

  playlist(id: number): Observable<Playlist> {
    return this.http.get<Playlist>(`${this.base}/playlists/${id}`);
  }

  createPlaylist(body: PlaylistRequest): Observable<Playlist> {
    return this.http.post<Playlist>(`${this.base}/playlists`, body);
  }

  updatePlaylist(id: number, body: PlaylistRequest): Observable<Playlist> {
    return this.http.put<Playlist>(`${this.base}/playlists/${id}`, body);
  }

  deletePlaylist(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/playlists/${id}`);
  }

  addSong(playlistId: number, songId: number, position?: number): Observable<Playlist> {
    return this.http.post<Playlist>(`${this.base}/playlists/${playlistId}/songs`, { songId, position });
  }

  removeSong(playlistId: number, songId: number): Observable<Playlist> {
    return this.http.delete<Playlist>(`${this.base}/playlists/${playlistId}/songs/${songId}`);
  }

  moveSong(playlistId: number, from: number, to: number): Observable<Playlist> {
    return this.http.put<Playlist>(`${this.base}/playlists/${playlistId}/songs/order`, { from, to });
  }

  // ---------- Advanced features ----------

  shuffleStrategies(): Observable<ShuffleStrategyInfo[]> {
    return this.http.get<ShuffleStrategyInfo[]>(`${this.base}/playlists/shuffle-strategies`);
  }

  shuffle(playlistId: number, strategy: string): Observable<Song[]> {
    return this.http.get<Song[]>(`${this.base}/playlists/${playlistId}/shuffle`, { params: { strategy } });
  }

  recommendations(playlistId: number, limit = 5): Observable<Song[]> {
    return this.http.get<Song[]>(`${this.base}/playlists/${playlistId}/recommendations`, { params: { limit } });
  }

  exportFormats(): Observable<string[]> {
    return this.http.get<string[]>(`${this.base}/playlists/export-formats`);
  }

  exportUrl(playlistId: number, format: string): string {
    return `${this.base}/playlists/${playlistId}/export?format=${encodeURIComponent(format)}`;
  }

  exportText(playlistId: number, format: string): Observable<string> {
    return this.http.get(this.exportUrl(playlistId, format), { responseType: 'text' });
  }

  analysis(playlistId: number): Observable<PlaylistAnalysis> {
    return this.http.get<PlaylistAnalysis>(`${this.base}/playlists/${playlistId}/analysis`);
  }

  createSmartPlaylist(body: SmartPlaylistRequest): Observable<SmartPlaylistResponse> {
    return this.http.post<SmartPlaylistResponse>(`${this.base}/playlists/smart`, body);
  }

  // ---------- Player ----------

  playerState(silent = false): Observable<PlayerState> {
    return this.http.get<PlayerState>(`${this.base}/player`, {
      context: new HttpContext().set(SILENT_ERRORS, silent),
    });
  }

  loadPlayer(playlistId: number, strategy: string, autoPlay: boolean): Observable<PlayerState> {
    return this.http.post<PlayerState>(`${this.base}/player/load/${playlistId}`, null, {
      params: { strategy, autoPlay },
    });
  }

  playerCommand(command: 'play' | 'pause' | 'stop' | 'next' | 'previous'): Observable<PlayerState> {
    return this.http.post<PlayerState>(`${this.base}/player/${command}`, null);
  }

  setRepeat(enabled: boolean): Observable<PlayerState> {
    return this.http.put<PlayerState>(`${this.base}/player/repeat`, null, { params: { enabled } });
  }

  setVolume(volume: number): Observable<PlayerState> {
    return this.http.put<PlayerState>(`${this.base}/player/volume`, { volume });
  }
}
