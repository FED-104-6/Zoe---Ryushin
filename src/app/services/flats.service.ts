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

  private colRef() {
    return collection(this.fs, 'flats');
  }

  currentUser() {
    const u = this.auth.currentUser;
    return {
      id: u?.uid || '',
      name: u?.displayName || '',
      email: u?.email || '',
    };
  }

  all$(): Observable<Flat[]> {
    return collectionData(query(this.colRef(), orderBy('createdAt', 'desc')), {
      idField: 'id',
    }) as Observable<Flat[]>;
  }

  async getOne(id: string): Promise<Flat | null> {
    console.log('[flats.getOne] id =', id);
    const snap = await getDoc(doc(this.fs, 'flats', id));
    const data = snap.exists() ? ({ id: snap.id, ...(snap.data() as any) } as Flat) : null;
    console.log('[flats.getOne] exists =', snap.exists(), data);
    return data;
  }

  async create(input: any): Promise<string> {
    const me = this.currentUser();
    console.log('[flats.create] user =', me);

    if (!me.id) {
      console.error('[flats.create] blocked: not signed in');
      throw new Error('Please sign in.');
    }

    const imgs: string[] = Array.isArray(input?.images) ? input.images : [];
    const cover: string = input?.image || imgs[0] || '';

    const payload: any = {
      title:         input?.title ?? '',
      city:          input?.city ?? '',
      streetName:    input?.streetName ?? '',
      streetNumber:  Number(input?.streetNumber ?? 0),
      areaSize:      Number(input?.areaSize ?? 0),
      yearBuilt:     Number(input?.yearBuilt ?? 2000),
      hasAC:         !!input?.hasAC,
      rentPrice:     Number(input?.rentPrice ?? 0),
      dateAvailable: input?.dateAvailable ?? '',

      image: cover,                          
      ...(imgs.length ? { images: imgs } : {}),

      ownerId:    me.id,
      ownerName:  me.name || 'Owner',
      ownerEmail: me.email || '',
      createdAt:  Date.now(),

      published: true,
    };

    console.log('[flats.create] payload =', payload);

    try {
      const ref = await addDoc(this.colRef(), payload);
      console.log('[flats.create] success, docId =', ref.id);
      return ref.id;
    } catch (e) {
      console.error('[flats.create] Firestore error =', e);
      throw e;
    }
  }

  async update(id: string, patch: Partial<Flat>) {
    console.log('[flats.update] id =', id, 'patch =', patch);
    await updateDoc(doc(this.fs, 'flats', id), patch as any);
    console.log('[flats.update] done');
  }

  async remove(id: string) {
    console.log('[flats.remove] id =', id);
    await deleteDoc(doc(this.fs, 'flats', id));
    console.log('[flats.remove] done');
  }

  async myFlats(uid: string): Promise<Flat[]> {
    console.log('[flats.myFlats] uid =', uid);
    const qref = query(
      this.colRef(),
      where('ownerId', '==', uid),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(qref);
    const rows = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }) as Flat);
    console.log('[flats.myFlats] rows =', rows.length);
    return rows;
  }
}
