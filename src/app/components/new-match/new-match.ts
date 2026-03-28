import { Component, signal, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

import { MatchesFirestoreService } from '../../services/matches-firestore.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-new-match',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './new-match.html',
  styleUrl: './new-match.css',
})
export class NewMatch {
  private readonly matchesFirestore = inject(MatchesFirestoreService);
  private readonly router = inject(Router);

  readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(50)] })
  });

  get name() {
    return this.form.get('name') as FormControl<string>;
  }

  async onSubmit() {
    if (this.form.invalid) return;
    try {
      let matchId: string = await this.matchesFirestore.addMatch(this.name.value ?? '');
      // Navigate to the play match page
      this.router.navigate(['/play-match', matchId]);
    } catch (err) {
      // TODO: show error to user
      console.error('Failed to create match:', err);
    }
  }
}
