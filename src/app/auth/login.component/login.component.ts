import { Component, inject } from '@angular/core';
import { MaterialModule } from '../../Material/material.module';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../auth.service';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-login.component',
  standalone: true,
  imports: [MaterialModule, ReactiveFormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  loading = false;
  error: string | null = null;

  async onSubmit() {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = null;
    const { email, password } = this.form.value;

    try {
      const redirect = this.route.snapshot.queryParamMap.get('redirect');
      await this.auth.signInWithEmail(
        email as string,
        password as string,
        redirect || undefined
      );
    } catch (err: any) {
      console.error(err);
      this.error = err?.code || err?.message || String(err);
    } finally {
      this.loading = false;
    }
  }
}
