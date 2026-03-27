import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-welcome',
  imports: [
    MatCardModule,
    MatButtonModule
  ],
  templateUrl: './welcome.html',
  styleUrl: './welcome.css',
})
export class Welcome {}
