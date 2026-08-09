import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CollectionsService } from '../../core/service/collections.service';
import { CardsService } from '../../core/service/cards.service';
import { CardCollection } from '../../core/model/card-collection.model';

@Component({
  selector: 'app-card-add',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './card-add.component.html',
  styleUrl: './card-add.component.scss',
})
export class CardAddComponent {
  private collectionsService = inject(CollectionsService);
  private cardsService = inject(CardsService);

  collections = signal<CardCollection[]>([]);
  loading = signal(true);
  saving = signal(false);
  message = signal<string | null>(null);

  selectedCollectionId = signal<string>('');
  newCollectionName = signal<string>('');
  quantity = signal<number>(1);

  constructor() {
    this.loadCollections();
  }

  private async loadCollections() {
    this.loading.set(true);
    try {
      const data = await this.collectionsService.getAll();
      this.collections.set(data);
      if (data.length > 0) {
        this.selectedCollectionId.set(data[0].id);
      }
    } catch (err) {
      this.message.set('Errore nel caricamento delle collezioni.');
      console.error(err);
    } finally {
      this.loading.set(false);
    }
  }

  async onSubmit() {
    this.message.set(null);
    this.saving.set(true);

    try {
      let collectionId = this.selectedCollectionId();

      // Se l'utente ha scritto un nome nuovo, crea prima la collezione
      const newName = this.newCollectionName().trim();
      if (newName) {
        const created = await this.collectionsService.create(newName);
        collectionId = created.id;
        this.collections.update(list => [...list, created]);
        this.selectedCollectionId.set(collectionId);
        this.newCollectionName.set('');
      }

      if (!collectionId) {
        this.message.set('Seleziona o crea una collezione.');
        return;
      }

      const card = await this.cardsService.add(collectionId, this.quantity());
      this.message.set(`Carta aggiunta (id: ${card.id.slice(0, 8)}...). Ricordati di caricare l'immagine con questo nome file.`);
      this.quantity.set(1);
    } catch (err) {
      this.message.set('Errore durante il salvataggio.');
      console.error(err);
    } finally {
      this.saving.set(false);
    }
  }
}