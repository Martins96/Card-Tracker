import { Injectable, inject } from '@angular/core';
import { SupabaseClientService } from './supabase-client.service';
import { Card } from '../model/card-collection.model';

@Injectable({ providedIn: 'root' })
export class CardsService {
  private supabase = inject(SupabaseClientService).client;

  async getByCollection(collectionId: string): Promise<Card[]> {
    const { data, error } = await this.supabase
      .from('cards')
      .select('id, collection_id, quantity')
      .eq('collection_id', collectionId)
      .order('created_at');

    if (error) throw error;
    return data as Card[];
  }

  async add(collectionId: string, quantity = 1): Promise<Card> {
    const { data, error } = await this.supabase
      .from('cards')
      .insert({ collection_id: collectionId, quantity })
      .select('id, collection_id, quantity')
      .single();

    if (error) throw error;
    return data as Card;
  }

  async updateQuantity(cardId: string, quantity: number): Promise<void> {
    const { error } = await this.supabase
      .from('cards')
      .update({ quantity })
      .eq('id', cardId);

    if (error) throw error;
  }

  async delete(cardId: string): Promise<void> {
    const { error } = await this.supabase
      .from('cards')
      .delete()
      .eq('id', cardId);

    if (error) throw error;
  }
}