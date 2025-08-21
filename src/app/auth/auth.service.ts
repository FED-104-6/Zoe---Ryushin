import { Injectable, inject, signal, computed } from '@angular/core';
import {
  Auth,
  authState,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  signInWithPopup,
  User,
  updateProfile,
} from '@angular/fire/auth';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';
import { map, Observable } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private router = inject(Router);

  user$: Observable<User | null> = authState(this.auth);
  private _user = signal<User | null>(null);
  user = computed(() => this._user);

  constructor() {
    this.user$.subscribe((u) => this._user.set(u));
  }

  async signUpWithDetails(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    birthDate: Date
  ) {
    const cred = await createUserWithEmailAndPassword(
      this.auth,
      email,
      password
    );

    const userDocRef = doc(this.firestore, `users/${cred.user.uid}`);
    await setDoc(userDocRef, {
      firstName,
      lastName,
      birthDate: birthDate.toISOString(),
      email: cred.user.email,
      createdAt: new Date().toISOString(),
    });
    return cred;
  }

  async signInWithEmail(email: string, password: string, redirectUrl?: string) {
    await signInWithEmailAndPassword(this.auth, email, password);
    return this.router.navigateByUrl(redirectUrl || '/new-flat');
  }

  logout() {
    return signOut(this.auth);
  }
}
