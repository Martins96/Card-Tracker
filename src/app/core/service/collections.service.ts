import { Injectable, inject } from '@angular/core';
import { SupabaseClientService } from './supabase-client.service';
import { CardCollection } from '../model/card-collection.model';

@Injectable({ providedIn: 'root' })
export class CollectionsService {
  private supabase = inject(SupabaseClientService).client;

  async getAll(): Promise<CardCollection[]> {
    const { data, error } = await this.supabase
      .from('collections')
      .select('id, name')
      .order('name');

    if (error) throw error;
    return data as CardCollection[];
  }

  async create(name: string): Promise<CardCollection> {
    const { data, error } = await this.supabase
      .from('collections')
      .insert({ name })
      .select('id, name')
      .single();

    if (error) throw error;
    return data as CardCollection;
  }

  async delete(id: string): Promise<void> {
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
      .select('id, name')
      .single();

    if (error) throw error;
    return data as CardCollection;
  }
}