import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { ColDef } from 'ag-grid-community';
import { BusinessDateTimeService } from '../../../../core/services/business-date-time.service';
import { AppButtonComponent } from '../../../../shared/button/button.component';
import { AppDataGridComponent } from '../../../../shared/data-grid/data-grid.component';
import { NameAvatarGridCellComponent } from '../../../../shared/data-grid/components/name-avatar-grid-cell/name-avatar-grid-cell.component';
import { AppInputComponent } from '../../../../shared/input/input.component';
import { BusinessGridActionsComponent } from '../../components/business-grid-actions/business-grid-actions.component';
import { BusinessStatusGridCellComponent } from '../../components/business-status-grid-cell/business-status-grid-cell.component';
import { AdminBusiness, AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-business-list',
  imports: [
    ReactiveFormsModule,
    MatIconModule,
    AppButtonComponent,
    AppDataGridComponent,
    AppInputComponent,
  ],
  templateUrl: './business-list.component.html',
  styleUrl: './business-list.component.scss',
})
export class BusinessListComponent implements OnInit {
  private readonly dateTime = inject(BusinessDateTimeService);
  private readonly admin = inject(AdminService);
  private readonly router = inject(Router);

  /** Search value used to narrow the platform business directory. */
  protected readonly searchControl = new FormControl('', { nonNullable: true });
  protected businesses: AdminBusiness[] = [];
  protected filteredBusinesses: AdminBusiness[] = [];
  protected loading = true;
  protected errorMessage = '';
  protected actionErrorMessage = '';
  protected readonly gridContext = {
    updateBusinessStatus: (businessId: string, status: AdminBusiness['status']) =>
      this.updateBusinessStatus(businessId, status),
  };
  protected readonly columnDefs: ColDef<AdminBusiness>[] = [
    {
      field: 'name',
      headerName: 'Business',
      minWidth: 200,
      flex: 1.25,
      cellRenderer: NameAvatarGridCellComponent,
    },
    {
      headerName: 'Type',
      minWidth: 130,
      valueGetter: ({ data }) => data?.businessTypeId?.name ?? 'Not provided',
    },
    {
      headerName: 'Owner',
      minWidth: 160,
      flex: 1,
      valueGetter: ({ data }) => data?.ownerId?.name ?? 'Not provided',
    },
    {
      headerName: 'Contact',
      minWidth: 210,
      flex: 1.15,
      valueGetter: ({ data }) => data?.ownerId?.email || data?.ownerId?.mobile || 'Not provided',
    },
    {
      field: 'planExpiresAt',
      headerName: 'Plan expiry',
      minWidth: 130,
      valueFormatter: ({ value }) => (value ? this.dateTime.format(value, 'date') : 'No expiry'),
    },
    {
      field: 'status',
      headerName: 'Status',
      minWidth: 120,
      maxWidth: 130,
      cellRenderer: BusinessStatusGridCellComponent,
    },
    {
      headerName: 'Actions',
      cellRenderer: BusinessGridActionsComponent,
      sortable: false,
      resizable: false,
      pinned: 'right',
      lockPinned: true,
      suppressMovable: true,
      maxWidth: 96,
      minWidth: 96,
    },
  ];

  constructor(destroyRef: DestroyRef) {
    this.searchControl.valueChanges.pipe(takeUntilDestroyed(destroyRef)).subscribe(() => {
      this.applySearch();
    });
  }

  /** Loads every platform-managed business when the page opens. */
  ngOnInit(): void {
    this.admin.getBusinesses().subscribe({
      next: ({ businesses }) => {
        this.businesses = businesses;
        this.applySearch();
        this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage = error.error?.message ?? 'Unable to load businesses right now.';
        this.loading = false;
      },
    });
  }

  /** Opens the dedicated platform-admin business registration page. */
  protected registerBusiness(): void {
    void this.router.navigateByUrl('/admin/businesses/new');
  }

  /** Filters locally by business identity, type, or owner contact details. */
  private applySearch(): void {
    const search = this.searchControl.value.trim().toLowerCase();
    if (!search) {
      this.filteredBusinesses = this.businesses;
      return;
    }

    this.filteredBusinesses = this.businesses.filter((business) =>
      [
        business.name,
        business.businessTypeId?.name ?? '',
        business.ownerId?.name ?? '',
        business.ownerId?.email ?? '',
        business.ownerId?.mobile ?? '',
      ]
        .join(' ')
        .toLowerCase()
        .includes(search),
    );
  }

  /** Changes platform availability without removing the business or its operational history. */
  private updateBusinessStatus(businessId: string, status: AdminBusiness['status']): void {
    this.actionErrorMessage = '';
    this.admin.updateStatus(businessId, status).subscribe({
      next: () => {
        this.businesses = this.businesses.map((business) =>
          business._id === businessId ? { ...business, status } : business,
        );
        this.applySearch();
      },
      error: (error: HttpErrorResponse) => {
        this.actionErrorMessage = error.error?.message ?? 'Unable to update business status.';
      },
    });
  }
}
