import { Injectable } from '@angular/core';
import { Storage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';


@Injectable({ providedIn: 'root' })
export class UploadService {
constructor(private storage: Storage) {}
async upload(file: File, folder = 'flats') {
const key = `${folder}/${Date.now()}_${file.name}`;
const r = ref(this.storage, key);
await uploadBytes(r, file);
return await getDownloadURL(r);
}
}