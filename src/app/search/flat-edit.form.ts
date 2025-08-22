import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Flat } from '../models/flat.model';

@Component({
  standalone: true,
  selector: 'flat-edit-form',
  imports: [CommonModule, ReactiveFormsModule],
  template: `
  <form class="form form-grid" [formGroup]="form" (ngSubmit)="submit()">
    <h1 class="page-title">Edit Flat</h1>

    <div class="form-field"><label>City</label><input formControlName="city" type="text" /></div>
    <div class="form-field"><label>Street name</label><input formControlName="streetName" type="text" /></div>
    <div class="form-field"><label>Street number</label><input formControlName="streetNumber" type="number" /></div>
    <div class="form-field"><label>Area size (m²)</label><input formControlName="areaSize" type="number" /></div>
    <div class="form-field"><label>Year built</label><input formControlName="yearBuilt" type="number" /></div>
    <div class="form-field"><label>Rent price ($/month)</label><input formControlName="rentPrice" type="number" /></div>
    <div class="form-field"><label>Date available</label><input formControlName="dateAvailable" type="date" /></div>

    <div class="form-field form-field--inline">
      <label class="checkbox">
        <input formControlName="hasAC" type="checkbox" />
        <span>Has AC</span>
      </label>
    </div>

    <div class="form-actions">
      <button type="button" class="btn btn-ghost" (click)="cancel.emit()">Cancel</button>
      <button type="submit" class="btn btn-primary" [disabled]="form.invalid">Update</button>
    </div>
  </form>
  `
})
export class FlatEditForm {
  private fb = inject(FormBuilder);
  private _id = '';

  @Input({ required: true }) set data(v: Flat | null) {
    if (!v) return;
    this._id = v.id!;
    this.form.reset({
      city: v.city,
      streetName: v.streetName,
      streetNumber: v.streetNumber,
      areaSize: v.areaSize,
      hasAC: v.hasAC,
      yearBuilt: v.yearBuilt,
      rentPrice: v.rentPrice,
      dateAvailable: v.dateAvailable
    });
  }

  @Output() save = new EventEmitter<{ id: string, patch: Partial<Flat> }>();
  @Output() cancel = new EventEmitter<void>();

  form = this.fb.group({
    city: ['', Validators.required],
    streetName: ['', Validators.required],
    streetNumber: [null as number | null, [Validators.required, Validators.min(1)]],
    areaSize: [null as number | null, [Validators.required, Validators.min(1)]],
    hasAC: [false],
    yearBuilt: [null as number | null, [Validators.required, Validators.min(1800)]],
    rentPrice: [null as number | null, [Validators.required, Validators.min(0)]],
    dateAvailable: ['', Validators.required],
  });

  submit() {
    if (this.form.invalid) return;
    this.save.emit({ id: this._id, patch: this.form.value as Partial<Flat> });
  }
}
