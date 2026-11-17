import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { GENRES, Genre, Playlist, Song } from '../../core/models';
import { NotificationService } from '../../core/notification.service';
import { DurationPipe } from '../../shared/duration.pipe';
import { GenreLabelPipe } from '../../shared/genre-label.pipe';

@Component({
  selector: 'app-song-catalog',
  imports: [RouterLink, DurationPipe, GenreLabelPipe],
  templateUrl: './song-catalog.html',
})
export class SongCatalog implements OnInit {
  private readonly api = inject(ApiService);
  private readonly notify = inject(NotificationService);

  protected readonly genres = GENRES;
  protected readonly songs = signal<Song[]>([]);
  protected readonly playlists = signal<Playlist[]>([]);
  protected readonly loading = signal(true);

  /** Server-side filter (GET /api/songs?genre=). */
  protected readonly genre = signal<Genre | null>(null);
  /** Client-side free text filter. */
  protected readonly query = signal('');
  protected readonly targetPlaylistId = signal<number | null>(null);

  protected readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    return q
      ? this.songs().filter((s) => `${s.title} ${s.artist} ${s.album}`.toLowerCase().includes(q))
      : this.songs();
  });

  protected readonly target = computed(
    () => this.playlists().find((p) => p.id === this.targetPlaylistId()) ?? null,
  );
  protected readonly targetSongIds = computed(() => new Set(this.target()?.songs.map((s) => s.id)));

  ngOnInit(): void {
    this.loadSongs();
    this.api.playlists().subscribe((list) => {
      this.playlists.set(list);
      if (list.length) this.targetPlaylistId.set(list[0].id);
    });
  }

  protected setGenre(value: string): void {
    this.genre.set((value || null) as Genre | null);
    this.loadSongs();
  }

  protected setTarget(value: string): void {
    this.targetPlaylistId.set(value ? Number(value) : null);
  }

  private loadSongs(): void {
    this.loading.set(true);
    this.api.songs(this.genre()).subscribe({
      next: (songs) => {
        this.songs.set(songs);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  protected add(song: Song): void {
    const target = this.target();
    if (!target) return;
    this.api.addSong(target.id, song.id).subscribe((updated) => {
      this.playlists.update((list) => list.map((p) => (p.id === updated.id ? updated : p)));
      this.notify.success(`« ${song.title} » ajoutée à « ${updated.name} »`);
    });
  }
}
