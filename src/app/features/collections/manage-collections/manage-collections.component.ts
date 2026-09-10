import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CollectionsService } from '../../../core/service/collections.service';
import { CardCollection, CollectionType } from '../../../core/model/card-collection.model';

@Component({
  selector: 'app-manage-collections',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './manage-collections.component.html',
  styleUrl: './manage-collections.component.scss',
})
export class ManageCollectionsComponent {
  private collectionsService = inject(CollectionsService);

  collections = signal<CardCollection[]>([]);
  loading = signal(true);
  message = signal<string | null>(null);

  // Espone l'enum al template per la <select>
  readonly CollectionType = CollectionType;
  readonly collectionTypes = Object.values(CollectionType);

  newName = signal('');
  newType = signal<CollectionType>(CollectionType.CARTE);

  // id della collezione attualmente in modifica (null = nessuna)
  editingId = signal<string | null>(null);
  editingName = signal('');

  constructor() {
    this.loadCollections();
  }

  private async loadCollections() {
    this.loading.set(true);
    try {
      this.collections.set(await this.collectionsService.getAll());
    } catch (err) {
      this.message.set('Errore nel caricamento delle collezioni.');
      console.error(err);
    } finally {
      this.loading.set(false);
    }
  }

  async onCreate() {
    const name = this.newName().trim();
    if (!name) return;

    this.message.set(null);
    try {
      const created = await this.collectionsService.create(name, this.newType());
      this.collections.update(list =>
        [...list, created].sort((a, b) => a.name.localeCompare(b.name))
      );
      this.newName.set('');
      this.newType.set(CollectionType.CARTE);
    } catch (err) {
      this.message.set('Errore durante la creazione. Nome già esistente?');
      console.error(err);
    }
  }

  startEdit(collection: CardCollection) {
    this.editingId.set(collection.id);
    this.editingName.set(collection.name);
  }

  cancelEdit() {
    this.editingId.set(null);
    this.editingName.set('');
  }

  async confirmEdit() {
    const id = this.editingId();
    const name = this.editingName().trim();
    if (!id || !name) return;

    this.message.set(null);
    try {
      const updated = await this.collectionsService.rename(id, name);
      this.collections.update(list =>
        list.map(c => (c.id === id ? updated : c))
             .sort((a, b) => a.name.localeCompare(b.name))
      );
      this.cancelEdit();
    } catch (err) {
      this.message.set('Errore durante la rinomina. Nome già esistente?');
      console.error(err);
    }
  }

  async onDelete(collection: CardCollection) {
    const confirmed = confirm(
      `Eliminare "${collection.name}"? Verranno eliminate anche tutte le carte associate.`
    );
    if (!confirmed) return;

    this.message.set(null);
    try {
      await this.collectionsService.delete(collection.id);
      this.collections.update(list => list.filter(c => c.id !== collection.id));
    } catch (err) {
      this.message.set('Errore durante l\'eliminazione.');
      console.error(err);
    }
  }

  /** Etichetta leggibile per il tipo, usata nel template */
  typeLabel(type: CollectionType): string {
    return type === CollectionType.CARTE ? 'Carte' : 'Chibi';
  }
}