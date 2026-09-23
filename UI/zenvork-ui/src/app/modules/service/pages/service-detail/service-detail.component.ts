import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { finalize } from 'rxjs';
import { AppButtonComponent } from '../../../../shared/button/button.component';
import { BusinessDatePipe } from '../../../../core/pipes/business-date.pipe';
import { AuthService } from '../../../auth/services/auth.service';
import { ServiceRecord, ServiceService } from '../../services/service.service';

@Component({
  selector: 'app-service-detail',
  imports: [BusinessDatePipe, RouterLink, MatIconModule, AppButtonComponent],
  templateUrl: './service-detail.component.html',
  styleUrl: './service-detail.component.scss',
})
export class ServiceDetailComponent implements OnInit {
  private readonly serviceApi = inject(ServiceService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly isOwner = inject(AuthService).getCurrentUser()?.role === 'OWNER';
  protected service: ServiceRecord | null = null;
  protected loading = true;
  protected errorMessage = '';
  protected updating = false;
  /** Placeholder booking activity until service usage is exposed by the API. */
  protected readonly recentBookings = [
    { initials: 'AR', client: 'Aarav Rao', when: 'Today, 10:30 AM', status: 'Completed' },
    { initials: 'PS', client: 'Priya Shah', when: 'Yesterday, 4:00 PM', status: 'Completed' },
    { initials: 'KM', client: 'Kabir Mehta', when: '12 Sep, 11:15 AM', status: 'Completed' },
  ];
  ngOnInit(): void {
    this.loadService();
  }
  protected loadService(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.loading = true;
    this.serviceApi
      .getService(id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => (this.loading = false)),
      )
      .subscribe({
        next: ({ service }) => (this.service = service),
        error: (error) => (this.errorMessage = error.error?.message ?? 'Unable to load service.'),
      });
  }
  protected toggle(): void {
    if (!this.service || this.updating) return;
    this.updating = true;
    this.serviceApi
      .updateService(this.service._id, { isActive: !this.service.isActive })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => (this.updating = false)),
      )
      .subscribe({
        next: ({ service }) => (this.service = service),
        error: (error) => (this.errorMessage = error.error?.message ?? 'Unable to update service.'),
      });
  }
  protected price(): string {
    return this.service
      ? new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
          maximumFractionDigits: 0,
        }).format(this.service.pricePaise / 100)
      : '';
  }
  protected description(): string {
    return this.service?.description || 'No description added for this service.';
  }
  protected edit(): void {
    if (this.service) void this.router.navigate(['/app/services', this.service._id, 'edit']);
  }
}
