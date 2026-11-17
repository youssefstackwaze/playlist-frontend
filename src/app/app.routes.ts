import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'playlists' },
  {
    path: 'playlists',
    title: 'Playlists',
    loadComponent: () => import('./pages/playlist-list/playlist-list').then((m) => m.PlaylistList),
  },
  {
    path: 'playlists/:id',
    title: 'Playlist',
    loadComponent: () => import('./pages/playlist-detail/playlist-detail').then((m) => m.PlaylistDetail),
  },
  {
    path: 'songs',
    title: 'Catalogue',
    loadComponent: () => import('./pages/song-catalog/song-catalog').then((m) => m.SongCatalog),
  },
  {
    path: 'smart',
    title: 'Smart playlist',
    loadComponent: () => import('./pages/smart-playlist/smart-playlist').then((m) => m.SmartPlaylist),
  },
  {
    path: 'player',
    title: 'Lecteur',
    loadComponent: () => import('./pages/player-page/player-page').then((m) => m.PlayerPage),
  },
  { path: '**', redirectTo: 'playlists' },
];
