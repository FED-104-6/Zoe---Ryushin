import {
  Component,
  ViewChild,
  AfterViewInit,
  OnInit,
  DestroyRef,
  inject,
} from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  query,
  where,
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
} from '@angular/fire/firestore';
import { forkJoin, from } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { getCountFromServer } from 'firebase/firestore';

export interface UserRow {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
  isAdmin: boolean;
  flatsCount?: number;
  birthDate?: any;
}

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatChipsModule,
    MatSelectModule,
    FormsModule,
  ],
  templateUrl: './users.html',
  styleUrls: ['./users.css'],
})
export class UsersComponent implements AfterViewInit, OnInit {
  displayedColumns = [
    'name',
    'email',
    'isAdmin',
    'flats',
    'profile',
    'actions',
  ];
  dataSource = new MatTableDataSource<UserRow>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private router = inject(Router);
  private firestore = inject(Firestore);
  private destroyRef = inject(DestroyRef);

  // --- Filter state (two-way bound from template) ---
  searchTerm = '';
  adminFilter: 'all' | 'admin' | 'user' = 'all';
  ageMin?: number;
  ageMax?: number;
  flatsMin?: number;
  flatsMax?: number;

  ngOnInit() {
    // Users stream with createdAt ordering
    const usersCol = collection(this.firestore, 'users');
    const usersQuery = query(usersCol, orderBy('createdAt', 'desc'));

    // 1) Fetch users  2) For each user, count flats via collectionGroup  3) Bind to table
    collectionData(usersQuery, { idField: 'uid' })
      .pipe(
        switchMap((users: any[]) => {
          if (!users?.length) return from([[]]);

          const jobs = users.map((u: any) =>
            from(
              getCountFromServer(
                query(
                  collection(this.firestore, 'flats'),
                  where('ownerId', '==', u.uid)
                )
              )
            ).pipe(
              map((snap) => ({
                uid: u.uid,
                firstName: u.firstName ?? '',
                lastName: u.lastName ?? '',
                email: u.email ?? '',
                isAdmin: !!u.isAdmin,
                flatsCount: snap.data().count ?? 0,
                birthDate: u.birthDate ?? null,
              }))
            )
          );
          return forkJoin(jobs);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((rows: UserRow[]) => {
        this.dataSource.data = rows;
        this.updateFilter();
      });
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.dataSource.sortingDataAccessor = (item: UserRow, property: string) => {
      switch (property) {
        case 'name':
          return `${item.firstName ?? ''} ${item.lastName ?? ''}`.toLowerCase();
        case 'firstName':
          return (item.firstName ?? '').toLowerCase();
        case 'lastName':
          return (item.lastName ?? '').toLowerCase();
        case 'flats':
        case 'flatsCount':
          return item.flatsCount ?? 0;
        default:
          return (item as any)[property];
      }
    };
    this.dataSource.filterPredicate = (data: UserRow, filter: string) => {
      const f = JSON.parse(filter) as {
        searchTerm: string;
        adminFilter: 'all' | 'admin' | 'user';
        ageMin?: number;
        ageMax?: number;
        flatsMin?: number;
        flatsMax?: number;
      };

      // text
      const term = (f.searchTerm || '').trim().toLowerCase();
      if (term) {
        const name = `${data.firstName} ${data.lastName}`.toLowerCase();
        if (!name.includes(term) && !data.email.toLowerCase().includes(term))
          return false;
      }
      // admin
      if (f.adminFilter === 'admin' && !data.isAdmin) return false;
      if (f.adminFilter === 'user' && data.isAdmin) return false;
      // age (from birthDate)
      const age = this.getAge(data.birthDate);
      if (f.ageMin != null && age != null && age < f.ageMin) return false;
      if (f.ageMax != null && age != null && age > f.ageMax) return false;
      // flats count
      const c = data.flatsCount ?? 0;
      if (f.flatsMin != null && c < f.flatsMin) return false;
      if (f.flatsMax != null && c > f.flatsMax) return false;
      return true;
    };
  }

  applyFilter(value: string) {
    this.searchTerm = value || '';
    this.updateFilter();
  }

  updateFilter() {
    const payload = JSON.stringify({
      searchTerm: this.searchTerm,
      adminFilter: this.adminFilter,
      ageMin: this.ageMin ?? null,
      ageMax: this.ageMax ?? null,
      flatsMin: this.flatsMin ?? null,
      flatsMax: this.flatsMax ?? null,
    });
    this.dataSource.filter = payload;
    if (this.dataSource.paginator) this.dataSource.paginator.firstPage();
  }

  private getAge(birthDate: any): number | null {
    if (!birthDate) return null;
    let d: Date;
    if (birthDate?.seconds) {
      d = new Date(birthDate.seconds * 1000);
    } else if (typeof birthDate === 'string' || birthDate instanceof Date) {
      d = new Date(birthDate);
    } else {
      return null;
    }
    const now = new Date();
    let age = now.getFullYear() - d.getFullYear();
    const m = now.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
    return age;
  }

  // --- Admin operations ---
  async grantAdmin(u: UserRow) {
    if (!confirm(`Grant admin to ${u.firstName} ${u.lastName}?`)) return;
    await updateDoc(doc(this.firestore, 'users', u.uid), { isAdmin: true });
  }
  async revokeAdmin(u: UserRow) {
    if (!confirm(`Revoke admin from ${u.firstName} ${u.lastName}?`)) return;
    await updateDoc(doc(this.firestore, 'users', u.uid), { isAdmin: false });
  }
  async removeUser(u: UserRow) {
    if (!confirm(`Remove user "${u.email}"? This cannot be undone.`)) return;
    await deleteDoc(doc(this.firestore, 'users', u.uid));
  }

  openProfile(uid: string) {
    this.router.navigate(['/profile', uid]);
  }
}
