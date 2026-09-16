import { Component, EventEmitter, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CollectionType } from '../../../../core/model/card-collection.model';
import { typeLabel } from '../../../../shared/utils/collection.utils';

/** Dati emessi alla creazione di una nuova collezione */
export interface CreateCollectionEvent {
  name: string;
  type: CollectionType;
}

/**
 * Form per la creazione di una nuova collezione.
 * Non conosce il service: si limita a emettere l'evento al componente padre,
 * che si occupa della chiamata effettiva e della gestione degli errori.
 */
@Component({
  selector: 'app-collection-create-form',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './collection-create-form.component.html',
  styleUrl: './collection-create-form.component.scss',
})
export class CollectionCreateFormComponent {
  @Output() create = new EventEmitter<CreateCollectionEvent>();

  readonly collectionTypes = Object.values(CollectionType);
  readonly typeLabel = typeLabel;

  name = signal('');
  type = signal<CollectionType>(CollectionType.CARTE);

  onSubmit() {
    const trimmedName = this.name().trim();
    if (!trimmedName) return;

    this.create.emit({ name: trimmedName, type: this.type() });
  }

  /** Chiamato dal padre dopo una creazione riuscita, per svuotare il form */
  reset() {
    this.name.set('');
    this.type.set(CollectionType.CARTE);
  }
}
