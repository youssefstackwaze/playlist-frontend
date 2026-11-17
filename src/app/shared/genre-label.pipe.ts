import { Pipe, PipeTransform } from '@angular/core';

const LABELS: Record<string, string> = {
  ROCK: 'Rock',
  POP: 'Pop',
  JAZZ: 'Jazz',
  BLUES: 'Blues',
  CLASSICAL: 'Classique',
  ELECTRONIC: 'Électro',
  HIP_HOP: 'Hip-hop',
  RNB: 'R&B',
  METAL: 'Metal',
  FOLK: 'Folk',
};

@Pipe({ name: 'genreLabel' })
export class GenreLabelPipe implements PipeTransform {
  transform(genre: string | null | undefined): string {
    return genre ? (LABELS[genre] ?? genre) : '';
  }
}
