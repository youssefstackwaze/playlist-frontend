import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { Playlist, PlaylistAnalysis, ShuffleStrategyInfo, Song } from '../../core/models';
import { NotificationService } from '../../core/notification.service';
import { PlayerService } from '../../core/player.service';
import { DurationPipe } from '../../shared/duration.pipe';
import { GenreLabelPipe } from '../../shared/genre-label.pipe';

type Tab = 'recommendations' | 'shuffle' | 'analysis' | 'export';

@Component({
  selector: 'app-playlist-detail',
  imports: [ReactiveFormsModule, RouterLink, DurationPipe, GenreLabelPipe, DatePipe, DecimalPipe],
  templateUrl: './playlist-detail.html',
})
export class PlaylistDetail {
  private readonly api = inject(ApiService);
  private readonly notify = inject(NotificationService);
  private readonly router = inject(Router);
  protected readonly player = inject(PlayerService);

  /** Route parameter (bound through withComponentInputBinding). */
  readonly id = input.required<string>();

  protected readonly playlist = signal<Playlist | null>(null);
  protected readonly notFound = signal(false);
  protected readonly catalog = signal<Song[]>([]);
  protected readonly strategies = signal<ShuffleStrategyInfo[]>([]);
  protected readonly formats = signal<string[]>([]);

