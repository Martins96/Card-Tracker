import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SingleCardFormComponent } from './single-card-form/single-card-form.component';
import { BulkCardFormComponent } from './bulk-card-form/bulk-card-form.component';

type Tab = 'single' | 'bulk';

@Component({
  selector: 'app-card-add',
  standalone: true,
  imports: [RouterLink, SingleCardFormComponent, BulkCardFormComponent],
  templateUrl: './card-add.component.html',
  styleUrl: './card-add.component.scss',
})
export class CardAddComponent {
  activeTab = signal<Tab>('single');

  setTab(tab: Tab) {
    this.activeTab.set(tab);
  }
}