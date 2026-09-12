import { InitialsPipe } from '../../../../core/pipes/initials.pipe';
import { DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AppButtonComponent } from '../../../../shared/button/button.component';
import { AuthService } from '../../../auth/services/auth.service';
import { ResourceRecord, ResourceService } from '../../services/resource.service';

@Component({
  selector: 'app-resource-details',
  imports: [InitialsPipe, DatePipe, RouterLink, MatIconModule, AppButtonComponent],
  templateUrl: './resource-details.component.html',
  styleUrl: './resource-details.component.scss',
})
export class ResourceDetailsComponent implements OnInit {
  private readonly service = inject(ResourceService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly isOwner = inject(AuthService).getCurrentUser()?.role === 'OWNER';
  protected resource: ResourceRecord | null = null;
  protected loading = true;
  protected errorMessage = '';

  /** Loads the requested resource from the authenticated business resource list. */
  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.service
      .getResources()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ resources }) => {
          this.resource = resources.find((resource) => resource._id === id) ?? null;
          if (!this.resource) this.errorMessage = 'Resource not found.';
          this.loading = false;
        },
        error: (error) => {
          this.errorMessage = error.error?.message ?? 'Unable to load resource details.';
          this.loading = false;
        },
      });
  }
}
