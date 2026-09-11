import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-coming-soon',
  templateUrl: './coming-soon.component.html',
  styleUrl: './coming-soon.component.scss',
})
export class ComingSoonComponent {
  /** Displays the title provided by the selected app route. */
  protected readonly title: string;

  constructor(private readonly route: ActivatedRoute) {
    this.title = this.route.snapshot.data['title'] as string;
  }
}
