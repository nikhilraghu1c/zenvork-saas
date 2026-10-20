import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { ColDef } from 'ag-grid-community';
import { AppButtonComponent } from '../../../../shared/button/button.component';
import { AppDataGridComponent } from '../../../../shared/data-grid/data-grid.component';
import { AppInputComponent } from '../../../../shared/input/input.component';
import { BusinessTypeGridActionsComponent } from '../../components/business-type-grid-actions/business-type-grid-actions.component';
import { BusinessTypeStatusGridCellComponent } from '../../components/business-type-status-grid-cell/business-type-status-grid-cell.component';
import { AdminBusinessType, BusinessTypeService } from '../../services/business-type.service';

@Component({
  selector: 'app-business-type-list',
  imports: [ReactiveFormsModule, MatIconModule, AppButtonComponent, AppDataGridComponent, AppInputComponent],
  templateUrl: './business-type-list.component.html',
  styleUrl: './business-type-list.component.scss',
})
export class BusinessTypeListComponent implements OnInit {
  private readonly businessTypesApi = inject(BusinessTypeService);
  private readonly router = inject(Router);

  protected readonly searchControl = new FormControl('', { nonNullable: true });
  protected businessTypes: AdminBusinessType[] = [];
  protected filteredBusinessTypes: AdminBusinessType[] = [];
  protected loading = true;
  protected errorMessage = '';
  protected actionErrorMessage = '';
  protected readonly gridContext = {
    editBusinessType: (businessType: AdminBusinessType) => this.editBusinessType(businessType),
    updateBusinessTypeStatus: (businessType: AdminBusinessType, isActive: boolean) =>
      this.updateBusinessTypeStatus(businessType, isActive),
  };
  protected readonly columnDefs: ColDef<AdminBusinessType>[] = [
    { field: 'name', headerName: 'Business type', minWidth: 190, flex: 1.2 },
    { field: 'code', headerName: 'Code', minWidth: 140, flex: 0.85 },
    { field: 'iconName', headerName: 'Icon', minWidth: 130, flex: 0.75 },
    {
      colId: 'resourceTypeCount',
      headerName: 'Resource types',
      minWidth: 145,
      valueGetter: ({ data }) => data?.resourceTypes.length ?? 0,
      valueFormatter: ({ value }) => `${value} configured`,
    },
    {
      field: 'isActive',
      headerName: 'Status',
      minWidth: 112,
      maxWidth: 122,
      cellRenderer: BusinessTypeStatusGridCellComponent,
    },
    {
      headerName: 'Actions',
      cellRenderer: BusinessTypeGridActionsComponent,
      sortable: false,
      resizable: false,
      pinned: 'right',
      lockPinned: true,
      suppressMovable: true,
      minWidth: 92,
      maxWidth: 92,
    },
  ];

  constructor(destroyRef: DestroyRef) {
    this.searchControl.valueChanges.pipe(takeUntilDestroyed(destroyRef)).subscribe(() => {
      this.applySearch();
    });
  }

  ngOnInit(): void {
    this.loadBusinessTypes();
  }

  protected addBusinessType(): void {
    void this.router.navigateByUrl('/admin/business-types/new');
  }

  private loadBusinessTypes(): void {
    this.businessTypesApi.getAll().subscribe({
      next: ({ businessTypes }) => {
        this.businessTypes = businessTypes;
        this.applySearch();
        this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage = error.error?.message ?? 'Unable to load business types right now.';
        this.loading = false;
      },
    });
  }

  private applySearch(): void {
    const search = this.searchControl.value.trim().toLowerCase();
    this.filteredBusinessTypes = search
      ? this.businessTypes.filter((businessType) =>
          [businessType.name, businessType.code, businessType.iconName].join(' ').toLowerCase().includes(search),
        )
      : this.businessTypes;
  }

  private editBusinessType(businessType: AdminBusinessType): void {
    void this.router.navigate(['/admin/business-types', businessType.id, 'edit']);
  }

  /** Retires the catalogue entry without deleting businesses already created under the type. */
  private updateBusinessTypeStatus(businessType: AdminBusinessType, isActive: boolean): void {
    this.actionErrorMessage = '';
    this.businessTypesApi.updateStatus(businessType.id, isActive).subscribe({
      next: ({ businessType: updatedBusinessType }) => {
        this.businessTypes = this.businessTypes.map((item) =>
          item.id === updatedBusinessType.id ? updatedBusinessType : item,
        );
        this.applySearch();
      },
      error: (error: HttpErrorResponse) => {
        this.actionErrorMessage = error.error?.message ?? 'Unable to update business type status.';
      },
    });
  }
}
