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
  getDoc,
} from '@angular/fire/firestore';
import { map, Observable, of, switchMap, shareReplay } from 'rxjs';
import { Router } from '@angular/router';
import { UserProfile } from '../models/user-profile';
import { user as afUser } from '@angular/fire/auth';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private router = inject(Router);

  user$: Observable<User | null> = authState(this.auth);
  private _user = signal<User | null>(null);
  user = computed(() => this._user());

  // Firestore の users/{uid} を購読し、UserProfile を流す
  profile$: Observable<UserProfile | null> = this.user$.pipe(
    switchMap((u) => {
      if (!u) return of(null);
      return docData(doc(this.firestore, 'users', u.uid)).pipe(
        map((d: any) => {
          if (!d) return null;
          const birthDate = d.birthDate?.toDate
            ? d.birthDate.toDate()
            : d.birthDate;
          const p: UserProfile = {
            uid: u.uid,
            firstName: d.firstName ?? '',
            lastName: d.lastName ?? '',
            email: d.email ?? u.email ?? '',
            birthDate,
            isAdmin: !!d.isAdmin,
          };
          return p;
        })
      );
    })
  );

  private sessionTimer: any = null;
  private startSessionTimer(ms: number) {
    if (this.sessionTimer) clearTimeout(this.sessionTimer);
    this.sessionTimer = setTimeout(() => {
      this.logout();
    }, ms);
  }

  constructor() {
    this.user$.subscribe((u) => {
      this._user.set(u);
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

  // 現在ログイン中ユーザーのプロフィールを1回だけ取得（AdminGuard等で使用）
  async getCurrentUserProfile(): Promise<UserProfile | null> {
    const u = await this.auth.currentUser;
    if (!u) return null;

    const ref = doc(this.firestore, 'users', u.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;

    const d: any = snap.data();
    // birthDate は Firestore Timestamp or Date を許容
    const birthDate = d.birthDate?.toDate ? d.birthDate.toDate() : d.birthDate;

    const me: UserProfile = {
      uid: u.uid,
      firstName: d.firstName ?? '',
      lastName: d.lastName ?? '',
      email: d.email ?? u.email ?? '',
      birthDate,
      isAdmin: !!d.isAdmin,
    } as UserProfile;

    return me;
  }

  // 管理者フラグ（ヘッダーなどの *ngIf で使用）
  // isAdmin$: Observable<boolean> = this.profile$.pipe(map((p) => !!p?.isAdmin));

  isAdmin$ = afUser(this.auth).pipe(
    switchMap((u) =>
      u ? docData(doc(this.firestore, 'users', u.uid)) : of(null)
    ),
    map((data: any) => !!data?.isAdmin),
    shareReplay({ bufferSize: 1, refCount: true })
  );
}
