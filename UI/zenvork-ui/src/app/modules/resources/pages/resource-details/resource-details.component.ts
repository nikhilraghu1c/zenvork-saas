import { InitialsPipe } from '../../../../core/pipes/initials.pipe';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AppButtonComponent } from '../../../../shared/button/button.component';
import { BusinessDatePipe } from '../../../../core/pipes/business-date.pipe';
import { AuthService } from '../../../auth/services/auth.service';
import { ResourceRecord, ResourceService } from '../../services/resource.service';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';
import { LanguageService } from '../../../../core/services/language.service';

@Component({
  selector: 'app-resource-details',
  imports: [
    InitialsPipe,
    BusinessDatePipe,
    RouterLink,
    MatIconModule,
    AppButtonComponent,
    TranslatePipe,
  ],
  templateUrl: './resource-details.component.html',
  styleUrl: './resource-details.component.scss',
})
export class ResourceDetailsComponent implements OnInit {
  private readonly service = inject(ResourceService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly language = inject(LanguageService);
  protected readonly isOwner = inject(AuthService).getCurrentUser()?.role === 'OWNER';
  protected resource: ResourceRecord | null = null;
  protected loading = true;
  protected errorMessage = '';
  protected actionErrorMessage = '';
  protected updatingStatus = false;

  /** Loads the requested resource from the authenticated business resource list. */
  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.service
      .getResources()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ resources }) => {
          this.resource = resources.find((resource) => resource._id === id) ?? null;
          if (!this.resource) {
            this.errorMessage = this.language.translate('resources.notFound');
          }
          this.loading = false;
        },
        error: (error) => {
          this.errorMessage =
            error.error?.message ?? this.language.translate('resources.loadDetailsFailed');
          this.loading = false;
        },
      });
  }

  /** Changes availability while preserving existing bookings and resource history. */
  protected toggleResourceStatus(): void {
    if (!this.resource || this.updatingStatus) {
      return;
    }

    this.actionErrorMessage = '';
    this.updatingStatus = true;
    this.service.updateResourceStatus(this.resource._id, !this.resource.isActive).subscribe({
      next: ({ resource }) => {
        this.resource = { ...this.resource!, ...resource };
        this.updatingStatus = false;
      },
      error: (error: HttpErrorResponse) => {
        this.actionErrorMessage =
          error.error?.message ?? this.language.translate('resources.updateStatusFailed');
        this.updatingStatus = false;
      },
    });
  }
}
