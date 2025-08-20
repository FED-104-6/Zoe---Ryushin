import { Injectable } from '@angular/core';
import { Flat } from '../models/flat.model';

const LS_KEY = 'flats';

@Injectable({ providedIn: 'root' })
export class FlatsService {
  private list: Flat[] = this.load();

  listAll(): Flat[] { return [...this.list]; }

  upsert(flat: Flat) {
    if (!flat.id) flat.id = crypto.randomUUID();
    const i = this.list.findIndex(f => f.id === flat.id);
    if (i >= 0) this.list[i] = { ...this.list[i], ...flat };
    else this.list.push(flat);
    this.save();
  }

  getById(id: string) { return this.list.find(f => f.id === id); }

  private load(): Flat[] {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); }
    catch { return []; }
  }
  private save() { localStorage.setItem(LS_KEY, JSON.stringify(this.list)); }
}
