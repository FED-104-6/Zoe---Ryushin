import { Component, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FavoritesService } from '../services/favorites.service';
import { FlatsService } from '../services/flats.service';
import { Flat } from '../models/flat.model';
import { Subscription } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-favorites',
  imports: [CommonModule, RouterModule],
  templateUrl: './favorites.component.html',
  styleUrls: ['./favorites.component.css']
})
export class FavoritesComponent implements OnDestroy {
  private favs = inject(FavoritesService);
  private flats = inject(FlatsService);
  private router = inject(Router);

  private sub?: Subscription;

  all: Flat[] = [];
  view = signal<Flat[]>([]);
  favIds = signal<string[]>([]);

  async ngOnInit() {
    this.sub = this.flats.all$().subscribe(rows => {
      this.all = rows ?? [];
      this.recompute();
    });

    try {
      this.favIds.set(await this.favs.listIds());
      this.recompute();
    } catch { }
  }

  ngOnDestroy() { this.sub?.unsubscribe(); }

  private recompute() {
    const ids = new Set(this.favIds());
    this.view.set(this.all.filter(f => f.id && ids.has(f.id!)));
  }

  sort(dir: 'asc' | 'desc') {
    const rows = [...this.view()];
    rows.sort((a, b) =>
      dir === 'asc'
        ? Number(a.rentPrice ?? 0) - Number(b.rentPrice ?? 0)
        : Number(b.rentPrice ?? 0) - Number(a.rentPrice ?? 0)
    );
    this.view.set(rows);
  }

  open(f: Flat) {
    if (f.id) this.router.navigate(['/flats', f.id]);
  }

  async remove(e: Event, id?: string) {
    e.preventDefault();
    e.stopPropagation(); 
    if (!id) return;
    try {
      await this.favs.toggle(id);                 
      this.favIds.set(await this.favs.listIds()); 
      this.recompute();                           
    } catch (err) {
      console.error('[remove favorite failed]', err);
    }
  }
}
