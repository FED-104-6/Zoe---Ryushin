import { Injectable } from '@angular/core';
const LS_KEY = 'favorites_ids';

@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private ids = new Set<string>(this.load());

  isFav(id?: string) { return !!id && this.ids.has(id); }

  toggle(id?: string) {
    if (!id) return;
    this.ids.has(id) ? this.ids.delete(id) : this.ids.add(id);
    this.save();
  }

  listIds(): string[] { return [...this.ids]; }

  clearAll() { this.ids.clear(); this.save(); }

  private save() { localStorage.setItem(LS_KEY, JSON.stringify([...this.ids])); }
  private load(): string[] {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); }
    catch { return []; }
  }
}
