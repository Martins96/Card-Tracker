import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CardCollection, CollectionType } from '../../../../core/model/card-collection.model';
import { typeLabel } from '../../../../shared/utils/collection.utils';

/** Evento emesso quando l'utente conferma la rinomina */
export interface RenameEvent {
  collection: CardCollection;
  newName: string;
}

/** Evento emesso quando l'utente conferma il cambio tipo (dopo conferma già ottenuta) */
export interface TypeChangeEvent {
  collection: CardCollection;
  newType: CollectionType;
}

/**
 * Singola riga della lista collezioni.
 * Gestisce solo lo stato locale di UI (modalità modifica nome, valore in edit);
 * ogni operazione che tocca il backend viene delegata al componente padre
 * tramite Output, che resta l'unico responsabile della chiamata ai service.
 */
@Component({
  selector: 'app-collection-list-item',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './collection-list-item.component.html',
  styleUrl: './collection-list-item.component.scss',
})
export class CollectionListItemComponent {
  @Input({ required: true }) collection!: CardCollection;

  @Output() rename = new EventEmitter<RenameEvent>();
  @Output() typeChange = new EventEmitter<TypeChangeEvent>();
  @Output() deleteRequest = new EventEmitter<CardCollection>();

  readonly CollectionType = CollectionType;
  readonly collectionTypes = Object.values(CollectionType);
  readonly typeLabel = typeLabel;

  // Vero mentre questa riga è in modalità rinomina
  editing = signal(false);
  editingName = signal('');

  startEdit() {
    this.editing.set(true);
    this.editingName.set(this.collection.name);
  }

  cancelEdit() {
    this.editing.set(false);
    this.editingName.set('');
  }

  confirmEdit() {
    const name = this.editingName().trim();
    if (!name) return;

    this.rename.emit({ collection: this.collection, newName: name });
    this.editing.set(false);
  }

  /**
   * Cambio tipo dal select. La select è "controllata" col valore originale
   * ([ngModel]="collection.type") anziché con banana-in-a-box: se il padre
   * rifiuta il cambio (utente annulla la conferma, o errore), il valore
   * mostrato torna automaticamente a quello reale della collezione,
   * senza dover gestire un rollback manuale del select.
   */
  onTypeSelectChange(newType: CollectionType) {
    if (newType === this.collection.type) return;
    this.typeChange.emit({ collection: this.collection, newType });
  }

  onDeleteClick() {
    this.deleteRequest.emit(this.collection);
  }
}
