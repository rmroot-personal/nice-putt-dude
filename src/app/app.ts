import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Banner } from "./components/banner/banner";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Banner],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {

}
