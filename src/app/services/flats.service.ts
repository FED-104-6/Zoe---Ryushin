import { Injectable } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import {
  Firestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  orderBy,
  where,
} from '@angular/fire/firestore';
import { collectionData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Flat } from '../models/flat.model';

@Injectable({ providedIn: 'root' })
export class FlatsService {
  constructor(private fs: Firestore, private auth: Auth) {}

  // Reference to the "flats" collection in Firestore
  private colRef() {
    return collection(this.fs, 'flats');
  }

  // Get the currently signed-in user 
  currentUser() {
    const u = this.auth.currentUser;
    return {
      id: u?.uid || '',
      name: u?.displayName || '',
      email: u?.email || '',
    };
  }

  // Live list of all flats 
  all$(): Observable<Flat[]> {
    const qref = query(
      this.colRef(),
      where('published', '==', true),
      orderBy('createdAt', 'desc')
    );
    return collectionData(qref, { idField: 'id' }) as Observable<Flat[]>;
  }

  // Get a single flat by id 
  async getOne(id: string): Promise<Flat | null> {
    const snap = await getDoc(doc(this.fs, 'flats', id));
    return snap.exists() ? ({ id: snap.id, ...(snap.data() as any) } as Flat) : null;
  }

  // Create a new flat
  async create(input: any): Promise<string> {
    const me = this.currentUser();
    if (!me.id) throw new Error('Please sign in.');

    // Accept either single 'image' or 'images[]'
    const imgs: string[] = Array.isArray(input?.images) ? input.images : [];
    const cover: string = input?.image || imgs[0] || '';

    const payload: any = {
      title: input?.title ?? '',
      city: input?.city ?? '',
      streetName: input?.streetName ?? '',
      streetNumber: Number(input?.streetNumber ?? 0),
      areaSize: Number(input?.areaSize ?? 0),
      yearBuilt: Number(input?.yearBuilt ?? 2000),
      hasAC: !!input?.hasAC,
      rentPrice: Number(input?.rentPrice ?? 0),
      dateAvailable: input?.dateAvailable ?? '',
      image: input?.image || '',          
      ownerId: me.id,
      ownerName: me.name || 'Owner',
      ownerEmail: me.email || '',
      createdAt: Date.now(),
      published: true,                    
    };

    const ref = await addDoc(this.colRef(), payload);
    return ref.id;
  }

  // Update a flat
  async update(id: string, patch: Partial<Flat>) {
    await updateDoc(doc(this.fs, 'flats', id), patch as any);
  }

  // Delete a flat
  async remove(id: string) {
    await deleteDoc(doc(this.colRef(), id));
  }

  // My flats (query Firestore by ownerId)
  async myFlats(uid: string): Promise<Flat[]> {
    const qref = query(this.colRef(), where('ownerId', '==', uid), orderBy('createdAt', 'desc'));
    const snap = await getDocs(qref);
    return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }) as Flat);
  }
}
