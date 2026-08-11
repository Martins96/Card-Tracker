import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CollectionsService } from '../../../core/service/collections.service';
import { CardsService } from '../../../core/service/cards.service';
import { CardImagesService } from '../../../core/service/card-images.service';
import { CardCollection } from '../../../core/model/card-collection.model';
import { ImageCropperComponent } from '../../../shared/image-cropper/image-cropper.component';
import { CropRect, loadImage, processImage } from '../../../shared/utils/image-processing.util';

@Component({
  selector: 'app-single-card-form',
  standalone: true,
  imports: [FormsModule, ImageCropperComponent],
  templateUrl: './single-card-form.component.html',
  styleUrl: './single-card-form.component.scss',
})
export class SingleCardFormComponent {
  private collectionsService = inject(CollectionsService);
  private cardsService = inject(CardsService);
  private cardImagesService = inject(CardImagesService);

  collections = signal<CardCollection[]>([]);
  loading = signal(true);
  saving = signal(false);
  message = signal<string | null>(null);
  isError = signal(false);

  selectedCollectionId = signal('');
  quantity = signal<number>(1);
  notOwned = signal(false);

  loadedImage = signal<HTMLImageElement | null>(null);
  cropRect = signal<CropRect | null>(null);

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

  onNotOwnedChange(checked: boolean) {
    this.notOwned.set(checked);
    if (checked) this.quantity.set(0);
    else if (this.quantity() === 0) this.quantity.set(1);
  }

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    try {
      const img = await loadImage(file);
      this.loadedImage.set(img);
    } catch (err) {
      this.setMessage('Impossibile caricare l\'immagine.', true);
      console.error(err);
    }
  }

  onCropChange(rect: CropRect) {
    this.cropRect.set(rect);
  }

  get isValid(): boolean {
    return (
      !!this.selectedCollectionId() &&
      !!this.loadedImage() &&
      !!this.cropRect() &&
      (this.notOwned() || this.quantity() >= 1)
    );
  }

  async onSubmit() {
    if (!this.isValid) {
      this.setMessage('Compila tutti i campi obbligatori (collezione, quantità/flag, immagine).', true);
      return;
    }

    this.setMessage(null, false);
    this.saving.set(true);

    try {
      const card = await this.cardsService.add(this.selectedCollectionId(), this.quantity());

      const blob = await processImage(this.loadedImage()!, this.cropRect()!);
      await this.cardImagesService.upload(card.id, blob);

      this.setMessage('Carta aggiunta con successo.', false);
      this.resetForm();
    } catch (err) {
      this.setMessage('Errore durante il salvataggio.', true);
      console.error(err);
    } finally {
      this.saving.set(false);
    }
  }

  private resetForm() {
    this.quantity.set(1);
    this.notOwned.set(false);
    this.loadedImage.set(null);
    this.cropRect.set(null);
  }

  private setMessage(msg: string | null, error: boolean) {
    this.message.set(msg);
    this.isError.set(error);
  }
}