

import { Component, computed, inject } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-banner',
  imports: [MatToolbarModule, MatMenuModule, MatIconModule, MatButtonModule, RouterLink],
  templateUrl: './banner.html',
  styleUrl: './banner.css',
})
export class Banner {
  private readonly userService = inject(UserService);
  readonly user = computed(() => this.userService.user());

  signOut() {
    void this.userService.signOut();
  }
}
