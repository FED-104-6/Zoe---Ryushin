import { Component, inject } from '@angular/core';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth.service';
import { MaterialModule } from '../../services/ui/material.module';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private calcAge(date: Date): number {
    const diff = Date.now() - date.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  }

  // Indivisual Validations PasswordMatch/AgeRange
  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const pass = control.get('password')?.value;
    const confirm = control.get('confirmPassword')?.value;
    return pass === confirm ? null : { passwordMismatch: true };
  }

  ageRangeValidator = (control: AbstractControl): ValidationErrors | null => {
    const birth = control.get('birthDate')?.value;
    if (!birth) return null;
    const d = new Date(birth);
    if (Number.isNaN(d.getTime())) return { invalidBirthDate: true };
    const age = this.calcAge(d);
    return age >= 18 && age <= 120 ? null : { ageOutOfRange: true };
  };

  // loading state
  loading = false;
  error: string | null = null;
  submitted = false;

  form = this.fb.group(
    {
      firstName: ['', [Validators.minLength(2), Validators.required]],
      lastName: ['', [Validators.minLength(2), Validators.required]],
      birthDate: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(6),
          Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/),
        ],
      ],
      confirmPassword: ['', Validators.required],
    },
    {
      validators: [
        this.passwordMatchValidator.bind(this),
        this.ageRangeValidator,
      ],
    }
  );

  async onSubmit() {
    this.submitted = true;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.error = null;

    const { email, password, firstName, lastName, birthDate } = this.form.value;

    try {
      await this.auth.signUpWithDetails(
        email!,
        password!,
        firstName!,
        lastName!,
        new Date(birthDate!)
      );
    } catch (err: any) {
      console.error(err);
      this.error = err?.message || 'Failed to register. Please try again.';
    } finally {
      this.loading = false;
    }
  }
}
