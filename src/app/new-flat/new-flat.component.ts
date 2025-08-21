import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { FlatsService } from '../services/flats.service';
import { Flat } from '../models/flat.model';

@Component({
  selector: 'app-new-flat',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './new-flat.component.html',
  styleUrls: ['./new-flat.component.css'],
})
export class NewFlatComponent implements OnInit {
  form!: FormGroup;
  photoFiles: File[] = [];
  photoPreviews: string[] = [];

  constructor(
    private fb: FormBuilder,
    private flats: FlatsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      description: ['', [Validators.required]],
      price: [null, [Validators.required, Validators.min(1)]],
      city: ['', Validators.required],
      street: ['', Validators.required],
      postal: ['', Validators.required],
      source: [''],

      streetNumber: [0, [Validators.min(0)]],
      areaSize: [60, [Validators.min(1)]],
      hasAC: [false],
      yearBuilt: [2005, [Validators.min(1800)]],
      dateAvailable: [this.defaultDate()],
    });
  }

  private defaultDate(): string {
    const d = new Date(); d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  }

  onPhotosSelected(e: Event) {
    const input = e.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];
    const left = Math.max(0, 9 - this.photoFiles.length);
    files.slice(0, left).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      this.photoFiles.push(file);
      const reader = new FileReader();
      reader.onload = () => this.photoPreviews.push(reader.result as string);
      reader.readAsDataURL(file);
    });
    input.value = '';
  }

  removePhoto(i: number) {
    this.photoFiles.splice(i, 1);
    this.photoPreviews.splice(i, 1);
  }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    const v = this.form.value;
    const flat: Flat = {
      city: v.city,
      streetName: v.street,
      streetNumber: Number(v.streetNumber ?? 0),
      areaSize: Number(v.areaSize ?? 60),
      hasAC: !!v.hasAC,
      yearBuilt: Number(v.yearBuilt ?? 2005),
      rentPrice: Number(v.price),
      dateAvailable: v.dateAvailable || this.defaultDate(),
      ownerId: 'seed-owner-1',
      title: v.description,
      image: this.photoPreviews[0] || undefined,
    };

    this.flats.upsert(flat);
    this.router.navigateByUrl('/search');
  }
}
