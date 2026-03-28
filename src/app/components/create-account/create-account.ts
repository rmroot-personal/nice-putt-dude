
import { Component, inject } from '@angular/core';
import { UserService } from '../../services/user.service';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';

@Component({
  selector: 'app-create-account',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './create-account.html',
  styleUrl: './create-account.css',
})
export class CreateAccount {
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);
  readonly form = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(6)] })
  });

  get email() {
    return this.form.get('email') as FormControl<string>;
  }
  get password() {
    return this.form.get('password') as FormControl<string>;
  }

  async onSubmit() {
    if (this.form.invalid) return;
    try {
      await this.userService.createAccountWithEmail(this.email.value ?? '', this.password.value ?? '');
      // navigate to the home page after account creation
      this.router.navigateByUrl('/');
    } catch (err) {
      // TODO: handle error (show message to user)
    }
  }
}
