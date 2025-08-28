// src/app/services/upload.service.ts
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class UploadService {
  async upload(file: File, _folder: string): Promise<string> {
    const img = await this.readImage(file);

    const MAX_SIDE = 1200;
    const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));
    const width = Math.max(1, Math.round(img.width * scale));
    const height = Math.max(1, Math.round(img.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

    const qualities = [0.85, 0.75, 0.65, 0.55, 0.45];
    let dataUrl = canvas.toDataURL('image/jpeg', qualities[0]);

    for (let i = 1; this.byteLength(dataUrl) > 900 * 1024 && i < qualities.length; i++) {
      dataUrl = canvas.toDataURL('image/jpeg', qualities[i]);
    }

    return dataUrl; 
  }

  private readImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.onload = () => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file); 
    });
  }

  private byteLength(dataUrl: string): number {
    const base64 = dataUrl.split(',')[1] || '';
    return Math.ceil(base64.length * 0.75);
  }
}
