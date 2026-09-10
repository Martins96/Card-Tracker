import { Component, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CollectionsService } from '../../../core/service/collections.service';
import { CardCollection, CollectionType } from '../../../core/model/card-collection.model';

type TypeFilter = 'ALL' | CollectionType;

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

  readonly CollectionType = CollectionType;

  typeFilter = signal<TypeFilter>('ALL');

  filteredCollections = computed(() => {
    const filter = this.typeFilter();
    const all = this.collections();
    return filter === 'ALL' ? all : all.filter(c => c.type === filter);
  });

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

  setTypeFilter(filter: TypeFilter) {
    this.typeFilter.set(filter);
  }


  /* Graphic functions */
  private readonly gradients = [
    ['#7c3aed', '#a855f7'],
    ['#2563eb', '#06b6d4'],
    ['#f59e0b', '#ef4444'],
    ['#10b981', '#06b6d4'],
    ['#ec4899', '#f43f5e'],
    ['#8b5cf6', '#3b82f6'],
  ];

  initials(name: string): string {
    const words = name.trim().split(/\s+/);
    if (words.length === 1) {
      return words[0].slice(0, 2).toUpperCase();
    }
    return (words[0][0] + words[1][0]).toUpperCase();
  }

  badgeGradient(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const [c1, c2] = this.gradients[Math.abs(hash) % this.gradients.length];
    return `linear-gradient(135deg, ${c1}, ${c2})`;
  }

  typeLabel(type: CollectionType): string {
    return type === CollectionType.CARTE ? 'Carte' : 'Chibi';
  }
}