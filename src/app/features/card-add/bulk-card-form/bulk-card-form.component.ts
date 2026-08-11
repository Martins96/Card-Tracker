import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CollectionsService } from '../../../core/service/collections.service';
import { CardsService } from '../../../core/service/cards.service';
import { CardImagesService } from '../../../core/service/card-images.service';
import { CardCollection } from '../../../core/model/card-collection.model';
import { ImageCropperComponent } from '../../../shared/image-cropper/image-cropper.component';
import { CropRect, loadImage, sliceImageGrid } from '../../../shared/utils/image-processing.util';

interface GridCell {
  index: number;
  previewUrl: string;
  blob: Blob;
  quantity: number;
}

@Component({
  selector: 'app-bulk-card-form',
  standalone: true,
  imports: [FormsModule, ImageCropperComponent],
  templateUrl: './bulk-card-form.component.html',
  styleUrl: './bulk-card-form.component.scss',
})
export class BulkCardFormComponent {
  private collectionsService = inject(CollectionsService);
  private cardsService = inject(CardsService);
  private cardImagesService = inject(CardImagesService);

  collections = signal<CardCollection[]>([]);
  loading = signal(true);
  saving = signal(false);
  message = signal<string | null>(null);
  isError = signal(false);
  saveProgress = signal<{ done: number; total: number } | null>(null);

  selectedCollectionId = signal('');
  rows = signal<number>(3);
  cols = signal<number>(5);

  loadedImage = signal<HTMLImageElement | null>(null);
  sheetCropRect = signal<CropRect | null>(null);
  gridCells = signal<GridCell[]>([]);
  generatingGrid = signal(false);

  totalCells = computed(() => this.rows() * this.cols());

  constructor() {
    this.loadCollections();
  }

  private async loadCollections() {
    this.loading.set(true);
    try {
      const data = await this.collectionsService.getAll();
      this.collections.set(data);
      if (data.length > 0) this.selectedCollectionId.set(data[0].id);
    } catch (err) {
      this.setMessage('Errore nel caricamento delle collezioni.', true);
      console.error(err);
    } finally {
      this.loading.set(false);
    }
  }

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    try {
      const img = await loadImage(file);
      this.loadedImage.set(img);
      this.gridCells.set([]); // reset griglia precedente
    } catch (err) {
      this.setMessage('Impossibile caricare l\'immagine.', true);
      console.error(err);
    }
  }

  onCropChange(rect: CropRect) {
    this.sheetCropRect.set(rect);
  }

  async generateGrid() {
    const img = this.loadedImage();
    const rect = this.sheetCropRect();
    if (!img || !rect) return;

    this.generatingGrid.set(true);
    this.setMessage(null, false);

    try {
      const blobs = await sliceImageGrid(img, rect, this.rows(), this.cols());
      const cells: GridCell[] = blobs.map((blob, index) => ({
        index,
        previewUrl: URL.createObjectURL(blob),
        blob,
        quantity: 1,
      }));
      this.gridCells.set(cells);
    } catch (err) {
      this.setMessage('Errore durante il taglio della griglia.', true);
      console.error(err);
    } finally {
      this.generatingGrid.set(false);
    }
  }

  updateCellQuantity(index: number, quantity: number) {
    this.gridCells.update(cells =>
      cells.map(c => (c.index === index ? { ...c, quantity } : c))
    );
  }

  get isValid(): boolean {
    return !!this.selectedCollectionId() && this.gridCells().length > 0;
  }

  async onSubmit() {
    if (!this.isValid) {
      this.setMessage('Seleziona una collezione e genera la griglia prima di salvare.', true);
      return;
    }

    this.setMessage(null, false);
    this.saving.set(true);
    const cells = this.gridCells();
    this.saveProgress.set({ done: 0, total: cells.length });

    try {
      for (const cell of cells) {
        const card = await this.cardsService.add(this.selectedCollectionId(), cell.quantity);
        await this.cardImagesService.upload(card.id, cell.blob);
        this.saveProgress.update(p => (p ? { ...p, done: p.done + 1 } : p));
      }

      this.setMessage(`${cells.length} carte aggiunte con successo.`, false);
      this.resetForm();
    } catch (err) {
      this.setMessage('Errore durante il salvataggio. Alcune carte potrebbero essere state salvate.', true);
      console.error(err);
    } finally {
      this.saving.set(false);
      this.saveProgress.set(null);
    }
  }

  private resetForm() {
    this.loadedImage.set(null);
    this.sheetCropRect.set(null);
    this.gridCells().forEach(c => URL.revokeObjectURL(c.previewUrl));
    this.gridCells.set([]);
  }

  private setMessage(msg: string | null, error: boolean) {
    this.message.set(msg);
    this.isError.set(error);
  }
}