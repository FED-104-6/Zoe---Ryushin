import { Injectable } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Firestore, collection, doc, addDoc, updateDoc, deleteDoc, getDoc, query, orderBy, getDocs } from '@angular/fire/firestore';
import { collectionData } from '@angular/fire/firestore';
import { Flat } from '../models/flat.model';
import { Observable, map } from 'rxjs';


@Injectable({ providedIn: 'root' })
export class FlatsService {
constructor(private fs: Firestore, private auth: Auth) {}


private colRef() { return collection(this.fs, 'flats'); }


currentUser() {
const u = this.auth.currentUser;
return { id: u?.uid || '', name: u?.displayName || '', email: u?.email || '' };
}

// live flats
all$(): Observable<Flat[]> {
return collectionData(query(this.colRef(), orderBy('createdAt','desc')), { idField: 'id' }) as Observable<Flat[]>;
}

async getOne(id: string): Promise<Flat | null> {
const snap = await getDoc(doc(this.fs, 'flats', id));
return snap.exists() ? ({ id: snap.id, ...snap.data() } as Flat) : null;
}

async create(input: Omit<Flat,'id'|'ownerId'|'ownerName'|'ownerEmail'|'createdAt'>) {
const me = this.currentUser();
if (!me.id) throw new Error('Please sign in.');
const payload: Flat = {
...input,
ownerId: me.id,
ownerName: me.name || 'Owner',
ownerEmail: me.email || '',
createdAt: Date.now(),
image: input.images?.[0] || input.image || '',
};
const ref = await addDoc(this.colRef(), payload as any);
return ref.id;
}

async update(id: string, patch: Partial<Flat>) {
await updateDoc(doc(this.fs, 'flats', id), patch as any);
}


async remove(id: string) {
await deleteDoc(doc(this.fs, 'flats', id));
}


// my own flats
async myFlats(uid: string): Promise<Flat[]> {
const q = query(this.colRef());
const snap = await getDocs(q);
return snap.docs
.map(d => ({ id: d.id, ...(d.data() as any) }))
.filter((r: any) => r.ownerId === uid) as Flat[];
}
}
