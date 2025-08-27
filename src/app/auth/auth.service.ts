import { Injectable, inject, signal, computed } from '@angular/core';
import {
  Auth,
  authState,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  setPersistence,
  browserSessionPersistence,
  User,
  updateProfile,
} from '@angular/fire/auth';
import {
  Firestore,
  doc,
  setDoc,
  serverTimestamp,
  Timestamp,
  docData,
} from '@angular/fire/firestore';
import { map, Observable, of, switchMap } from 'rxjs';
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

  private sessionTimer: any = null;
  private startSessionTimer(ms: number) {
    if (this.sessionTimer) clearTimeout(this.sessionTimer);
    this.sessionTimer = setTimeout(() => {
      this.logout();
    }, ms);
  }

  constructor() {
    this.user$.subscribe((u) => this._user.set(u));

    this.user$.subscribe((u) => {
      if (!u && this.sessionTimer) {
        clearTimeout(this.sessionTimer);
        this.sessionTimer = null;
      }
    });
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

    await updateProfile(cred.user, { displayName: `${firstName} ${lastName}` });

    const userDocRef = doc(this.firestore, `users/${cred.user.uid}`);
    await setDoc(
      userDocRef,
      {
        firstName,
        lastName,
        birthDate: Timestamp.fromDate(birthDate),
        email: cred.user.email,
        isAdmin: false,
        createdAt: serverTimestamp(),
      },
      { merge: true }
    );

    await this.router.navigateByUrl('/');
    this.startSessionTimer(60 * 60 * 1000);
    return cred;
  }

  async signInWithEmail(email: string, password: string, redirectUrl?: string) {
    await setPersistence(this.auth, browserSessionPersistence);

    await signInWithEmailAndPassword(this.auth, email, password);

    this.startSessionTimer(60 * 60 * 1000);
    return this.router.navigateByUrl(redirectUrl || '/');
  }

  async logout() {
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
      this.sessionTimer = null;
    }
    await signOut(this.auth);
    return this.router.navigateByUrl('/login');
  }

  isAdmin$: Observable<boolean> = this.user$.pipe(
    switchMap((u) => {
      if (!u) return of(false);
      return docData(doc(this.firestore, 'users', u.uid)).pipe(
        map((d: any) => !!d?.isAdmin)
      );
    })
  );
}
