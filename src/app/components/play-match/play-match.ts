
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatchesFirestoreService } from '../../services/matches-firestore.service';
import { IMatch } from '../../models/match.model';

@Component({
  selector: 'app-play-match',
  imports: [],
  templateUrl: './play-match.html',
  styleUrl: './play-match.css',
})
export class PlayMatch {
  private readonly route = inject(ActivatedRoute);
  private readonly matchesService = inject(MatchesFirestoreService);
  readonly match = signal<IMatch | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.matchesService.getMatchById(id)
        .then(match => {
          this.match.set(match);
          this.loading.set(false);
        })
        .catch(err => {
          this.error.set('Could not load match');
          this.loading.set(false);
        });
    } else {
      this.error.set('No match id provided');
      this.loading.set(false);
    }
  }
}
