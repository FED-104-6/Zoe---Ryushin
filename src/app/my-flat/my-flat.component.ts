import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { FlatsService } from '../services/flats.service';
import { Flat } from '../models/flat.model';

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './my-flat.component.html',
  styleUrls: ['./my-flat.component.css'], 
})
export class ViewFlatPage {
  flat: Flat | null = null;

  // gallery
  images: string[] = [];
  mainImage = 'assets/placeholder.jpg';
  address = '';
  encodedAddress = '';
  mapLink = '';
  mapEmbedUrl = '';

  constructor(
    private route: ActivatedRoute,
    private flats: FlatsService,
    private auth: Auth
  ) {}

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.flat = await this.flats.getOne(id);

    const anyFlat: any = this.flat;
    let list: string[] = [];
    if (anyFlat && Array.isArray(anyFlat.images)) {
      const first = anyFlat.images[0];
      list = Array.isArray(first) ? (first as string[]) : (anyFlat.images as string[]);
    }
    if (!list.length && this.flat?.image) list = [this.flat.image];
    this.images = (list || []).filter(Boolean);
    this.mainImage = this.images[0] || this.mainImage;

    const num  = this.flat?.streetNumber ? String(this.flat?.streetNumber) + ' ' : '';
    const name = this.flat?.streetName || '';
    const city = this.flat?.city ? ', ' + this.flat?.city : '';
    this.address = `${num}${name}${city}`.trim();

    this.encodedAddress = encodeURIComponent(this.address);
    this.mapLink   = `https://www.google.com/maps/search/?api=1&query=${this.encodedAddress}`;
    this.mapEmbedUrl = `https://www.google.com/maps?q=${this.encodedAddress}&output=embed`;
  }

  selectImage(url: string) {
    this.mainImage = url || this.mainImage;
  }

  canEdit() {
    return this.auth.currentUser?.uid === this.flat?.ownerId;
  }
}
