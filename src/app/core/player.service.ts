import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, catchError, finalize, of, switchMap, timer } from 'rxjs';
import { ApiService } from './api.service';
import { PlayerState } from './models';

/**
 * Front-end view of the global player held by the backend.
 * The backend is the single source of truth: the state is refreshed after every
 * command and polled every few seconds (so several tabs stay in sync).
 * Playback progress is simulated client-side from each song's duration; when a
 * song ends, the service asks the backend for the next one.
 */
@Injectable({ providedIn: 'root' })
export class PlayerService {
  private readonly api = inject(ApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly state = signal<PlayerState | null>(null);
  readonly elapsed = signal(0);
  readonly busy = signal(false);

  readonly current = computed(() => this.state()?.currentSong ?? null);
  readonly isPlaying = computed(() => this.state()?.status === 'PLAYING');
  readonly hasQueue = computed(() => (this.state()?.queueSize ?? 0) > 0);
  readonly progress = computed(() => {
    const song = this.current();
    return song && song.durationSeconds > 0 ? Math.min(100, (this.elapsed() / song.durationSeconds) * 100) : 0;
  });

  private trackKey = '';

  constructor() {
    timer(0, 5000)
      .pipe(
        switchMap(() => this.api.playerState(true).pipe(catchError(() => of(null)))),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((s) => s && this.apply(s));

    const ticker = setInterval(() => this.tick(), 1000);
    this.destroyRef.onDestroy(() => clearInterval(ticker));
  }

  load(playlistId: number, strategy: string, autoPlay = true): void {
    this.run(this.api.loadPlayer(playlistId, strategy, autoPlay));
  }

  play(): void {
    this.run(this.api.playerCommand('play'));
  }

  pause(): void {
    this.run(this.api.playerCommand('pause'));
  }

  togglePlay(): void {
    if (this.isPlaying()) {
      this.pause();
    } else {
      this.play();
    }
  }

  stop(): void {
    this.run(this.api.playerCommand('stop'));
  }

  next(): void {
    this.run(this.api.playerCommand('next'));
  }

  previous(): void {
    this.run(this.api.playerCommand('previous'));
  }

  toggleRepeat(): void {
    this.run(this.api.setRepeat(!this.state()?.repeat));
  }

  setVolume(volume: number): void {
    this.run(this.api.setVolume(volume));
  }

  refresh(): void {
    this.api.playerState(true).subscribe({ next: (s) => this.apply(s), error: () => undefined });
  }

  /** Applies a state coming from the backend (used by other pages after a multi-step operation). */
  apply(s: PlayerState): void {
    const key = `${s.playlistId}|${s.currentIndex}|${s.currentSong?.id}`;
    if (key !== this.trackKey || s.status === 'STOPPED') {
      this.trackKey = key;
      this.elapsed.set(0);
    }
    this.state.set(s);
  }

  private run(request: Observable<PlayerState>): void {
    this.busy.set(true);
    request.pipe(finalize(() => this.busy.set(false))).subscribe({
      next: (s) => this.apply(s),
      error: () => undefined, // toast already shown by the interceptor
    });
  }

  private tick(): void {
    const s = this.state();
    if (s?.status !== 'PLAYING' || !s.currentSong || this.busy()) {
      return;
    }
    const elapsed = this.elapsed() + 1;
    if (elapsed >= s.currentSong.durationSeconds) {
      this.next();
    } else {
      this.elapsed.set(elapsed);
    }
  }
}
