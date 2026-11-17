import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { Playlist } from '../../core/models';
import { NotificationService } from '../../core/notification.service';
import { PlayerService } from '../../core/player.service';
import { DurationPipe } from '../../shared/duration.pipe';

@Component({
  selector: 'app-playlist-list',
  imports: [ReactiveFormsModule, RouterLink, DurationPipe, DatePipe],
  templateUrl: './playlist-list.html',
})
export class PlaylistList implements OnInit {
  private readonly api = inject(ApiService);
  private readonly notify = inject(NotificationService);
  private readonly router = inject(Router);
  protected readonly player = inject(PlayerService);

  protected readonly playlists = signal<Playlist[]>([]);
  protected readonly loading = signal(true);
  protected readonly showForm = signal(false);
  protected readonly saving = signal(false);

  protected readonly form = inject(FormBuilder).nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    description: [''],
    owner: [''],
  });

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.api.playlists().subscribe({
      next: (list) => {
        this.playlists.set(list);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  protected create(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    const { name, description, owner } = this.form.getRawValue();
    this.api.createPlaylist({ name: name.trim(), description: description || null, owner: owner || null, songIds: [] })
      .subscribe({
        next: (p) => {
          this.saving.set(false);
          this.notify.success(`Playlist « ${p.name} » créée`);
          this.router.navigate(['/playlists', p.id]);
        },
        error: () => this.saving.set(false),
      });
  }

  protected play(p: Playlist): void {
    this.player.load(p.id, 'smart', true);
    this.notify.success(`Lecture de « ${p.name} » (shuffle smart)`);
  }

  protected remove(p: Playlist): void {
    if (!confirm(`Supprimer la playlist « ${p.name} » ?`)) {
      return;
    }
    this.api.deletePlaylist(p.id).subscribe(() => {
      this.playlists.update((list) => list.filter((x) => x.id !== p.id));
      this.notify.success('Playlist supprimée');
      this.player.refresh();
    });
  }
}
