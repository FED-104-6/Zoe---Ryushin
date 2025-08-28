import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { FlatsService } from '../services/flats.service';
import { Flat } from '../models/flat.model';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';  // ★

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './view-flat.page.html',
  styleUrls: ['./view-flat.page.css'],
})
export class ViewFlatPage {
  flat: Flat | null = null;

  images: string[] = [];
  mainImage = 'assets/placeholder.jpg';

  address = '';
  encodedAddress = '';
  mapLink = '';
  mapEmbedUrl = '';
  mapSafeUrl: SafeResourceUrl | null = null;       

  private sanitizer = inject(DomSanitizer);       

  constructor(
    private route: ActivatedRoute,
    private flats: FlatsService,
    private auth: Auth
  ) {}

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.flat = await this.flats.getOne(id);

    // images
    const anyFlat: any = this.flat;
    let list: string[] = [];
    if (anyFlat && Array.isArray(anyFlat.images)) {
      const first = anyFlat.images[0];
      list = Array.isArray(first) ? (first as string[]) : (anyFlat.images as string[]);
    }
    if (!list.length && this.flat?.image) list = [this.flat.image];
    this.images = (list || []).filter(Boolean);
    this.mainImage = this.images[0] || this.mainImage;

    // address
    const num  = this.flat?.streetNumber ? String(this.flat?.streetNumber) + ' ' : '';
    const name = this.flat?.streetName || '';
    const city = this.flat?.city ? ', ' + this.flat?.city : '';
    this.address = `${num}${name}${city}`.trim();

    if (this.address) {
      this.encodedAddress = encodeURIComponent(this.address);

      this.mapEmbedUrl = `https://maps.google.com/maps?q=${this.encodedAddress}&output=embed`;
      this.mapLink     = `https://www.google.com/maps/search/?api=1&query=${this.encodedAddress}`;
      this.mapSafeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.mapEmbedUrl); // ★
    }
  }

  selectImage(url: string) {
    this.mainImage = url || this.mainImage;
  }

  canEdit() {
    return this.auth.currentUser?.uid === this.flat?.ownerId;
  }
}
