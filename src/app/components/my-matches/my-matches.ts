

import { Component, signal, inject } from '@angular/core';
import { MatchesFirestoreService } from '../../services/matches-firestore.service';
import { IMatch } from '../../models/match.model';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatError } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-my-matches',
  imports: [RouterLink, MatCardModule, MatListModule, MatProgressSpinnerModule, MatError, MatIcon],
  templateUrl: './my-matches.html',
  styleUrl: './my-matches.css',
})
export class MyMatches {
  private readonly matchesService = inject(MatchesFirestoreService);
  readonly matches = signal<IMatch[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  constructor() {
    this.matchesService.getMatchesForCurrentUser()
      .then(matches => {
        this.matches.set(matches);
        this.loading.set(false);
      })
      .catch(err => {
        this.error.set('Failed to load matches');
        this.loading.set(false);
      });
  }
}
