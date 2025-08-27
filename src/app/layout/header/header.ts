import {
  Component,
  OnInit,
  Output,
  EventEmitter,
  inject,
  signal,
} from '@angular/core';
import { Firestore, doc, onSnapshot } from '@angular/fire/firestore';
import { RouterModule } from '@angular/router';
import { MaterialModule } from '../../services/ui/material.module';
import { AuthService } from '../../auth/auth.service';
import { AsyncPipe, CommonModule, NgIf } from '@angular/common';
import { Observable } from 'rxjs';
import { User } from '@angular/fire/auth';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [MaterialModule, RouterModule, CommonModule, AsyncPipe, NgIf],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header implements OnInit {
  @Output() public sideNavToggle = new EventEmitter();
  private authService: AuthService = inject(AuthService);
  user$: Observable<User | null> = this.authService.user$;
  // isAdmin$ = this.authService.isAdmin$;

  public auth = inject(AuthService);
  private afs = inject(Firestore);

  isAdmin = signal<boolean>(false);

  constructor() {
    this.authService.user$.subscribe((user) => {
      if (user?.uid) {
        const ref = doc(this.afs, 'users', user.uid);
        onSnapshot(ref, (snap) => {
          this.isAdmin.set(!!snap.data()?.['isAdmin']);
        });
      } else {
        this.isAdmin.set(false);
      }
    });
  }

  ngOnInit(): void {}
  onToggleSideNav() {
    this.sideNavToggle.emit();
  }

  onSignOut() {
    this.authService.logout();
  }
}
