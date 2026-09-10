import { Injectable, inject } from '@angular/core';
import { SupabaseClientService } from './supabase-client.service';
import { firstValueFrom } from 'rxjs';
import { HttpClient, HttpContext } from '@angular/common/http';
import { withCache } from '@ngneat/cashew';

const BUCKET = 'card-images';

@Injectable({ providedIn: 'root' })
export class CardImagesService {
  private http = inject(HttpClient);
  private supabase = inject(SupabaseClientService).client;

  private objectUrls = new Map<string, string>();

  getPublicUrl(cardId: string): string {
    const { data } = this.supabase.storage
      .from(BUCKET)
      .getPublicUrl(`${cardId}.jpg`);

    return data.publicUrl;
  }

  async getCachedUrl(cardId: string): Promise<string> {
    const publicUrl = this.getPublicUrl(cardId);
 
    try {
      const blob = await firstValueFrom(
        this.http.get(publicUrl, {
          responseType: 'blob',
          context: withCache(), // usa il TTL configurato in app.config.ts
        })
      );
 
      const previous = this.objectUrls.get(cardId);
      if (previous) URL.revokeObjectURL(previous);
 
      const blobUrl = URL.createObjectURL(blob);
      this.objectUrls.set(cardId, blobUrl);
      return blobUrl;
    } catch (err) {
      console.warn(`Caricamento immagine fallito per la carta ${cardId}, uso url diretto:`, err);
      return publicUrl;
    }
  }

  async upload(cardId: string, file: Blob): Promise<void> {
    const { error } = await this.supabase.storage
      .from(BUCKET)
      .upload(`${cardId}.jpg`, file, {
        contentType: 'image/jpeg',
        upsert: true,
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