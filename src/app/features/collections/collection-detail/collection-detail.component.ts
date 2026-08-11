import { Component, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CardsService } from '../../../core/service/cards.service';
import { CardImagesService } from '../../../core/service/card-images.service';
import { CollectionsService } from '../../../core/service/collections.service';
import { Card } from '../../../core/model/card-collection.model';

interface CardWithImage extends Card {
  imageUrl: string;
}

@Component({
  selector: 'app-collection-detail',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './collection-detail.component.html',
  styleUrl: './collection-detail.component.scss',
})
export class CollectionDetailComponent {
  private route = inject(ActivatedRoute);
  private cardsService = inject(CardsService);
  private collectionsService = inject(CollectionsService);
  private cardImagesService = inject(CardImagesService);

  private collectionId = this.route.snapshot.paramMap.get('id')!;

  collectionName = signal<string>('');
  cards = signal<Card[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  // Carta selezionata per la modifica quantità (null = nessun popup aperto)
  editingCard = signal<CardWithImage | null>(null);
  editingQuantity = signal<number>(0);
  savingQuantity = signal(false);

  cardsWithImages = computed<CardWithImage[]>(() =>
    this.cards().map(card => ({
      ...card,
      imageUrl: this.cardImagesService.getPublicUrl(card.id),
    }))
  );

  totalQuantity = computed(() =>
    this.cards().reduce((sum, c) => sum + c.quantity, 0)
  );

  constructor() {
    this.load();
  }

  private async load() {
    this.loading.set(true);
    this.error.set(null);
    try {
      const [collections, cards] = await Promise.all([
        this.collectionsService.getAll(),
        this.cardsService.getByCollection(this.collectionId),
      ]);

      const collection = collections.find(c => c.id === this.collectionId);
      this.collectionName.set(collection?.name ?? 'Collezione');
      this.cards.set(cards);
    } catch (err) {
      this.error.set('Impossibile caricare la collezione.');
      console.error(err);
    } finally {
      this.loading.set(false);
    }
  }

  openEdit(card: CardWithImage) {
    this.editingCard.set(card);
    this.editingQuantity.set(card.quantity);
  }

  closeEdit() {
    this.editingCard.set(null);
  }

  incrementEdit() {
    this.editingQuantity.update(q => q + 1);
  }

  decrementEdit() {
    this.editingQuantity.update(q => Math.max(0, q - 1));
  }

  async saveEdit() {
    const card = this.editingCard();
    if (!card) return;

    this.savingQuantity.set(true);
    try {
      await this.cardsService.updateQuantity(card.id, this.editingQuantity());
      this.cards.update(list =>
        list.map(c => (c.id === card.id ? { ...c, quantity: this.editingQuantity() } : c))
      );
      this.closeEdit();
    } catch (err) {
      this.error.set('Errore durante l\'aggiornamento della quantità.');
      console.error(err);
    } finally {
      this.savingQuantity.set(false);
    }
  }
}