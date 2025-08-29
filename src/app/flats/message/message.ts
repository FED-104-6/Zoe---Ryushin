import { Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FlatsService } from '../../services/flats.service';
import { Flat } from '../../models/flat.model';
import { inject as di } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import {
  Firestore,
  collection,
  addDoc,
  collectionData,
  serverTimestamp,
  query,
  where,
  orderBy,
} from '@angular/fire/firestore';

interface FlatMessage {
  id?: string;
  createdAt: any; // Firestore Timestamp
  senderId: string;
  senderName: string;
  senderEmail: string;
  content: string;
}

@Component({
  selector: 'app-message',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './message.html',
  styleUrls: ['./message.css'],
})
export default class Message {
  @Input() flatId!: string; // The flat document id
  @Input() ownerId!: string; // Flat owner's uid
  @Input() ownerName: string = '';
  @Input() ownerEmail: string = '';
  @Input() currentUserId: string | null = null; // Logged-in user's uid
  @Input() canOwnerSend: boolean = false; // Owner reply disabled per spec
  private route = inject(ActivatedRoute);
  private flats = inject(FlatsService);
  private router = inject(Router);
  private auth = di(Auth);
  private db = di(Firestore);

  id!: string;
  flat!: Flat | null;

  messages: FlatMessage[] = [];
  draft = '';
  sending = false;
  isOwner = false;
  private sub: any;

  async ngOnInit() {
    // Prefer @Input flatId if provided, otherwise fall back to route param
    this.id = this.flatId || this.route.snapshot.paramMap.get('id')!;

    // Resolve current user id (prefer input if provided)
    const current = this.currentUserId || this.auth.currentUser?.uid || null;

    this.flat = await this.flats.getOne(this.id);

    // Determine if current user owns this flat (prefer @Input ownerId)
    const owner = this.ownerId || (this.flat as any)?.ownerId || null;
    this.isOwner = !!(owner && current && owner === current);

    // Build a query: owners see all messages; non-owners see only their own
    const msgsRef = collection(this.db, 'flats', this.id, 'messages');
    const q = this.isOwner
      ? query(msgsRef, orderBy('createdAt', 'desc'))
      : query(
          msgsRef,
          where('senderId', '==', current || ''),
          orderBy('createdAt', 'desc')
        );

    this.sub = collectionData(q, { idField: 'id' }).subscribe((rows: any[]) => {
      this.messages = rows as FlatMessage[];
    });
  }

  async send() {
    if (this.isOwner || !this.flat) return; // owners cannot send
    const user = this.auth.currentUser;
    const uid = this.currentUserId || user?.uid || null;
    if (!uid) return;
    const content = (this.draft || '').trim();
    if (!content) return;
    this.sending = true;
    try {
      const name =
        user?.displayName ||
        `${(user as any)?.firstName || ''} ${
          (user as any)?.lastName || ''
        }`.trim() ||
        'Anonymous';
      await addDoc(collection(this.db, 'flats', this.id, 'messages'), {
        createdAt: serverTimestamp(),
        senderId: uid,
        senderName: name,
        senderEmail: user?.email || '',
        content,
      } as FlatMessage);
      this.draft = '';
    } finally {
      this.sending = false;
    }
  }

  ngOnDestroy() {
    if (this.sub) {
      this.sub.unsubscribe?.();
    }
  }
}
