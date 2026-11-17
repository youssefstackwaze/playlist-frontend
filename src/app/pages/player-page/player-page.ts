import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { Playlist, ShuffleStrategyInfo } from '../../core/models';
import { PlayerService } from '../../core/player.service';
import { DurationPipe } from '../../shared/duration.pipe';
import { GenreLabelPipe } from '../../shared/genre-label.pipe';

@Component({
  selector: 'app-player-page',
  imports: [RouterLink, DurationPipe, GenreLabelPipe],
  templateUrl: './player-page.html',
})
export class PlayerPage implements OnInit {
  private readonly api = inject(ApiService);
  protected readonly player = inject(PlayerService);

  protected readonly playlists = signal<Playlist[]>([]);
  protected readonly strategies = signal<ShuffleStrategyInfo[]>([]);
  protected readonly selectedPlaylist = signal<number | null>(null);
  protected readonly selectedStrategy = signal('smart');

  ngOnInit(): void {
    this.player.refresh();
    this.api.playlists().subscribe((list) => {
      this.playlists.set(list);
      const firstNonEmpty = list.find((p) => p.songCount > 0);
      if (firstNonEmpty) this.selectedPlaylist.set(firstNonEmpty.id);
    });
    this.api.shuffleStrategies().subscribe((list) => this.strategies.set(list));
  }

  protected load(): void {
    const id = this.selectedPlaylist();
    if (id != null) this.player.load(id, this.selectedStrategy(), true);
  }
}
