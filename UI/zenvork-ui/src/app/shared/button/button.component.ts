import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-button',
  imports: [MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss',
})
export class AppButtonComponent {
  /** Native button behavior when this wrapper is used inside a form. */
  @Input() type: 'button' | 'submit' = 'button';
  /** Visual role provided by the shared button wrapper. */
  @Input() variant: 'primary' | 'secondary' | 'tertiary' | 'text' = 'primary';
  /** Prevents user interaction. */
  @Input() disabled = false;
  /** Replaces button content with a progress indicator while work is in progress. */
  @Input() loading = false;
  /** Makes the button occupy its container's full width. */
  @Input() fullWidth = false;
  /** Provides an accessible name for icon-only shared buttons. */
  @Input() ariaLabel?: string;
  /** Uses compact square geometry for an icon-only action such as closing a dialog. */
  @Input() iconOnly = false;
  /** Optional Material icon rendered by the shared button before its label. */
  @Input() icon?: string;
  /** Optional text label for standard shared actions. */
  @Input() label?: string;
  /** Hides a supplied label below the mobile breakpoint while retaining its accessible name. */
  @Input() hideLabelOnMobile = false;
  /** Optional compact count badge, for actions such as an active filter summary. */
  @Input() badge?: number | string | null;
  /** Emits the native click event for page-level actions such as navigation. */
  @Output() clicked = new EventEmitter<MouseEvent>();
}
