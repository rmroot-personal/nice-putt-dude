
import { Component, inject, effect } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { Banner } from "./components/banner/banner";
import { UserService } from './services/user.service';
import { FunctionsService } from './services/functions.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Banner],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);
  private readonly functionsService = inject(FunctionsService);

  constructor() {
    effect(() => {
      if (!this.userService.user() && this.router.url.includes('manage-profile') == false) {
        this.router.navigateByUrl('/');
      }
    });
  }

  callHelloWorld() {
        // Call helloWorld function and log the result
    this.functionsService.callHelloWorld()
      .then(result => console.log('helloWorld result:', result))
      .catch(err => console.error('helloWorld error:', err));
  }

}