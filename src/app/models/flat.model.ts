export interface Flat {
  id?: string;
  title?: string;
  city: string;
  streetName: string;
  streetNumber: number;
  areaSize: number;
  yearBuilt: number;
  hasAC: boolean;
  rentPrice: number;
  dateAvailable: string;

  ownerId: string;
  ownerName?: string;
  ownerEmail?: string;

  image?: string;        
  images?: string[];    
  createdAt?: number;
}