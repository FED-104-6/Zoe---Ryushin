// src/app/models/user-profile.ts
export interface UserProfile {
  uid: string;
  firstName: string;
  lastName: string;
  birthDate: Date;
  email: string;
  isAdmin: boolean;
}
