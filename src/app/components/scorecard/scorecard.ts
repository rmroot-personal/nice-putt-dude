import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ScorecardFirestoreService } from '../../services/scorecard-firestore.service';
import { IScorecard } from '../../models/scorecard.model';

@Component({
  selector: 'app-scorecard',
  imports: [RouterLink],
  templateUrl: './scorecard.html',
  styleUrl: './scorecard.css',
})
export class Scorecard {
  private readonly route = inject(ActivatedRoute);
  private readonly scorecardService = inject(ScorecardFirestoreService);
  readonly scorecard = signal<IScorecard | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.scorecardService.getScorecardById(id)
        .then(sc => {
          this.scorecard.set(sc);
          this.loading.set(false);
        })
        .catch(() => {
          this.error.set('Could not load scorecard');
          this.loading.set(false);
        });
    } else {
      this.error.set('No scorecard id provided');
      this.loading.set(false);
    }
  }
}
