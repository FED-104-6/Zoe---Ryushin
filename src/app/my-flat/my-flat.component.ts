import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Observable } from 'rxjs';

import { FlatsService } from '../services/flats.service';
import { Flat } from '../models/flat.model';

@Component({
  selector: 'app-my-flat',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './my-flat.component.html',
})
export class MyFlatComponent implements OnInit {
  constructor(private flats: FlatsService, private router: Router) {}

  me!: { id: string; fullName?: string; email?: string };
  myFlats$!: Observable<Flat[]>;

  ngOnInit(): void {
    this.me = this.flats.currentUser();
    this.myFlats$ = this.flats.getMyFlats(this.me.id);
  }

  toNew()          { this.router.navigate(['/new-flat']); }
  toView(id: string) { this.router.navigate(['/search'], { queryParams: { view: id },  queryParamsHandling: 'merge' }); }
  toEdit(id: string) { this.router.navigate(['/search'], { queryParams: { edit: id },  queryParamsHandling: 'merge' }); }

  remove(id: string) {
    if (!confirm('Delete this flat?')) return;
    this.flats.deleteFlat(id).subscribe(() => {
      this.myFlats$ = this.flats.getMyFlats(this.me.id);
    });
  }
}
