import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { ShuffleStrategyInfo, SmartPlaylistResponse, Song } from '../../core/models';
import { NotificationService } from '../../core/notification.service';
import { PlayerService } from '../../core/player.service';
import { DurationPipe } from '../../shared/duration.pipe';
import { GenreLabelPipe } from '../../shared/genre-label.pipe';

/** Multi-step operation: create + recommend + shuffle + play, in one API call. */
@Component({
  selector: 'app-smart-playlist',
  imports: [ReactiveFormsModule, RouterLink, DurationPipe, GenreLabelPipe],
  templateUrl: './smart-playlist.html',
})
export class SmartPlaylist implements OnInit {
  private readonly api = inject(ApiService);
  private readonly notify = inject(NotificationService);
  private readonly player = inject(PlayerService);

  protected readonly catalog = signal<Song[]>([]);
  protected readonly strategies = signal<ShuffleStrategyInfo[]>([]);
  protected readonly seeds = signal<Song[]>([]);
  protected readonly search = signal('');
  protected readonly submitting = signal(false);
  protected readonly result = signal<SmartPlaylistResponse | null>(null);

  protected readonly form = inject(FormBuilder).nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    description: [''],
    owner: [''],
    recommendationCount: [5, [Validators.required, Validators.min(0), Validators.max(50)]],
    shuffleStrategy: ['smart'],
    autoPlay: [true],
  });

  protected readonly seedIds = computed(() => new Set(this.seeds().map((s) => s.id)));
  protected readonly candidates = computed(() => {
    const q = this.search().trim().toLowerCase();
    return this.catalog().filter(
      (s) => !q || `${s.title} ${s.artist} ${s.genre}`.toLowerCase().includes(q),
    );
  });

  ngOnInit(): void {
    this.api.songs().subscribe((songs) => this.catalog.set(songs));
    this.api.shuffleStrategies().subscribe((list) => this.strategies.set(list));
  }

  protected toggleSeed(song: Song): void {
    this.seeds.update((list) =>
      list.some((s) => s.id === song.id) ? list.filter((s) => s.id !== song.id) : [...list, song],
    );
  }

  protected submit(): void {
    if (this.form.invalid || this.seeds().length === 0) {
      this.form.markAllAsTouched();
      if (this.seeds().length === 0) this.notify.error('Sélectionnez au moins un titre de départ');
      return;
    }
    const v = this.form.getRawValue();
    this.submitting.set(true);
    this.api.createSmartPlaylist({
      name: v.name.trim(),
      description: v.description || null,
      owner: v.owner || null,
      seedSongIds: this.seeds().map((s) => s.id),
      recommendationCount: v.recommendationCount,
      shuffleStrategy: v.shuffleStrategy,
      autoPlay: v.autoPlay,
    }).subscribe({
      next: (res) => {
        this.submitting.set(false);
        this.result.set(res);
        this.player.apply(res.player);
        this.notify.success(`Smart playlist « ${res.playlist.name} » créée`);
      },
      error: () => this.submitting.set(false),
    });
  }

  protected reset(): void {
    this.result.set(null);
    this.seeds.set([]);
    this.form.reset();
  }
}
