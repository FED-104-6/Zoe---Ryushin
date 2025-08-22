import { Routes } from '@angular/router';
import { authGuard } from './auth/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'search' },

  {
    path: 'search',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./search/search.component').then((m) => m.SearchComponent),
  },
  {
    path: 'new-flat',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./new-flat/new-flat.component').then((m) => m.NewFlatComponent),
  },
  {
    path: 'favorites',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./favorites/favorites.component').then(
        (m) => m.FavoritesComponent
      ),
  },

  {
    path: 'login',
    loadComponent: () =>
      import('./auth/login.component/login.component').then(
        (m) => m.LoginComponent
      ),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./auth/register.component/register').then(
        (m) => m.RegisterComponent
      ),
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./profile/profile.component/profile.component').then(
        (m) => m.ProfileComponent
      ),
  },
  {
    path: 'profile/edit',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./profile/profile.edit.component/profile.edit.component').then(
        (m) => m.ProfileEditComponent
      ),
  },

  { path: '**', redirectTo: 'search' },
];
