import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Flat } from '../models/flat.model'; 

@Injectable({ providedIn: 'root' })
export class FlatsService {
  private LS_KEY = 'flats';
  private LS_USER = 'currentUser';

  currentUser(): { id: string; fullName?: string; email?: string } {
    try {
      const raw = localStorage.getItem(this.LS_USER);
      if (raw) return JSON.parse(raw);
    } catch {}
    return { id: 'demo-user-1', fullName: 'Demo User', email: 'demo@example.com' };
  }

  private readAll(): Flat[] {
    try {
      const raw = localStorage.getItem(this.LS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }
  private writeAll(list: Flat[]) {
    localStorage.setItem(this.LS_KEY, JSON.stringify(list));
  }

  listAll(): Flat[] {
    return this.readAll();
  }

  upsert(input: Flat): void {
    const list = this.readAll();
    const entity: Flat = { ...input };

    if (!entity.id) {
      entity.id = 'flat_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    }

    const idx = list.findIndex(f => f.id === entity.id);
    if (idx >= 0) list[idx] = { ...list[idx], ...entity };
    else list.unshift(entity);

    this.writeAll(list);
  }

  addFlat(newFlat: Flat): Observable<void> {
    this.upsert(newFlat);
    return of(void 0);
  }

  getMyCreatedFlats(): Observable<Flat[]> {
    const me = this.currentUser();
    return of(this.readAll().filter(f => f.ownerId === me.id));
  }

  getFlatById(id: string): Observable<Flat> {
    const hit = this.readAll().find(f => f.id === id);
    if (hit) return of(hit);
    return of({
      id,
      city: '', streetName: '', streetNumber: 0, areaSize: 0, hasAC: false,
      yearBuilt: 0, rentPrice: 0, dateAvailable: '', ownerId: 'seed',
    } as Flat);
  }

  updateFlat(id: string, patch: Partial<Flat>): Observable<void> {
    const list = this.readAll();
    const idx = list.findIndex(f => f.id === id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...patch, id };
      this.writeAll(list);
    }
    return of(void 0);
  }

  getMyFlats(userId: string): Observable<Flat[]> {
    return of(this.readAll().filter(f => f.ownerId === userId));
  }

  deleteFlat(id: string): Observable<void> {
    const list = this.readAll().filter(f => f.id !== id);
    this.writeAll(list);
    return of(void 0);
  }
}
