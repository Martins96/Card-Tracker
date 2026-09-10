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

type OwnershipFilter = 'ALL' | 'OWNED' | 'NOT_OWNED' | 'TRADEABLE';

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

  private imageUrls = signal<Map<string, string>>(new Map());

  editingCard = signal<CardWithImage | null>(null);
  editingQuantity = signal<number>(0);
  savingQuantity = signal(false);
  deletingCard = signal(false);
  confirmDelete = signal(false);

  ownershipFilter = signal<OwnershipFilter>('ALL');

  cardsWithImages = computed<CardWithImage[]>(() => {
    const urls = this.imageUrls();
    return this.cards().map(card => ({
      ...card,
      // finché la cache non ha risposto uso l'url diretto come fallback
      imageUrl: urls.get(card.id) ?? this.cardImagesService.getPublicUrl(card.id),
    }));
  });

  filteredCards = computed<CardWithImage[]>(() => {
    const filter = this.ownershipFilter();
    const all = this.cardsWithImages();
    switch (filter) {
      case 'OWNED':
        return all.filter(c => c.quantity > 0);
      case 'NOT_OWNED':
        return all.filter(c => c.quantity === 0);
      case 'TRADEABLE':
        return all.filter(c => c.quantity > 1);
      default:
        return all;
    }
  });

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
      this.loadImages(cards);
    } catch (err) {
      this.error.set('Impossibile caricare la collezione.');
      console.error(err);
    } finally {
      this.loading.set(false);
    }
  }

  private async loadImages(cards: Card[]) {
    const entries = await Promise.all(
      cards.map(async c => [c.id, await this.cardImagesService.getCachedUrl(c.id)] as const)
    );
    this.imageUrls.set(new Map(entries));
  }

  setOwnershipFilter(filter: OwnershipFilter) {
    this.ownershipFilter.set(filter);
  }

  openEdit(card: CardWithImage) {
    this.editingCard.set(card);
    this.editingQuantity.set(card.quantity);
    this.confirmDelete.set(false);
  }

  closeEdit() {
    this.editingCard.set(null);
    this.confirmDelete.set(false);
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

  askDelete() {
    this.confirmDelete.set(true);
  }

  cancelDelete() {
    this.confirmDelete.set(false);
  }

  async deleteCard() {
    const card = this.editingCard();
    if (!card) return;

    this.deletingCard.set(true);
    try {
      await this.cardsService.delete(card.id);
      try {
        await this.cardImagesService.delete(card.id);
      } catch (imgErr) {
        console.warn('Immagine non eliminata da storage:', imgErr);
      }

      this.cards.update(list => list.filter(c => c.id !== card.id));
      this.imageUrls.update(map => {
        const next = new Map(map);
        next.delete(card.id);
        return next;
      });
      this.closeEdit();
    } catch (err) {
      this.error.set('Errore durante l\'eliminazione della carta.');
      console.error(err);
    } finally {
      this.deletingCard.set(false);
    }
  }


  /* Graphical functions */
  onImgLoad(event: Event) {
    (event.target as HTMLImageElement).classList.remove('loading');
  }

  onImgError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.classList.remove('loading');
    img.classList.add('error');
  }
}