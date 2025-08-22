// src/app/auth/auth.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth, authState } from '@angular/fire/auth';
import { map, take } from 'rxjs/operators';

export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);

  // Get the auth status once and judge if its valid ot not
  return authState(auth).pipe(
    take(1),
    map((user) => {
      // valid(logged in) -> pass
      if (user) return true;

      // invalid(logged out) → /login
      return router.createUrlTree(['/login'], {
        queryParams: { redirect: state.url },
      });
    })
  );
};
