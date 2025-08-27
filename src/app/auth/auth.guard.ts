// src/app/auth/auth.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth, authState } from '@angular/fire/auth';
import { map, take } from 'rxjs/operators';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Get the auth status once and judge if its valid ot not
  return auth.user$.pipe(
    take(1),
    map((user) => {
      // valid(logged in) -> pass
      if (user) return true;

      // invalid(logged out) → /login
      router.navigate(['/login'], {
        queryParams: { redirect: state.url },
      });
      return false;
    })
  );
};
