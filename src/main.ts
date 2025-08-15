import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import {
  initializeAuth,
  browserLocalPersistence,
  browserPopupRedirectResolver,
  provideAuth,
} from '@angular/fire/auth';
import { getApp } from 'firebase/app';

bootstrapApplication(App, appConfig).catch((err) => console.error(err));

provideAuth(() =>
  initializeAuth(getApp(), {
    persistence: browserLocalPersistence,
    popupRedirectResolver: browserPopupRedirectResolver,
  })
);
