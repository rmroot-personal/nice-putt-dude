import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Banner } from "./banner/banner";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Banner],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('nice-putt-dude');
}
