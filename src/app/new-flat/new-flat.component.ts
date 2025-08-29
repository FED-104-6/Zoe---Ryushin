import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { UploadService } from '../services/upload.service';
import { FlatsService } from '../services/flats.service';

function maxWords(limit: number) {
  return (ctrl: AbstractControl): ValidationErrors | null => {
    const v = (ctrl.value ?? '').toString().trim();
    if (!v) return null;
    const words = v.split(/\s+/).filter(Boolean);
    return words.length <= limit ? null : { maxWords: { actual: words.length, limit } };
  };
}

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './new-flat.component.html',
  styleUrls: ['./new-flat.component.css']
})
export class NewFlatComponent {
  private fb = inject(FormBuilder);
  private upload = inject(UploadService);
  private flats = inject(FlatsService);
  private router = inject(Router);

  form = this.fb.group({
    title: ['', maxWords(8)],
    city: ['', Validators.required],
    streetName: ['', Validators.required],
    streetNumber: [null, [Validators.required, Validators.min(1)]],
    areaSize: [null, [Validators.required, Validators.min(1)]],
    yearBuilt: [2000, [Validators.required, Validators.min(1800)]],
    hasAC: [false],
    rentPrice: [null, [Validators.required, Validators.min(0)]],
    dateAvailable: ['', Validators.required],
    image: [''],
  });

  uploading = signal(false);
  saving = signal(false);

  get disableSubmit() {
    return this.uploading() || this.saving() || this.form.invalid;
  }

  private readonly maxFileSize = 5 * 1024 * 1024; 
  private readonly allowedTypes = new Set(['image/jpeg', 'image/png']);

  async onFile(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!this.allowedTypes.has(file.type)) {
      console.error('Unsupported file type:', file.type);
      input.value = '';
      return;
    }
    if (file.size > this.maxFileSize) {
      console.error('File too large (>5MB)');
      input.value = '';
      return;
    }

    const localURL = URL.createObjectURL(file);
    this.form.patchValue({ image: localURL });

    this.uploading.set(true);
    try {
      const remoteURL = await this.upload.upload(file, 'flats');
      this.form.patchValue({ image: remoteURL });
    } catch (err) {
      console.error('upload failed:', err);
    } finally {
      this.uploading.set(false);
      input.value = '';
      URL.revokeObjectURL(localURL);
    }
  }

  async onSubmit(ev?: Event) {
    ev?.preventDefault();
    ev?.stopPropagation();

    this.form.markAllAsTouched();

    if (this.form.invalid) {
      const controls = this.form.controls as any;
      const controlErrors: Record<string, any> = {};
      for (const key of Object.keys(controls)) {
        controlErrors[key] = controls[key]?.errors ?? null;
      }
      console.log('[submit blocked] form invalid', {
        formErrors: this.form.errors,
        controlErrors,
        values: this.form.getRawValue()
      });
      return;
    }

    if (this.uploading()) {
      console.log('[submit blocked] still uploading image');
      return;
    }

    const raw = this.form.getRawValue();
    const payload = {
      ...raw,
      title: (raw.title ?? '').toString().trim(),
      city: (raw.city ?? '').toString().trim(),
      streetName: (raw.streetName ?? '').toString().trim(),
      dateAvailable: (raw.dateAvailable ?? '').toString().trim(),
    };

    this.saving.set(true);
    try {
      console.log('[submit] payload', payload);
      const id = await this.flats.create(payload as any);
      console.log('[created]', id);
      this.router.navigate(['/search']);
    } catch (err) {
      console.error('save failed:', err);
    } finally {
      this.saving.set(false);
    }
  }
}
