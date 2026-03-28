
import { Component } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-banner',
  imports: [MatToolbarModule, RouterLink],
  templateUrl: './banner.html',
  styleUrl: './banner.css',
})
export class Banner {}
