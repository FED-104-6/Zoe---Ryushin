import { Component, inject, signal, OnInit } from '@angular/core';
import { MaterialModule } from '../../services/ui/material.module';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Auth, User } from '@angular/fire/auth';
import { doc, getDoc, Firestore } from '@angular/fire/firestore';
import { UserProfile } from '../../models/user-profile';

@Component({
  selector: 'app-profile.component',
  imports: [CommonModule, MaterialModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent implements OnInit {
  private afAuth = inject(Auth);
  private db = inject(Firestore);
  private router = inject(Router);

  profile = signal<UserProfile | null>(null);

  async ngOnInit() {
    const user =
      this.afAuth.currentUser ??
      (await new Promise<User | null>((res) => {
        const unsub = this.afAuth.onAuthStateChanged((u) => {
          res(u);
          unsub();
        });
      }));
    if (!user) {
      this.router.navigateByUrl('/login');
      return;
    }
    const snap = await getDoc(doc(this.db, `users/${user.uid}`));
    this.profile.set(snap.data() as UserProfile | null);
  }

  goEdit() {
    this.router.navigateByUrl('/profile/edit');
  }
}
