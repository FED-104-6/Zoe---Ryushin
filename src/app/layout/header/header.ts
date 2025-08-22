import { Component, OnInit, Output, EventEmitter, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MaterialModule } from '../../services/ui/material.module';
import { AuthService } from '../../auth/auth.service';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { User } from '@angular/fire/auth';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [MaterialModule, RouterModule, CommonModule],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header implements OnInit {
  @Output() public sideNavToggle = new EventEmitter();
  private authService: AuthService = inject(AuthService);
  user$: Observable<User | null> = this.authService.user$;

  constructor() {}

  ngOnInit(): void {}
  onToggleSideNav() {
    this.sideNavToggle.emit();
  }

  onSignOut() {
    this.authService.logout();
  }
}
