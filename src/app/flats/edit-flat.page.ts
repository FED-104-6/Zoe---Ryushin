import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FlatsService } from '../services/flats.service';
import { UploadService } from '../services/upload.service';
import { Flat } from '../models/flat.model';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './edit-flat.page.html',
  styleUrls: ['../new-flat/new-flat.component.css'],
})
export default class EditFlatPage {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private flats = inject(FlatsService);
  private upload = inject(UploadService);

  id = '';
  flat: Flat | null = null;

  uploading = signal(false);
  saving = signal(false);
  loading = signal(true);

  form = this.fb.group({
    title: [''],
    city: ['', Validators.required],
    streetName: ['', Validators.required],
    streetNumber: [null as number | null, [Validators.required, Validators.min(1)]],
    areaSize: [null as number | null, [Validators.required, Validators.min(1)]],
    yearBuilt: [2000, [Validators.required, Validators.min(1800)]],
    hasAC: [false],
    rentPrice: [null as number | null, [Validators.required, Validators.min(0)]],
    dateAvailable: ['', Validators.required],
    image: [''],
  });

  get disableSubmit() {
    return this.uploading() || this.saving() || this.loading() || this.form.invalid;
  }

  async ngOnInit() {
    this.id = this.route.snapshot.paramMap.get('id') || '';
    if (!this.id) { this.router.navigate(['/search']); return; }

    this.flat = await this.flats.getOne(this.id);
    if (!this.flat) { this.router.navigate(['/search']); return; }

    this.form.patchValue({
      title: this.flat.title ?? '',
      city: this.flat.city ?? '',
      streetName: this.flat.streetName ?? '',
      streetNumber: this.flat.streetNumber ?? null,
      areaSize: this.flat.areaSize ?? null,
      yearBuilt: this.flat.yearBuilt ?? 2000,
      hasAC: !!this.flat.hasAC,
      rentPrice: this.flat.rentPrice ?? null,
      dateAvailable: this.flat.dateAvailable ?? '',
      image: this.flat.image ?? '',
    });

    this.loading.set(false);
  }

  async onFile(e: Event) {
    const input = e.target as HTMLInputElement;
    const f = input.files?.[0];
    if (!f) return;

    const localURL = URL.createObjectURL(f);
    this.form.patchValue({ image: localURL });

    this.uploading.set(true);
    try {
      const url = await this.upload.upload(f, 'flats');
      this.form.patchValue({ image: url });
    } catch (err) {
      console.error('upload failed:', err);
    } finally {
      this.uploading.set(false);
      input.value = '';
      URL.revokeObjectURL(localURL);
    }
  }

  // save the updates
  async onSubmit(ev?: Event) {
    ev?.preventDefault();
    ev?.stopPropagation();

    this.form.markAllAsTouched();
    if (this.form.invalid || this.uploading() || !this.id) return;

    this.saving.set(true);
    try {
      const v = this.form.value as any;
      const patch: Partial<Flat> = {
        title: v.title ?? '',
        city: v.city ?? '',
        streetName: v.streetName ?? '',
        streetNumber: v.streetNumber != null ? Number(v.streetNumber) : null as any,
        areaSize: v.areaSize != null ? Number(v.areaSize) : null as any,
        yearBuilt: v.yearBuilt != null ? Number(v.yearBuilt) : 2000,
        hasAC: !!v.hasAC,
        rentPrice: v.rentPrice != null ? Number(v.rentPrice) : null as any,
        dateAvailable: v.dateAvailable ?? '',
        image: v.image ?? '',
      };

      await this.flats.update(this.id, patch);
      this.router.navigate(['/flats', this.id]);
    } catch (err) {
      console.error('update failed:', err);
    } finally {
      this.saving.set(false);
    }
  }
}
