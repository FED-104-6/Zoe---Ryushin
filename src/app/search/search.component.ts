import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { FlatsService } from '../services/flats.service';
import { FavoritesService } from '../services/favorites.service';
import { Flat } from '../models/flat.model';

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css']
})
export class SearchComponent {
  private fb = inject(FormBuilder);
  private flats = inject(FlatsService);
  private favs = inject(FavoritesService);
  private router = inject(Router);

  form = this.fb.group({
    city: [''],
    street: [''],
    priceMin: [null as number | null],
    priceMax: [null as number | null],
    areaMin: [null as number | null],
    areaMax: [null as number | null],
  });

  all: Flat[] = [];
  view: Flat[] = [];

  favIds = signal<string[]>([]);

  // remember last sort so filters won't reset it
  private lastSort: 'priceAsc'|'priceDesc'|'cityAsc'|'cityDesc'|'areaAsc'|'areaDesc'|null = null;

  async ngOnInit() {
    // live list from Firestore
    this.flats.all$().subscribe(rows => {
      this.all = rows ?? [];
      this.applyFilters();
    });

    // load favorites
    try { this.favIds.set(await this.favs.listIds()); } catch {}
  }

  // navigation to view page once user clicks card
  toView(id: string) { if (id) this.router.navigate(['/flats', id]); }

  // favorites helpers
  isFav(id?: string) { return !!id && this.favIds().includes(id); }

  async toggleFav(e: Event, id?: string) {
    e.preventDefault();
    e.stopPropagation();
    if (!id) return;
    try {
      await this.favs.toggle(id);
      this.favIds.set(await this.favs.listIds());
    } catch {}
  }

  // filtering
  applyFilters() {
    const v = this.form.value;
    let rows = [...this.all];

    const cityQ = (v.city ?? '').toString().trim().toLowerCase();
    const streetQ = (v.street ?? '').toString().trim().toLowerCase();

    if (cityQ)  rows = rows.filter(r => (r.city ?? '').toLowerCase().includes(cityQ));
    if (streetQ) rows = rows.filter(r => (r.streetName ?? '').toLowerCase().includes(streetQ));

    const pMin = v.priceMin != null ? Number(v.priceMin) : null;
    const pMax = v.priceMax != null ? Number(v.priceMax) : null;
    const aMin = v.areaMin  != null ? Number(v.areaMin)  : null;
    const aMax = v.areaMax  != null ? Number(v.areaMax)  : null;

    if (pMin != null) rows = rows.filter(r => Number(r.rentPrice ?? 0) >= pMin);
    if (pMax != null) rows = rows.filter(r => Number(r.rentPrice ?? 0) <= pMax);
    if (aMin != null) rows = rows.filter(r => Number(r.areaSize  ?? 0) >= aMin);
    if (aMax != null) rows = rows.filter(r => Number(r.areaSize  ?? 0) <= aMax);

    if (this.lastSort) rows = this.sortRows(rows, this.lastSort);
    this.view = rows;
  }

  clearFilters() {
    this.form.reset({ city: '', street: '', priceMin: null, priceMax: null, areaMin: null, areaMax: null });
    this.applyFilters();
  }

  // sorting
  sortBy(key: 'priceAsc'|'priceDesc'|'cityAsc'|'cityDesc'|'areaAsc'|'areaDesc') {
    this.lastSort = key;
    this.view = this.sortRows([...this.view], key);
  }

  private sortRows(rows: Flat[], key: 'priceAsc'|'priceDesc'|'cityAsc'|'cityDesc'|'areaAsc'|'areaDesc') {
    switch (key) {
      case 'priceAsc':
        rows.sort((a,b) => Number(a.rentPrice ?? 0) - Number(b.rentPrice ?? 0)); break;
      case 'priceDesc':
        rows.sort((a,b) => Number(b.rentPrice ?? 0) - Number(a.rentPrice ?? 0)); break;
      case 'cityAsc':
        rows.sort((a,b) => (a.city ?? '').localeCompare(b.city ?? '', undefined, {sensitivity:'base'})); break;
      case 'cityDesc':
        rows.sort((a,b) => (b.city ?? '').localeCompare(a.city ?? '', undefined, {sensitivity:'base'})); break;
      case 'areaAsc':
        rows.sort((a,b) => Number(a.areaSize ?? 0) - Number(b.areaSize ?? 0)); break;
      case 'areaDesc':
        rows.sort((a,b) => Number(b.areaSize ?? 0) - Number(a.areaSize ?? 0)); break;
    }
    return rows;
  }
}
