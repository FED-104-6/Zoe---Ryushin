import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

import { Flat } from '../models/flat.model';
import { FlatsService } from '../services/flats.service';
import { FavoritesService } from '../services/favorites.service';

import { FlatViewCard } from './flat-view.card';
import { FlatEditForm } from './flat-edit.form';

@Component({
  selector: 'app-search',
  standalone: true,
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    FlatViewCard,     
    FlatEditForm     
  ]
})
export class SearchComponent implements OnInit {
  form!: FormGroup;

  // Data rendered in the main grid
  all: Flat[] = [];
  view: Flat[] = [];
  sort: 'priceAsc' | 'priceDesc' | 'area' | 'city' | null = null;

  // Panel state and user context
  me!: { id: string; fullName?: string; email?: string };
  extraFlats$!: Observable<Flat[]>;
  mode$!: Observable<'none' | 'view' | 'edit'>;
  selectedFlat$!: Observable<Flat | null>;

  constructor(
    private fb: FormBuilder,
    private flats: FlatsService,
    private fav: FavoritesService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Filters form
    this.form = this.fb.group({
      city: [''],
      street: [''],
      priceMin: [''],
      priceMax: [''],
      areaMin: [''],
      areaMax: [''],
    });

    // Seed once and load initial list
    if (this.flats.listAll().length === 0) this.seedDefaults();
    this.all = this.flats.listAll();
    this.view = [...this.all];

    // Side panel state (URL-driven) and current user
    this.me = this.flats.currentUser();
    this.extraFlats$ = this.flats.getMyCreatedFlats();
    this.mode$ = this.route.queryParamMap.pipe(
      map(q => (q.has('view') ? 'view' : q.has('edit') ? 'edit' : 'none'))
    );
    this.selectedFlat$ = this.route.queryParamMap.pipe(
      switchMap(q => {
        const id = q.get('view') || q.get('edit');
        return id ? this.flats.getFlatById(id) : of(null);
      })
    );
  }

  // Filtering
  applyFilters() {
    const { city, street, priceMin, priceMax, areaMin, areaMax } = this.form.value;
    let list = [...this.all];

    if (city) {
      const c = String(city).toLowerCase();
      list = list.filter(f => f.city.toLowerCase().includes(c));
    }
    if (street) {
      const s = String(street).toLowerCase();
      list = list.filter(f => f.streetName.toLowerCase().includes(s));
    }

    const pMin = priceMin ? Number(priceMin) : -Infinity;
    const pMax = priceMax ? Number(priceMax) : Infinity;
    list = list.filter(f => f.rentPrice >= pMin && f.rentPrice <= pMax);

    const aMin = areaMin ? Number(areaMin) : -Infinity;
    const aMax = areaMax ? Number(areaMax) : Infinity;
    list = list.filter(f => f.areaSize >= aMin && f.areaSize <= aMax);

    this.view = this.sortList(list);
  }

  clearFilters() {
    this.form.reset({ city: '', street: '', priceMin: '', priceMax: '', areaMin: '', areaMax: '' });
    this.sort = null;
    this.view = [...this.all];
  }

  // Sorting
  sortBy(kind: 'priceAsc' | 'priceDesc' | 'area' | 'city') {
    this.sort = kind;
    this.view = this.sortList([...this.view]);
  }

  private sortList(list: Flat[]): Flat[] {
    switch (this.sort) {
      case 'priceAsc':  return list.sort((a, b) => a.rentPrice - b.rentPrice);
      case 'priceDesc': return list.sort((a, b) => b.rentPrice - a.rentPrice);
      case 'area':      return list.sort((a, b) => a.areaSize - b.areaSize);
      case 'city':      return list.sort((a, b) => a.city.localeCompare(b.city));
      default:          return list;
    }
  }

  // Favorites
  isFav(id?: string) { return this.fav.isFav(id); }
  toggleFav(e: MouseEvent, id?: string) { e.stopPropagation(); this.fav.toggle(id); }

  // Side panel actions
  openFlat(f: Flat) { if (f.id) this.router.navigate(['/flats', f.id]); }
  openView(id: string) { this.router.navigate([], { queryParams: { view: id }, queryParamsHandling: 'merge' }); }
  openEdit(id: string) { this.router.navigate([], { queryParams: { edit: id }, queryParamsHandling: 'merge' }); }
  closePanel() {
    const qp = { ...this.route.snapshot.queryParams };
    delete qp['view']; delete qp['edit'];
    this.router.navigate([], { queryParams: qp });
  }
  saveEdit(e: { id: string; patch: Partial<Flat> }) {
    this.flats.updateFlat(e.id, e.patch);
    this.closePanel();
  }

  // Initial seed (default 9 cards)
  private seedDefaults() {
    const items = [
      { title: 'Private office in beautiful Gastown', city: 'Vancouver', street: '302 Water Street', price: 2500, area: 45, image: 'assets/private-office-in-beautiful-gastown.png' },
      { title: 'Burnaby Luxury whole house', city: 'Burnaby', street: '4880 Hazel Street', price: 4800, area: 160, image: 'assets/burnaby-luxury-whole-house.png' },
      { title: 'Paramount Junior 3BR + 2BA Condo', city: 'Richmond', street: 'Lansdowne Road', price: 3500, area: 80, image: 'assets/paramount-junior-3br-2ba-condo.png' },
      { title: 'Spacious fully furnished condo', city: 'Surrey', street: '13325 102A Avenue', price: 3970, area: 88, image: 'assets/spacious-fully-furnished-condo.png' },
      { title: 'Furnished 2 bdrm basement suite', city: 'Vancouver', street: '3663 Crowley Drive', price: 2500, area: 60, image: 'assets/furnished-2bdrm-basement-suite.png' },
      { title: 'Luxury townhouse in the Kitsilano', city: 'Vancouver', street: 'East Georgia Street', price: 4100, area: 120, image: 'assets/luxury-townhouse-in-kitsilano.png' },
      { title: 'Furnished large garden level suite', city: 'Kelowna', street: '1350 St. Paul Street', price: 1800, area: 50, image: 'assets/furnished-large-garden-level-suite.png' },
      { title: 'Newest brand 2 bedroom apartment', city: 'Kamloops', street: '875 Sahali Terrace', price: 2000, area: 65, image: 'assets/newest-brand-2-bedroom-apartment.png' },
      { title: '2BR basement suite (Port Coquitlam)', city: 'Port Coquitlam', street: '555 Franklyn Street', price: 2900, area: 70, image: 'assets/2br-basement-suite-port-coquitlam.png' },
    ];
    const today = new Date().toISOString().slice(0, 10);
    for (const it of items) {
      const flat: Flat = {
        city: it.city, streetName: it.street, streetNumber: 0,
        areaSize: it.area, hasAC: false, yearBuilt: 2005,
        rentPrice: it.price, dateAvailable: today, ownerId: 'seed-owner-1',
        title: it.title, image: it.image
      };
      this.flats.upsert(flat);
    }
  }
}