  // edition
  protected readonly editing = signal(false);
  protected readonly form = inject(FormBuilder).nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    description: [''],
    owner: [''],
  });

  // add songs
  protected readonly search = signal('');
  protected readonly addable = computed(() => {
    const inPlaylist = new Set(this.playlist()?.songs.map((s) => s.id));
    const q = this.search().trim().toLowerCase();
    return this.catalog()
      .filter((s) => !inPlaylist.has(s.id))
      .filter((s) => !q || `${s.title} ${s.artist} ${s.album} ${s.genre}`.toLowerCase().includes(q));
  });

  // playback
  protected readonly playStrategy = signal('smart');
  protected readonly isLoadedInPlayer = computed(
    () => this.player.state()?.playlistId === this.playlist()?.id,
  );

  // tabs
  protected readonly tab = signal<Tab>('recommendations');
  protected readonly recommendations = signal<Song[] | null>(null);
  protected readonly recoLimit = signal(5);
  protected readonly shuffleStrategy = signal('smart');
  protected readonly shuffled = signal<Song[] | null>(null);
  protected readonly shuffledRepeats = computed(() => countConsecutiveSameArtist(this.shuffled() ?? []));
  protected readonly currentRepeats = computed(() => countConsecutiveSameArtist(this.playlist()?.songs ?? []));
  protected readonly analysis = signal<PlaylistAnalysis | null>(null);
  protected readonly exportFormat = signal('m3u');
  protected readonly exportPreview = signal<string | null>(null);

  constructor() {
    effect(() => {
      const id = Number(this.id());
      untracked(() => this.load(id));
    });
    forkJoin({
      catalog: this.api.songs(),
      strategies: this.api.shuffleStrategies(),
      formats: this.api.exportFormats(),
    }).subscribe(({ catalog, strategies, formats }) => {
      this.catalog.set(catalog);
      this.strategies.set(strategies);
      this.formats.set(formats);
    });
  }

  // ---------- loading ----------

  private load(id: number): void {
    this.notFound.set(false);
    this.api.playlist(id).subscribe({
      next: (p) => this.setPlaylist(p),
      error: () => this.notFound.set(true),
    });
  }

  private setPlaylist(p: Playlist): void {
    this.playlist.set(p);
    this.refreshTab();
  }

  protected selectTab(tab: Tab): void {
    this.tab.set(tab);
    this.refreshTab();
  }

  /** (Re)computes the data shown in the active tab, since it depends on the playlist content. */
  private refreshTab(): void {
    const p = this.playlist();
    if (!p) return;
    switch (this.tab()) {
      case 'recommendations':
        this.loadRecommendations();
        break;
      case 'shuffle':
        this.shuffled.set(null);
        break;
      case 'analysis':
        this.api.analysis(p.id).subscribe((a) => this.analysis.set(a));
        break;
      case 'export':
        this.loadExportPreview();
        break;
    }
  }

  // ---------- metadata ----------

  protected startEdit(): void {
    const p = this.playlist();
    if (!p) return;
    this.form.setValue({ name: p.name, description: p.description ?? '', owner: p.owner ?? '' });
    this.editing.set(true);
  }

  protected saveEdit(): void {
    const p = this.playlist();
    if (!p || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { name, description, owner } = this.form.getRawValue();
    this.api.updatePlaylist(p.id, { name: name.trim(), description: description || null, owner: owner || null })
      .subscribe((updated) => {
        this.playlist.set(updated);
        this.editing.set(false);
        this.notify.success('Playlist mise à jour');
      });
  }

  protected deletePlaylist(): void {
    const p = this.playlist();
    if (!p || !confirm(`Supprimer la playlist « ${p.name} » ?`)) return;
    this.api.deletePlaylist(p.id).subscribe(() => {
      this.notify.success('Playlist supprimée');
      this.player.refresh();
      this.router.navigate(['/playlists']);
    });
  }

  // ---------- songs ----------

  protected addSong(song: Song): void {
    const p = this.playlist();
    if (!p) return;
    this.api.addSong(p.id, song.id).subscribe((updated) => {
      this.setPlaylist(updated);
      this.notify.success(`« ${song.title} » ajoutée`);
    });
  }

  protected removeSong(song: Song): void {
    const p = this.playlist();
    if (!p) return;
    this.api.removeSong(p.id, song.id).subscribe((updated) => this.setPlaylist(updated));
  }

  protected move(from: number, to: number): void {
    const p = this.playlist();
    if (!p || to < 0 || to >= p.songs.length) return;
    this.api.moveSong(p.id, from, to).subscribe((updated) => this.playlist.set(updated));
  }

  // ---------- playback ----------

  protected play(strategy = this.playStrategy()): void {
    const p = this.playlist();
    if (!p) return;
    this.player.load(p.id, strategy, true);
    this.notify.success(`Lecture de « ${p.name} » (shuffle ${strategy})`);
  }

  protected isCurrent(song: Song): boolean {
    return this.isLoadedInPlayer() && this.player.current()?.id === song.id;
  }

  // ---------- recommendations ----------

  protected loadRecommendations(): void {
    const p = this.playlist();
    if (!p) return;
    this.api.recommendations(p.id, this.recoLimit()).subscribe((r) => this.recommendations.set(r));
  }

  protected setRecoLimit(value: string): void {
    this.recoLimit.set(Math.max(1, Math.min(30, Number(value) || 5)));
    this.loadRecommendations();
  }

  protected addAllRecommendations(): void {
    const p = this.playlist();
    const recos = this.recommendations();
    if (!p || !recos?.length) return;
    const ids = [...p.songs.map((s) => s.id), ...recos.map((s) => s.id)];
    this.api.updatePlaylist(p.id, { name: p.name, description: p.description, owner: p.owner, songIds: ids })
      .subscribe((updated) => {
        this.setPlaylist(updated);
        this.notify.success(`${recos.length} recommandations ajoutées`);
      });
  }

  // ---------- shuffle ----------

  protected runShuffle(): void {
    const p = this.playlist();
    if (!p) return;
    this.api.shuffle(p.id, this.shuffleStrategy()).subscribe((songs) => this.shuffled.set(songs));
  }

  protected saveShuffledOrder(): void {
    const p = this.playlist();
    const songs = this.shuffled();
    if (!p || !songs) return;
    this.api.updatePlaylist(p.id, {
      name: p.name, description: p.description, owner: p.owner, songIds: songs.map((s) => s.id),
    }).subscribe((updated) => {
      this.playlist.set(updated);
      this.notify.success('Nouvel ordre enregistré');
    });
  }

  protected isRepeat(list: Song[], i: number): boolean {
    return i > 0 && list[i].artist.toLowerCase() === list[i - 1].artist.toLowerCase();
  }

  // ---------- analysis ----------

  protected genreEntries(a: PlaylistAnalysis): { genre: string; count: number; pct: number }[] {
    return Object.entries(a.genres.counts)
      .map(([genre, count]) => ({ genre, count, pct: a.genres.percentages[genre] ?? 0 }))
      .sort((x, y) => y.count - x.count);
  }

  protected artistEntries(a: PlaylistAnalysis): { artist: string; count: number }[] {
    return Object.entries(a.artists.songsPerArtist)
      .map(([artist, count]) => ({ artist, count }))
      .sort((x, y) => y.count - x.count);
  }

  // ---------- export ----------

  protected setExportFormat(format: string): void {
    this.exportFormat.set(format);
    this.loadExportPreview();
  }

  private loadExportPreview(): void {
    const p = this.playlist();
    if (!p) return;
    this.api.exportText(p.id, this.exportFormat()).subscribe((text) => this.exportPreview.set(text));
  }

  protected exportUrl(format: string): string {
    return this.api.exportUrl(this.playlist()?.id ?? 0, format);
  }
}

function countConsecutiveSameArtist(songs: Song[]): number {
  let n = 0;
  for (let i = 1; i < songs.length; i++) {
    if (songs[i].artist.toLowerCase() === songs[i - 1].artist.toLowerCase()) n++;
  }
  return n;
}
