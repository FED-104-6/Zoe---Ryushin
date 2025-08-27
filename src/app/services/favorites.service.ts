import { Injectable } from '@angular/core';
import { Firestore, collection, doc, getDocs, setDoc, deleteDoc } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';


@Injectable({ providedIn: 'root' })
export class FavoritesService {
constructor(private fs: Firestore, private auth: Auth) {}
private col() {
const u = this.auth.currentUser;
if (!u) throw new Error('Please sign in.');
return collection(this.fs, `users/${u.uid}/favorites`);
}


async listIds(): Promise<string[]> {
const snap = await getDocs(this.col());
return snap.docs.map(d => d.id);
}


async isFav(id?: string) { if (!id) return false; return (await this.listIds()).includes(id); }


async toggle(id?: string) {
if (!id) return;
const ids = await this.listIds();
const ref = doc(this.col(), id);
if (ids.includes(id)) await deleteDoc(ref); else await setDoc(ref, { addedAt: Date.now() });
}


async clearAll() {
const ids = await this.listIds();
await Promise.all(ids.map(i => deleteDoc(doc(this.col(), i))));
}
}