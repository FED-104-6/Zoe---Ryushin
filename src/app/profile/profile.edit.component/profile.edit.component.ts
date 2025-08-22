import { Component, inject, signal, OnInit } from '@angular/core';
import { MaterialModule } from '../../services/ui/material.module';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Auth, User } from '@angular/fire/auth';
import { doc, getDoc, setDoc, Firestore } from '@angular/fire/firestore';
import { UserProfile } from '../../models/user-profile';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { merge } from 'rxjs';
import { updateProfile } from 'firebase/auth';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../ui/confirm-dialog/confirm-dialog.component/confirm-dialog.component';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-profile.edit.component',
  imports: [CommonModule, ReactiveFormsModule, MaterialModule],
  templateUrl: './profile.edit.component.html',
  styleUrl: './profile.edit.component.css',
})
export class ProfileEditComponent implements OnInit {
  private afAuth = inject(Auth);
  private db = inject(Firestore);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);

  form = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    birthDate: ['', Validators.required],
    email: [{ value: '', disabled: true }],
  });

  profile = signal<UserProfile | null>(null);
  uid!: string;

  async ngOnInit() {
    const user =
      this.afAuth.currentUser ??
      (await new Promise<User | null>((res) => {
        const unsub = this.afAuth.onAuthStateChanged((u) => {
          res(u);
          unsub();
        });
      }));
    if (!user) {
      this.router.navigateByUrl('/login');
      return;
    }

    this.uid = user.uid;

    const snap = await getDoc(doc(this.db, `users/${user.uid}`));
    this.profile.set(snap.data() as UserProfile | null);
    const p = snap.data() as UserProfile;
    const birth =
      p.birthDate instanceof Date
        ? p.birthDate.toISOString().slice(0, 10)
        : p.birthDate ?? '';
    this.form.patchValue({ ...p, birthDate: birth });
  }

  goProfile() {
    this.router.navigateByUrl('/profile');
  }

  async onSubmit() {
    if (this.form.invalid || !this.uid) return;
    const { firstName, lastName, birthDate, email } = this.form.getRawValue();

    const payload = { firstName, lastName, birthDate, email };
    try {
      await setDoc(doc(this.db, 'users', this.uid), payload, { merge: true });
      if (this.afAuth.currentUser) {
        await updateProfile(this.afAuth.currentUser, {
          displayName: `${firstName ?? ''} ${lastName ?? ''}`.trim(),
        });
      }
      this.router.navigateByUrl('/profile');
    } catch (e) {
      console.error('Failed to save profile', e);
    }
  }

  async onConfirm() {
    const dialogRef = this.dialog.open(ConfirmDialogComponent);

    const result = await firstValueFrom(dialogRef.afterClosed());

    if (result === 'save') {
      await this.onSubmit();
    }
  }
}
