import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FavoritesService } from '../services/favorites.service';
import { FlatsService } from '../services/flats.service';
import { Flat } from '../models/flat.model';

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <h2>My Favorites</h2>

    <div class="sort">
      <button (click)="sort('asc')">Price ↑</button>
      <button (click)="sort('desc')">Price ↓</button>
    </div>

    <div *ngIf="rows().length; else empty">
      <div
        class="flat-card"
        *ngFor="let f of rows()"
        (click)="toView(f.id!)"
      >
        <img
          [src]="f.image || 'assets/placeholder.jpg'"
          width="160"
          height="100"
        />
        <div>
          <div>
            {{ f.title || (f.city + ' · ' + f.streetName) }}
          </div>
          <div>\${{ f.rentPrice }}</div>
          <button (click)="remove($event, f.id!)">Remove</button>
        </div>
      </div>
    </div>

    <ng-template #empty>
      <p>No favorites yet.</p>
    </ng-template>
  `,
})
export class FavoritesComponent {
  private favs = inject(FavoritesService);
  private flats = inject(FlatsService);
  private router = inject(Router);

  rows = signal<Flat[]>([]);

  async ngOnInit() {
    const ids = await this.favs.listIds();
    const all = await new Promise<Flat[]>(resolve =>
      this.flats.all$().subscribe(resolve)
    );
    this.rows.set(all.filter(r => ids.includes(r.id!)));
  }

  toView(id: string) {
    this.router.navigate(['/flats', id]);
  }

  async remove(e: Event, id: string) {
    e.stopPropagation();
    await this.favs.toggle(id);
    this.rows.set(this.rows().filter(r => r.id !== id));
  }

  sort(dir: 'asc' | 'desc') {
    const rows = [...this.rows()];
    rows.sort((a, b) =>
      dir === 'asc' ? a.rentPrice - b.rentPrice : b.rentPrice - a.rentPrice
    );
    this.rows.set(rows);
  }
}

