import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { FlatsService } from '../services/flats.service';
import { Flat } from '../models/flat.model';

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <h2>My Flats</h2>

    <table *ngIf="rows().length">
      <thead>
        <tr>
          <th>Title</th>
          <th>City</th>
          <th>Price</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let f of rows()">
          <td>{{ f.title || (f.city + ' · ' + f.streetName) }}</td>
          <td>{{ f.city }}</td>
          <td>\${{ f.rentPrice }}</td>
          <td>
            <button (click)="toView(f.id!)">View</button>
            <button (click)="toEdit(f.id!)">Edit</button>
            <button (click)="onDelete(f.id!)">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>

    <p *ngIf="!rows().length">No flats yet.</p>
  `,
})
export class MyFlatComponent {
  private auth = inject(Auth);
  private flats = inject(FlatsService);
  private router = inject(Router);

  rows = signal<Flat[]>([]);

  async ngOnInit() {
    const uid = this.auth.currentUser?.uid || '';
    if (!uid) return;
    this.rows.set(await this.flats.myFlats(uid));
  }

  toView(id: string) {
    this.router.navigate(['/flats', id]);
  }

  toEdit(id: string) {
    this.router.navigate(['/flats', id, 'edit']);
  }

  async onDelete(id: string) {
    await this.flats.remove(id);
    this.rows.set(this.rows().filter((r) => r.id !== id));
  }
}
