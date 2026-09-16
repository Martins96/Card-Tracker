import { Component, signal } from '@angular/core';

/**
 * Dialog di conferma generico, riutilizzabile in tutta l'app al posto
 * del confirm() nativo del browser (bloccante e poco personalizzabile).
 *
 * Uso tipico da un altro componente:
 *
 *   @ViewChild(ConfirmDialogComponent) confirmDialog!: ConfirmDialogComponent;
 *
 *   async eliminaQualcosa() {
 *     const ok = await this.confirmDialog.ask('Titolo', 'Sei sicuro?');
 *     if (!ok) return;
 *     // ...procedi
 *   }
 *
 * Nel template:
 *   <app-confirm-dialog></app-confirm-dialog>
 */
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.scss',
})
export class ConfirmDialogComponent {
  visible = signal(false);
  title = signal('');
  message = signal('');

  // Risolve la Promise restituita da ask() quando l'utente sceglie
  private resolver: ((confirmed: boolean) => void) | null = null;

  /** Mostra il dialog e restituisce true/false in base alla scelta dell'utente */
  ask(title: string, message: string): Promise<boolean> {
    this.title.set(title);
    this.message.set(message);
    this.visible.set(true);

    return new Promise<boolean>(resolve => {
      this.resolver = resolve;
    });
  }

  confirm() {
    this.close(true);
  }

  cancel() {
    this.close(false);
  }

  private close(confirmed: boolean) {
    this.visible.set(false);
    this.resolver?.(confirmed);
    this.resolver = null;
  }
}
