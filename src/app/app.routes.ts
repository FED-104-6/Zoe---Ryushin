import { Routes } from '@angular/router';
import { RegisterComponent } from './auth/register.component/register';

export const routes: Routes = [
  {
    path: 'register',
    component: RegisterComponent,
  },
  { path: '**', redirectTo: 'register' },
];
