import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'search' },

  {
    path: 'search',
    loadComponent: () =>
      import('./search/search.component').then((m) => m.SearchComponent),
  },
  {
    path: 'new-flat',
    loadComponent: () =>
      import('./new-flat/new-flat.component').then((m) => m.NewFlatComponent),
  },
  {
    path: 'favorites',
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
    loadComponent: () =>
      import('./profile/profile.component/profile.component').then(
        (m) => m.ProfileComponent
      ),
  },

  { path: '**', redirectTo: 'search' },
];
