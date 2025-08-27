import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { FlatsService } from '../services/flats.service';
import { FavoritesService } from '../services/favorites.service';
import { Flat } from '../models/flat.model';
import { firstValueFrom } from 'rxjs';

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


async ngOnInit() {
this.flats.all$().subscribe(rows => {
this.all = rows;
this.applyFilters();
});
try { this.favIds.set(await this.favs.listIds()); } catch {}
}


isFav(id?: string) { return this.favIds().includes(id || ''); }


async toggleFav(e: Event, id?: string) {
e.stopPropagation();
try {
await this.favs.toggle(id);
this.favIds.set(await this.favs.listIds());
} catch {}
}


toView(id: string) { this.router.navigate(['/flats', id]); }


applyFilters() {
const v = this.form.value;
let rows = [...this.all];
if (v.city) rows = rows.filter(r => r.city.toLowerCase().includes(v.city!.toLowerCase()));
if (v.street) rows = rows.filter(r => r.streetName.toLowerCase().includes(v.street!.toLowerCase()));
if (v.priceMin != null) rows = rows.filter(r => r.rentPrice >= (v.priceMin as number));
if (v.priceMax != null) rows = rows.filter(r => r.rentPrice <= (v.priceMax as number));
if (v.areaMin != null) rows = rows.filter(r => r.areaSize >= (v.areaMin as number));
if (v.areaMax != null) rows = rows.filter(r => r.areaSize <= (v.areaMax as number));
this.view = rows;
}


clearFilters() { this.form.reset({ city: '', street: '', priceMin: null, priceMax: null, areaMin: null, areaMax: null }); this.applyFilters(); }


sortBy(key: 'priceAsc'|'priceDesc') {
const rows = [...this.view];
if (key==='priceAsc') rows.sort((a,b)=> a.rentPrice-b.rentPrice); else rows.sort((a,b)=> b.rentPrice-a.rentPrice);
this.view = rows;
}
}