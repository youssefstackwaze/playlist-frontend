import { Pipe, PipeTransform } from '@angular/core';

/** Formats seconds as m:ss, or h:mm:ss above one hour. */
@Pipe({ name: 'duration' })
export class DurationPipe implements PipeTransform {
  transform(totalSeconds: number | null | undefined): string {
    const total = Math.max(0, Math.floor(totalSeconds ?? 0));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = String(total % 60).padStart(2, '0');
    return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`;
  }
}
