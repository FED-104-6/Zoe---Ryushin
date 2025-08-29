import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { FlatsService } from '../services/flats.service';
import { Flat } from '../models/flat.model';
import Message from './message/message';

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule, Message],
  template: `
    <a routerLink="/search" class="btn">← Back to Search</a>

    <ng-container *ngIf="flat">
      <h2>{{ flat.title || flat.city + ' · ' + flat.streetName }}</h2>
      <div class="meta">
        {{ flat.streetNumber }} {{ flat.streetName }}, {{ flat.city }}
      </div>
      <div class="price">
        {{ flat.rentPrice | currency : 'USD' : 'symbol' : '1.0-0' }} / month
      </div>

      <div class="owner" *ngIf="flat.ownerName || flat.ownerEmail">
        Owner: {{ flat.ownerName }}
        <span *ngIf="flat.ownerEmail">• {{ flat.ownerEmail }}</span>
      </div>

      <div class="gallery" *ngIf="images.length">
        <img *ngFor="let url of images" [src]="url" alt="image" />
      </div>

      <button *ngIf="canEdit()" [routerLink]="['/flats', flat.id, 'edit']">
        Edit
      </button>
      <section class="messages" *ngIf="flat">
        <app-message
          [flatId]="flat.id!"
          [ownerId]="flat.ownerId!"
          [ownerName]="flat.ownerName || ''"
          [ownerEmail]="flat.ownerEmail || ''"
          [currentUserId]="auth.currentUser?.uid || null"
          [canOwnerSend]="false"
        >
        </app-message>
      </section>
    </ng-container>
  `,
})
export default class ViewFlatPage implements OnInit {
  flat: Flat | null = null;
  images: string[] = [];

  constructor(
    private route: ActivatedRoute,
    private flats: FlatsService,
    public auth: Auth
  ) {}

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.flat = await this.flats.getOne(id);

    this.images = [];
    const anyFlat: any = this.flat;

    if (anyFlat && Array.isArray(anyFlat.images)) {
      const arr = anyFlat.images;
      this.images = Array.isArray(arr[0])
        ? (arr[0] as string[])
        : (arr as string[]);
    } else if (this.flat?.image) {
      this.images = [this.flat.image];
    }
  }

  canEdit() {
    return this.auth.currentUser?.uid === this.flat?.ownerId;
  }
}
