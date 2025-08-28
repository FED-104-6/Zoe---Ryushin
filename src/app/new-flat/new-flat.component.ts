import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { UploadService } from '../services/upload.service';
import { FlatsService } from '../services/flats.service';

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

  // single image only
  form = this.fb.group({
    title: [''],
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

  /** disable submit when uploading or invalid */
  get disableSubmit() {
    return this.uploading() || this.saving() || this.form.invalid;
  }

  // Click to upload (single file)
  async onFile(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    // local preview first
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
    if (this.form.invalid || this.uploading()) return;

    this.saving.set(true);
    try {

      const id = await this.flats.create(this.form.value as any);
      console.log('[created]', id);
      this.router.navigate(['/search']);
    } catch (err) {
      console.error('save failed:', err);
    } finally {
      this.saving.set(false);
    }
  }
}
