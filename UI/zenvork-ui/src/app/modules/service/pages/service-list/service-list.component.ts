import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { finalize } from 'rxjs';
import { AppButtonComponent } from '../../../../shared/button/button.component';
import { AppInputComponent } from '../../../../shared/input/input.component';
import { AuthService } from '../../../auth/services/auth.service';
import { ServiceRecord, ServiceService } from '../../services/service.service';

type StatusFilter = 'all' | 'active' | 'inactive';

@Component({
  selector: 'app-service-list',
  imports: [ReactiveFormsModule, RouterLink, MatIconModule, AppButtonComponent, AppInputComponent],
  templateUrl: './service-list.component.html',
  styleUrl: './service-list.component.scss',
})
export class ServiceListComponent implements OnInit {
  private readonly service = inject(ServiceService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  protected readonly isOwner = inject(AuthService).getCurrentUser()?.role === 'OWNER';
  protected readonly searchControl = new FormControl('', { nonNullable: true });
  protected services: ServiceRecord[] = [];
  protected filteredServices: ServiceRecord[] = [];
  protected statusFilter: StatusFilter = 'active';
  protected loading = true;
  protected errorMessage = '';
  protected updatingId = '';

  ngOnInit(): void {
    this.searchControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.filter());
    this.loadServices();
  }
  protected loadServices(): void {
    this.loading = true;
    this.errorMessage = '';
    this.service
      .getServices()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => (this.loading = false)),
      )
      .subscribe({
        next: ({ services }) => {
          this.services = services;
          this.filter();
        },
        error: (error) => (this.errorMessage = error.error?.message ?? 'Unable to load services.'),
      });
  }
  protected setStatusFilter(filter: StatusFilter): void {
    this.statusFilter = filter;
    this.filter();
  }
  protected toggleService(service: ServiceRecord): void {
    if (!this.isOwner || this.updatingId) return;
    this.updatingId = service._id;
    this.service
      .updateService(service._id, { isActive: !service.isActive })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => (this.updatingId = '')),
      )
      .subscribe({
        next: ({ service: updated }) => {
          this.services = this.services.map((item) => (item._id === updated._id ? updated : item));
          this.filter();
        },
        error: (error) =>
          (this.errorMessage = error.error?.message ?? 'Unable to update service status.'),
      });
  }
  protected editService(service: ServiceRecord): void {
    void this.router.navigate(['/app/services', service._id, 'edit']);
  }
  protected price(service: ServiceRecord): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(service.pricePaise / 100);
  }
  private filter(): void {
    const query = this.searchControl.value.trim().toLowerCase();
    this.filteredServices = this.services.filter(
      (service) =>
        (this.statusFilter === 'all' || (this.statusFilter === 'active') === service.isActive) &&
        service.name.toLowerCase().includes(query),
    );
  }
}
