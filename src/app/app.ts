
import { Component, inject, effect } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { Banner } from "./components/banner/banner";
import { UserService } from './services/user.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Banner],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);

  constructor() {
    effect(() => {
      if (!this.userService.user() && this.router.url.includes('manage-profile') == false) {
        this.router.navigateByUrl('/');
      }
    });
  }
}