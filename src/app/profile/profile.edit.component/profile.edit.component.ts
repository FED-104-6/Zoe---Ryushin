import { Component, inject, signal, OnInit } from '@angular/core';
import { MaterialModule } from '../../services/ui/material.module';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
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
import { updateProfile, updatePassword } from 'firebase/auth';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../ui/confirm-dialog/confirm-dialog.component/confirm-dialog.component';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-profile.edit.component',
  imports: [CommonModule, ReactiveFormsModule, MaterialModule],
  templateUrl: './profile.edit.component.html',
  styleUrls: ['./profile.edit.component.css'],
})
export class ProfileEditComponent implements OnInit {
  private afAuth = inject(Auth);
  private db = inject(Firestore);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);
  private editUid!: string;

  form = this.fb.nonNullable.group(
    {
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      birthDate: ['', [Validators.required, this.ageRangeValidator(18, 120)]],
      email: this.fb.nonNullable.control({ value: '', disabled: true }, [
        Validators.required,
        Validators.email,
      ]),
      password: this.fb.nonNullable.control(''), // optional; validate only if provided
      confirmPassword: this.fb.nonNullable.control(''),
    },
    {
      validators: [
        this.passwordsMatchValidator(),
        this.passwordStrengthValidator(),
      ],
    }
  );

  private ageRangeValidator(min: number, max: number) {
    return (control: AbstractControl): ValidationErrors | null => {
      const v = control.value as string | null;
      if (!v) return null; // requiredは別で見る
      const d = new Date(v);
      if (isNaN(d.getTime())) return { ageRange: true };
      const today = new Date();
      let age = today.getFullYear() - d.getFullYear();
      const m = today.getMonth() - d.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
      return age >= min && age <= max ? null : { ageRange: true };
    };
  }

  private passwordsMatchValidator() {
    return (group: AbstractControl): ValidationErrors | null => {
      const g = group as any;
      const p = g.get('password')?.value;
      const c = g.get('confirmPassword')?.value;
      if (!p && !c) return null; // 未入力ならOK
      return p === c ? null : { passwordsMismatch: true };
    };
  }

  private passwordStrengthValidator() {
    const re = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{6,}$/;
    return (group: AbstractControl): ValidationErrors | null => {
      const p = (group as any).get('password')?.value as string | undefined;
      if (!p) return null; // 未入力ならOK
      return re.test(p) ? null : { passwordWeak: true };
    };
  }

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
      this.router.navigate(['/login'], {
        queryParams: { redirect: '/profile/edit' },
      });
      return;
    }

    // 閲覧対象 uid: /users/:uid/edit があればそれ。なければ自分。
    const routeUid = this.route.snapshot.paramMap.get('uid');
    const viewedUid = routeUid || user.uid;

    // ログイン中ユーザーが admin か
    const viewerSnap = await getDoc(doc(this.db, `users/${user.uid}`));
    const viewerIsAdmin = !!viewerSnap.data()?.['isAdmin'];

    // 自分以外の編集は admin のみ許可
    if (viewedUid !== user.uid && !viewerIsAdmin) {
      this.router.navigateByUrl('/profile');
      return;
    }

    this.uid = viewedUid;

    const snap = await getDoc(doc(this.db, `users/${viewedUid}`));
    const p = snap.data() as UserProfile | undefined;
    this.profile.set(p ?? null);

    const birth =
      p?.birthDate instanceof Date
        ? p.birthDate.toISOString().slice(0, 10)
        : (p?.birthDate as any) ?? '';

    this.form.patchValue({
      firstName: p?.firstName ?? '',
      lastName: p?.lastName ?? '',
      birthDate: birth,
      email: p?.email ?? '',
    });
  }

  goProfile() {
    this.router.navigate(['/profile', this.uid]);
  }

  async onSubmit() {
    if (this.form.invalid || !this.uid) return;
    const raw = this.form.getRawValue();
    const firstName: string = raw.firstName;
    const lastName: string = raw.lastName;
    const birthDate: string = raw.birthDate;
    const email: string = raw.email;
    const password: string = raw.password;

    const birth = new Date(birthDate);
    const payload: Partial<UserProfile> = {
      firstName: firstName ?? '',
      lastName: lastName ?? '',
      birthDate: birth,
      email,
    };

    try {
      await setDoc(doc(this.db, 'users', this.uid), payload, { merge: true });

      // displayName は本人を更新する場合のみ反映
      if (this.afAuth.currentUser && this.afAuth.currentUser.uid === this.uid) {
        await updateProfile(this.afAuth.currentUser, {
          displayName: `${firstName ?? ''} ${lastName ?? ''}`.trim(),
        });
        // パスワード更新（任意入力）。本人のみ可能。再認証が必要なケースは別途対応。
        if (password) {
          try {
            await updatePassword(this.afAuth.currentUser, password);
          } catch (e) {
            console.warn(
              'Password update may require recent login (reauthentication). Skipped.',
              e
            );
          }
        }
      }

      // PDF要件のリダイレクト：
      // ・本人を編集 → /home
      // ・admin が他人を編集 → /all-users
      const currentUid = this.afAuth.currentUser?.uid;
      if (currentUid && currentUid === this.uid) {
        await this.router.navigateByUrl('/home');
      } else {
        await this.router.navigateByUrl('/all-users');
      }
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
