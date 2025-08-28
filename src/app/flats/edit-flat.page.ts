import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FlatsService } from '../services/flats.service';
import { Flat } from '../models/flat.model';

@Component({
standalone: true,
imports: [CommonModule, RouterModule, FormsModule],
template: `
<a [routerLink]="['/flats', id]">← Back</a>
<form *ngIf="flat" (ngSubmit)="onSave()">
<label>Title</label>
<input [(ngModel)]="flat.title" name="title" />

<label>Rent Price</label>
<input [(ngModel)]="flat.rentPrice" name="rent" type="number" min="0" required />

<label>Date Available</label>
<input [(ngModel)]="flat.dateAvailable" name="date" type="date" required />

<button type="submit">Save</button>
</form>
`
})
export default class EditFlatPage {
private route = inject(ActivatedRoute);
private flats = inject(FlatsService);
private router = inject(Router);
id = this.route.snapshot.paramMap.get('id')!;
flat!: Flat | null;

async ngOnInit(){ this.flat = await this.flats.getOne(this.id); }
async onSave(){
if (!this.flat) return;
const { id, ...rest } = this.flat;
await this.flats.update(this.id, rest);
this.router.navigate(['/flats', this.id]);
}
}