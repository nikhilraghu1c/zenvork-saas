import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
  selector: 'app-topbar',
  imports: [MatButtonModule, MatIconModule, MatToolbarModule],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.scss',
})
export class TopbarComponent {
  /** Current page title displayed in the minimal toolbar. */
  @Input() title = '';
  /** Controls whether the mobile drawer button is visible. */
  @Input() showMenuButton = false;
  /** Requests that the app layout opens or closes the mobile drawer. */
  @Output() menuToggle = new EventEmitter<void>();
}
