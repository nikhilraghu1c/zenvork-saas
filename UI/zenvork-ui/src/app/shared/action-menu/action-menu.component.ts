import { Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';

export interface AppActionMenuItem {
  id: string;
  label: string;
  icon: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-action-menu',
  imports: [MatButtonModule, MatIconModule, MatMenuModule],
  templateUrl: './action-menu.component.html',
  styleUrl: './action-menu.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class AppActionMenuComponent {
  /** Accessible label for the icon-only menu trigger. */
  @Input({ required: true }) ariaLabel!: string;
  /** Reusable list of actions displayed in the menu. */
  @Input({ required: true }) items: AppActionMenuItem[] = [];
  /** Emits the identifier of the selected available action. */
  @Output() actionSelected = new EventEmitter<string>();
}
