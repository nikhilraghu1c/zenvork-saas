import { Component, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-button',
  imports: [MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss',
})
export class AppButtonComponent {
  /** Native button behavior when this wrapper is used inside a form. */
  @Input() type: 'button' | 'submit' = 'button';
  /** Visual role provided by the shared button wrapper. */
  @Input() variant: 'primary' | 'tertiary' = 'primary';
  /** Prevents user interaction. */
  @Input() disabled = false;
  /** Replaces button content with a progress indicator while work is in progress. */
  @Input() loading = false;
  /** Makes the button occupy its container's full width. */
  @Input() fullWidth = false;
}
