import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Flat } from '../models/flat.model';
import { FlatsService } from '../services/flats.service';
import { FavoritesService } from '../services/favorites.service';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './favorites.component.html',
  styleUrls: ['./favorites.component.css'],
})
export class FavoritesComponent implements OnInit {
  view: Flat[] = [];
  sort: 'priceAsc' | 'priceDesc' | null = null;

  constructor(
    private flats: FlatsService,
    private fav: FavoritesService,
    private router: Router
  ) {}

  ngOnInit(): void { this.refresh(); }

  private refresh() {
    const all = this.flats.listAll();
    const ids = this.fav.listIds();
    this.view = all.filter(f => !!f.id && ids.includes(f.id!));
    this.view = this.sortList([...this.view]);
  }

  openFlat(f: Flat) { if (f.id) this.router.navigate(['/flats', f.id]); }

  remove(id?: string) { if (!id) return; this.fav.toggle(id); this.refresh(); }

  clearAll() { this.fav.clearAll(); this.refresh(); }

  sortBy(kind: 'priceAsc' | 'priceDesc') { this.sort = kind; this.view = this.sortList([...this.view]); }

  private sortList(list: Flat[]): Flat[] {
    switch (this.sort) {
      case 'priceAsc':  return list.sort((a, b) => a.rentPrice - b.rentPrice);
      case 'priceDesc': return list.sort((a, b) => b.rentPrice - a.rentPrice);
      default:          return list;
    }
  }

  get isEmpty(): boolean { return this.view.length === 0; }
}
