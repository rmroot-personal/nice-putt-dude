import { Component, inject, computed } from '@angular/core';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-manage-profile',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './manage-profile.html',
  styleUrl: './manage-profile.css',
})
export class ManageProfile {
  private readonly userService = inject(UserService);
  readonly user = computed(() => this.userService.user());

  readonly form = new FormGroup({
    displayName: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(50)] })
  });

  get displayName() {
    return this.form.get('displayName') as FormControl<string>;
  }

  ngOnInit() {
    // Pre-fill display name if available
    const user = this.user();
    if (user && user.displayName) {
      this.displayName.setValue(user.displayName);
    }
  }

  async onSubmit() {
    if (this.form.invalid) return;
    try {
      await this.userService.updateProfile(this.displayName.value ?? '', null);
      // Optionally show a success message
    } catch (err) {
      // TODO: handle error (show message to user)
    }
  }
}
