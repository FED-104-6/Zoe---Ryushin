import { Component, inject, signal, OnInit } from '@angular/core';
import { MaterialModule } from '../../services/ui/material.module';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { Auth, User } from '@angular/fire/auth';
import { doc, getDoc, Firestore } from '@angular/fire/firestore';
import { UserProfile } from '../../models/user-profile';

@Component({
  selector: 'app-profile.component',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
})
export class ProfileComponent implements OnInit {
  private afAuth = inject(Auth);
  private db = inject(Firestore);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  profile = signal<UserProfile | null>(null);
  canEdit = signal<boolean>(true);

  async ngOnInit() {
    // 1) 認証ユーザーを取得
    const authedUser =
      this.afAuth.currentUser ??
      (await new Promise<User | null>((res) => {
        const unsub = this.afAuth.onAuthStateChanged((u) => {
          res(u);
          unsub();
        });
      }));
    if (!authedUser) {
      this.router.navigate(['/login'], {
        queryParams: { redirect: '/profile' },
      });
      return;
    }

    // 2) 閲覧対象の uid を決定（/users/:uid があればそれ、なければ自分）
    const routeUid = this.route.snapshot.paramMap.get('uid');
    const viewedUid = routeUid || authedUser.uid;

    // 3) 閲覧対象プロフィールを取得
    const viewedSnap = await getDoc(doc(this.db, `users/${viewedUid}`));
    const viewed = viewedSnap.data() as any | undefined;
    if (!viewed) {
      this.profile.set(null);
      return;
    }

    // birthDate を UI 向けに正規化
    let normalizedBirth: string | undefined = undefined;
    const bd = viewed.birthDate;
    if (bd?.toDate) {
      const d: Date = bd.toDate();
      normalizedBirth = d.toISOString().slice(0, 10); // 'YYYY-MM-DD'
    } else if (typeof bd === 'string') {
      normalizedBirth = bd;
    }

    this.profile.set({
      ...viewed,
      uid: viewedUid,
      birthDate: normalizedBirth ?? viewed.birthDate,
    } as UserProfile);

    // 4) 編集可否（本人 or 管理者）
    //    管理者判定は「ログイン中ユーザーの users/{uid}.isAdmin」を参照
    let viewerIsAdmin = false;
    const viewerSnap = await getDoc(doc(this.db, `users/${authedUser.uid}`));
    const viewerDoc = viewerSnap.data() as any | undefined;
    viewerIsAdmin = !!viewerDoc?.isAdmin;

    this.canEdit.set(authedUser.uid === viewedUid || viewerIsAdmin);
  }

  goEdit() {
    const p = this.profile();
    if (!p) return;
    this.router.navigate(['/profile/edit', p.uid]);
  }
}
