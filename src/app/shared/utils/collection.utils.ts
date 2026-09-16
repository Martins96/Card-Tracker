import { CardCollection, CollectionType } from '../../core/model/card-collection.model';

/**
 * Ordina un array di collezioni per nome (ordine alfabetico, locale-aware).
 * Non modifica l'array originale.
 */
export function sortByName(collections: CardCollection[]): CardCollection[] {
  return [...collections].sort((a, b) => a.name.localeCompare(b.name));
}

/** Etichetta leggibile per il tipo di collezione, usata in tutti i template correlati */
export function typeLabel(type: CollectionType): string {
  return type === CollectionType.CARTE ? 'Carte' : 'Chibi';
}