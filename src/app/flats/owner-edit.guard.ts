import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { FlatsService } from '../services/flats.service';


export const ownerEditGuard: CanActivateFn = async (route) => {
const router = inject(Router);
const auth = inject(Auth);
const flats = inject(FlatsService);
const id = route.paramMap.get('id')!;
const flat = await flats.getOne(id);
if (!flat) return router.createUrlTree(['/search']);
return auth.currentUser?.uid === flat.ownerId ? true : router.createUrlTree(['/flats', id]);
};