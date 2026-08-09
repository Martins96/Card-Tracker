export interface CardCollection {
  id: string;
  name: string;
  cardCount?: number;
}

export interface Card {
  id: string;
  collection_id: string;
  quantity: number;
  imageUrl?: string;
}