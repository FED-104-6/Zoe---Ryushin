import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { UploadService } from '../services/upload.service';
import { FlatsService } from '../services/flats.service';


@Component({
standalone: true,
imports: [CommonModule, ReactiveFormsModule, RouterModule],
templateUrl: './new-flat.component.html'
})
export class NewFlatComponent {
private fb = inject(FormBuilder);
private upload = inject(UploadService);
private flats = inject(FlatsService);
private router = inject(Router);


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
images: [[] as string[]],
});


uploading = signal(false);


async onFile(e: Event) {
const input = e.target as HTMLInputElement;
const files = Array.from(input.files || []).slice(0, 9);
if (!files.length) return;
this.uploading.set(true);
const urls: string[] = [];
for (const f of files) urls.push(await this.upload.upload(f, 'flats'));
this.uploading.set(false);
this.form.patchValue({ images: urls });
}


async onSubmit() {
if (this.form.invalid) return;
const id = await this.flats.create(this.form.value as any);
this.router.navigate(['/flats', id]);
}
}