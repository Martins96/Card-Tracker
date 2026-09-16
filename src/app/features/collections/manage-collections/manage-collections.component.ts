import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CollectionsService } from '../../../core/service/collections.service';
import { CardCollection } from '../../../core/model/card-collection.model';
import { sortByName, typeLabel } from '../../../shared/utils/collection.utils';
import { CollectionCreateFormComponent, CreateCollectionEvent } from './collection-create-form/collection-create-form.component';
import { CollectionListItemComponent, RenameEvent, TypeChangeEvent } from './collection-list-item/collection-list-item.component';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';

/**
 * Pagina di gestione collezioni.
 *
 * Fa da "contenitore": tiene lo stato (lista collezioni, loading, messaggi
 * di errore) e resta l'unico punto che parla con CollectionsService.
 * I due sotto-componenti (form di creazione e riga della lista) sono
 * "dumb": ricevono dati via @Input ed emettono eventi via @Output,
 * senza conoscere il service.
 */
@Component({
  selector: 'app-manage-collections',
  standalone: true,
  imports: [
    RouterLink,
    CollectionCreateFormComponent,
    CollectionListItemComponent,
    ConfirmDialogComponent,
  ],
  templateUrl: './manage-collections.component.html',
  styleUrl: './manage-collections.component.scss',
})
export class ManageCollectionsComponent {
  private collectionsService = inject(CollectionsService);

  collections = signal<CardCollection[]>([]);
  loading = signal(true);
  message = signal<string | null>(null);

  readonly typeLabel = typeLabel;

  constructor() {
    this.loadCollections();
  }

  private async loadCollections() {
    this.loading.set(true);
    try {
      this.collections.set(sortByName(await this.collectionsService.getAll()));
    } catch (err) {
      this.message.set('Errore nel caricamento delle collezioni.');
      console.error(err);
    } finally {
      this.loading.set(false);
    }
  }

  async onCreate(event: CreateCollectionEvent, form: CollectionCreateFormComponent) {
    this.message.set(null);
    try {
      const created = await this.collectionsService.create(event.name, event.type);
      this.collections.update(list => sortByName([...list, created]));
      form.reset();
    } catch (err) {
      this.message.set('Errore durante la creazione. Nome già esistente?');
      console.error(err);
    }
  }

  async onRename(event: RenameEvent) {
    this.message.set(null);
    try {
      const updated = await this.collectionsService.rename(event.collection.id, event.newName);
      this.collections.update(list =>
        sortByName(list.map(c => (c.id === updated.id ? updated : c)))
      );
    } catch (err) {
      this.message.set('Errore durante la rinomina. Nome già esistente?');
      console.error(err);
    }
  }

  /** Il cambio tipo chiede sempre conferma prima di essere inviato al service */
  async onTypeChange(event: TypeChangeEvent, confirmDialog: ConfirmDialogComponent) {
    const { collection, newType } = event;

    const confirmed = await confirmDialog.ask(
      'Cambia tipo',
      `Cambiare il tipo di "${collection.name}" da ${this.typeLabel(collection.type)} a ${this.typeLabel(newType)}?`
    );
    if (!confirmed) return; // la select torna al valore reale da sola (binding [ngModel])

    this.message.set(null);
    try {
      const updated = await this.collectionsService.changeType(collection.id, newType);
      this.collections.update(list => list.map(c => (c.id === updated.id ? updated : c)));
    } catch (err) {
      this.message.set('Errore durante il cambio tipo.');
      console.error(err);
    }
  }

  async onDeleteRequest(collection: CardCollection, confirmDialog: ConfirmDialogComponent) {
    const confirmed = await confirmDialog.ask(
      'Elimina collezione',
      `Eliminare "${collection.name}"? Verranno eliminate anche tutte le carte associate.`
    );
    if (!confirmed) return;

    this.message.set(null);
    try {
      await this.collectionsService.delete(collection.id);
      this.collections.update(list => list.filter(c => c.id !== collection.id));
    } catch (err) {
      this.message.set("Errore durante l'eliminazione.");
      console.error(err);
    }
  }
}