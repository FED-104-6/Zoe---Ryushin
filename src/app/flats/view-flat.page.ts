import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { FlatsService } from '../services/flats.service';
import { Flat } from '../models/flat.model';

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <a routerLink="/search" class="btn btn-ghost" style="margin:12px 0;display:inline-block">← Back to Search</a>
    <ng-container *ngIf="flat as f">
      <h2>{{ f.title || (f.city + ' · ' + f.streetName) }}</h2>
      <div class="meta">{{f.streetNumber}} {{f.streetName}}, {{f.city}}</div>
      <div class="price">${{f.rentPrice}} / month</div>
      <div class="owner" *ngIf="f.ownerName || f.ownerEmail">Owner: {{f.ownerName}} • {{f.ownerEmail}}</div>

      <div class="gallery" *ngIf="f.images?.length">
        <img *ngFor="let url of f.images" [src]="url" alt="image" />
      </div>
      
      <button *ngIf="canEdit(f)" [routerLink]="['/flats', f.id, 'edit']">Edit</button>
</ng-container>
`
})
export default class ViewFlatPage {
  private route = inject(ActivatedRoute);
  private flats = inject(FlatsService);
  private auth = inject(Auth);
  flat!: Flat | null;
  async ngOnInit(){ this.flat = await this.flats.getOne(this.route.snapshot.paramMap.get('id')!); }
  canEdit(f: Flat){ return this.auth.currentUser?.uid === f.ownerId; }
} 