import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PlayerService } from '../../core/player.service';
import { DurationPipe } from '../duration.pipe';

/** Persistent mini-player shown at the bottom of every page. */
@Component({
  selector: 'app-player-bar',
  imports: [RouterLink, DurationPipe],
  template: `
    @let s = player.state();
    @let song = player.current();
    <footer class="player-bar">
      <div class="pb-track">
        @if (song) {
          <div class="pb-cover" [attr.data-genre]="song.genre">♪</div>
          <div class="pb-meta">
            <a class="pb-title" routerLink="/player">{{ song.title }}</a>
            <span class="pb-artist">{{ song.artist }} · {{ s?.playlistName }}</span>
          </div>
        } @else {
          <span class="muted">Aucune playlist chargée</span>
        }
      </div>

      <div class="pb-center">
        <div class="pb-controls">
          <button class="icon-btn" title="Précédent" (click)="player.previous()" [disabled]="!player.hasQueue()">⏮</button>
          <button class="icon-btn play" [title]="player.isPlaying() ? 'Pause' : 'Lecture'"
                  (click)="player.togglePlay()" [disabled]="!player.hasQueue()">
            {{ player.isPlaying() ? '❚❚' : '▶' }}
          </button>
          <button class="icon-btn" title="Suivant" (click)="player.next()" [disabled]="!player.hasQueue()">⏭</button>
          <button class="icon-btn" title="Stop" (click)="player.stop()" [disabled]="!player.hasQueue()">■</button>
          <button class="icon-btn" title="Répéter" [class.on]="s?.repeat" (click)="player.toggleRepeat()">⟳</button>
        </div>
        <div class="pb-progress">
          <span>{{ player.elapsed() | duration }}</span>
          <div class="progress"><div class="progress-fill" [style.width.%]="player.progress()"></div></div>
          <span>{{ song?.durationSeconds | duration }}</span>
        </div>
      </div>

      <div class="pb-right">
        <span class="status-pill" [attr.data-status]="s?.status">{{ s?.status ?? '—' }}</span>
        <label class="pb-volume" title="Volume">
          🔊
          <input type="range" min="0" max="100" [value]="s?.volume ?? 50"
                 (change)="player.setVolume(+$any($event.target).value)" />
        </label>
      </div>
    </footer>
  `,
})
export class PlayerBar {
  protected readonly player = inject(PlayerService);
}
