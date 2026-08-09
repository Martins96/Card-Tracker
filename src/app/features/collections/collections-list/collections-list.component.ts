import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CollectionsService } from '../../../core/service/collections.service';
import { CardCollection } from '../../../core/model/card-collection.model';

@Component({
  selector: 'app-collections-list',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './collections-list.component.html',
  styleUrl: './collections-list.component.scss',
})
export class CollectionsListComponent {
  private collectionsService = inject(CollectionsService);

  collections = signal<CardCollection[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  constructor() {
    this.loadCollections();
  }

  private async loadCollections() {
    this.loading.set(true);
    this.error.set(null);
    try {
      const data = await this.collectionsService.getAll();
      this.collections.set(data);
    } catch (err) {
      this.error.set('Impossibile caricare le collezioni.');
      console.error(err);
    } finally {
      this.loading.set(false);
    }
  }
}