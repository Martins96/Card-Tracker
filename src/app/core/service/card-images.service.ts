import { Injectable, inject } from '@angular/core';
import { SupabaseClientService } from './supabase-client.service';

const BUCKET = 'card-images';

@Injectable({ providedIn: 'root' })
export class CardImagesService {
  private supabase = inject(SupabaseClientService).client;

  getPublicUrl(cardId: string): string {
    const { data } = this.supabase.storage
      .from(BUCKET)
      .getPublicUrl(`${cardId}.jpg`);

    return data.publicUrl;
  }

  async upload(cardId: string, file: File): Promise<void> {
    const { error } = await this.supabase.storage
      .from(BUCKET)
      .upload(`${cardId}.jpg`, file, {
        contentType: file.type,
        upsert: true, // sovrascrive se già esiste (utile per correzioni)
      });

    if (error) throw error;
  }

  async delete(cardId: string): Promise<void> {
    const { error } = await this.supabase.storage
      .from(BUCKET)
      .remove([`${cardId}.jpg`]);

    if (error) throw error;
  }
}