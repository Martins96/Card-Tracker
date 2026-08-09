import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/home/home.component').then(m => m.HomeComponent),
  },
  {
    path: 'collections',
    loadComponent: () =>
      import('./features/collections/collections-list/collections-list.component')
        .then(m => m.CollectionsListComponent),
  },
  {
    path: 'add-card',
    loadComponent: () =>
      import('./features/card-add/card-add.component')
        .then(m => m.CardAddComponent),
  },
  {
    path: 'manage-collections',
    loadComponent: () =>
      import('./features/collections/manage-collections/manage-collections.component')
        .then(m => m.ManageCollectionsComponent),
  },
  { path: '**', redirectTo: '' },
];