import { Component, EventEmitter, OnInit, Output, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MaterialModule } from '../../services/ui/material.module';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-side-nav',
  standalone: true,
  imports: [MaterialModule, RouterModule],
  templateUrl: './side-nav.html',
  styleUrl: './side-nav.css',
})
export class SideNav implements OnInit {
  private authService = inject(AuthService);
  @Output() sidenavClose = new EventEmitter();
  constructor() {}
  ngOnInit() {}
  public onSidenavClose = () => {
    this.sidenavClose.emit();
  };

  onSignOut() {
    this.authService.logout();
  }
}
