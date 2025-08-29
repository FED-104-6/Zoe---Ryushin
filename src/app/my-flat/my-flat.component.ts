import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FlatsService } from '../services/flats.service';
import { Flat } from '../models/flat.model';

@Component({
  standalone: true,
  selector: 'app-my-flat',
  imports: [CommonModule, RouterModule],
  templateUrl: './my-flat.component.html',
  styleUrls: ['./my-flat.component.css'],
})
export class MyFlatComponent {
  private flats = inject(FlatsService);
  private router = inject(Router);

  loading = signal<boolean>(true);
  rows = signal<Flat[]>([]);
  error = signal<string | null>(null);

  async ngOnInit() {
    try {
      const me = this.flats.currentUser();
      if (!me.id) {
        this.router.navigate(['/login']);
        return;
      }
      this.rows.set(await this.flats.myFlats(me.id));
    } catch (e: any) {
      this.error.set(e?.message ?? 'Failed to load your flats');
    } finally {
      this.loading.set(false);
    }
  }

  toView(e: Event, id?: string) {
    e.stopPropagation();
    if (id) this.router.navigate(['/flats', id]);
  }

  toEdit(e: Event, id?: string) {
    e.stopPropagation();
    if (id) this.router.navigate(['/flats', id, 'edit']);
  }

  async remove(e: Event, id?: string) {
    e.stopPropagation();
    if (!id) return;
    const ok = confirm('Delete this flat? This cannot be undone.');
    if (!ok) return;
    try {
      await this.flats.remove(id);
      this.rows.set(this.rows().filter(r => r.id !== id));
    } catch (err) {
      console.error(err);
      alert('Delete failed. Please try again.');
    }
  }

  addr(f: Flat) {
    return [f.streetNumber, f.streetName, f.city].filter(Boolean).join(' ');
  }
}
