import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { backendUrl } from './core/config';
import { NotificationService } from './core/notification.service';
import { PlayerBar } from './shared/player-bar/player-bar';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, PlayerBar],
  templateUrl: './app.html',
})
export class App {
  protected readonly notifications = inject(NotificationService);
  protected readonly swaggerUrl = `${backendUrl}/swagger-ui.html`;
}
