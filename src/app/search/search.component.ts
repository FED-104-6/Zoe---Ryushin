import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Flat } from '../models/flat.model';
import { FlatsService } from '../services/flats.service';
import { FavoritesService } from '../services/favorites.service';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css']
})
export class SearchComponent implements OnInit {
  form!: FormGroup;
  all: Flat[] = [];
  view: Flat[] = [];
  sort: 'priceAsc' | 'priceDesc' | 'area' | 'city' | null = null;

  constructor(
  private fb: FormBuilder,
  private flats: FlatsService,
  private fav: FavoritesService,
  private router: Router
) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      city: [''],
      street: [''],
      priceMin: [''],
      priceMax: [''],
      areaMin: [''],
      areaMax: [''],
    });

    if (this.flats.listAll().length === 0) this.seedDefaults();
    this.all = this.flats.listAll();
    this.view = [...this.all];
  }

  applyFilters() {
    const { city, street, priceMin, priceMax, areaMin, areaMax } = this.form.value;
    let list = [...this.all];

    if (city)   list = list.filter(f => f.city.toLowerCase().includes(String(city).toLowerCase()));
    if (street) list = list.filter(f => f.streetName.toLowerCase().includes(String(street).toLowerCase()));

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

  isFav(id?: string) { return this.fav.isFav(id); }
  toggleFav(e: MouseEvent, id?: string) { e.stopPropagation(); this.fav.toggle(id); }
  openFlat(f: Flat) { if (f.id) this.router.navigate(['/flats', f.id]); }

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
        title: it.title, image: it.image,
      };
      this.flats.upsert(flat);
    }
  }
}
