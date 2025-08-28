import { Routes } from '@angular/router';
import { authGuard } from './auth/auth.guard';
import { adminGuard } from './auth/admin.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'search' },

  { path: 'search', loadComponent: () => import('./search/search.component').then(m => m.SearchComponent) },
  { path: 'new-flat', loadComponent: () => import('./new-flat/new-flat.component').then(m => m.NewFlatComponent) },
  { path: 'favorites', loadComponent: () => import('./favorites/favorites.component').then(m => m.FavoritesComponent) },

  { path: 'flats/:id',       loadComponent: () => import('./flats/view-flat.page').then(m => m.default) },
  { path: 'flats/:id/edit',  canActivate: [() => import('./flats/owner-edit.guard').then(m => m.ownerEditGuard)],
                             loadComponent: () => import('./flats/edit-flat.page').then(m => m.default) },

  { path: 'login', loadComponent: () => import('./auth/login.component/login.component').then(m => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('./auth/register.component/register').then(m => m.RegisterComponent) },

  { path: 'my-flat',   loadComponent: () => import('./my-flat/my-flat.component').then(m => m.MyFlatComponent) },
  { path: '**', redirectTo: 'search' },
];
