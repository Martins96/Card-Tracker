import { Injectable, inject } from '@angular/core';
import { SupabaseClientService } from './supabase-client.service';
import { CardCollection, CollectionType } from '../model/card-collection.model';
import { CardsService } from './cards.service';
import { CardImagesService } from './card-images.service';

@Injectable({ providedIn: 'root' })
export class CollectionsService {
  private supabase = inject(SupabaseClientService).client;
  private cardsService = inject(CardsService);
  private cardImagesService = inject(CardImagesService);

  async getAll(): Promise<CardCollection[]> {
    const { data, error } = await this.supabase
      .from('collections')
      .select('id, name, type')
      .order('name');

    if (error) throw error;
    return data as CardCollection[];
  }

  async create(name: string, type: CollectionType): Promise<CardCollection> {
    const { data, error } = await this.supabase
      .from('collections')
      .insert({ name, type })
      .select('id, name, type')
      .single();

    if (error) throw error;
    return data as CardCollection;
  }

  async delete(id: string): Promise<void> {
    // Recupera le card prima che il CASCADE le cancelli
    const cards = await this.cardsService.getByCollection(id);

    // Elimina le immagini corrispondenti dallo storage
    await Promise.allSettled(
      cards.map(card => this.cardImagesService.delete(card.id))
    );

    // Elimina la collection: il CASCADE si occupa delle cards
    const { error } = await this.supabase
      .from('collections')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async rename(id: string, name: string): Promise<CardCollection> {
    const { data, error } = await this.supabase
      .from('collections')
      .update({ name })
      .eq('id', id)
      .select('id, name, type')
      .single();

    if (error) throw error;
    return data as CardCollection;
  }
}