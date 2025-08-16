import { Routes } from '@angular/router';
import { RegisterComponent } from './auth/register.component/register';
import { LoginComponent } from './auth/login.component/login.component';

export const routes: Routes = [
  {
    path: 'register',
    component: RegisterComponent,
  },
  { path: 'login', component: LoginComponent },
  { path: '**', redirectTo: 'register' },
];
