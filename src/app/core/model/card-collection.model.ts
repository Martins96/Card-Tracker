export enum CollectionType {
  CARTE = 'CARTE',
  CHIBI = 'CHIBI',
}

export interface CardCollection {
  id: string;
  name: string;
  type: CollectionType;
  cardCount?: number;
}

export interface Card {
  id: string;
  collection_id: string;
  quantity: number;
  imageUrl?: string;
}