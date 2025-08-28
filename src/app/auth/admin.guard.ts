import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { Auth, user as afUser } from '@angular/fire/auth';
import { firstValueFrom, of } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';

// Admin-only guard
//  - 非ログイン or 非管理者 → /search へリダイレクト（ログアウトにはしない）
//  - ログイン + 管理者 → 通過
export const adminGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const afs = inject(Firestore);
  const auth = inject(Auth);

  // Firebase は起動直後 currentUser が null のことがあるため、auth state を待つ
  const authUser = await firstValueFrom(
    afUser(auth).pipe(
      timeout(3000),
      catchError(() => of(null))
    )
  );

  // 未ログイン時は /search へ（ログインページではない）
  if (!authUser) return router.parseUrl('/search');

  // 自分の users/{uid} を取得して isAdmin を確認
  const snap = await getDoc(doc(afs, 'users', authUser.uid));
  const isAdmin = snap.exists() && snap.data()['isAdmin'] === true;
  return isAdmin ? true : router.parseUrl('/search');
};
