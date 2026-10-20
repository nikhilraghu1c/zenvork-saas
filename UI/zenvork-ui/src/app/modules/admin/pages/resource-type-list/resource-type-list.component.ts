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
import { ResourceTypeGridActionsComponent } from '../../components/resource-type-grid-actions/resource-type-grid-actions.component';
import { ResourceTypeStatusGridCellComponent } from '../../components/resource-type-status-grid-cell/resource-type-status-grid-cell.component';
import { AdminResourceType, ResourceTypeService } from '../../services/resource-type.service';

@Component({
  selector: 'app-resource-type-list',
  imports: [ReactiveFormsModule, MatIconModule, AppButtonComponent, AppDataGridComponent, AppInputComponent],
  templateUrl: './resource-type-list.component.html',
  styleUrl: './resource-type-list.component.scss',
})
export class ResourceTypeListComponent implements OnInit {
  private readonly resourceTypesApi = inject(ResourceTypeService);
  private readonly router = inject(Router);

  protected readonly searchControl = new FormControl('', { nonNullable: true });
  protected resourceTypes: AdminResourceType[] = [];
  protected filteredResourceTypes: AdminResourceType[] = [];
  protected loading = true;
  protected errorMessage = '';
  protected actionErrorMessage = '';
  protected readonly gridContext = {
    editResourceType: (resourceType: AdminResourceType) => this.editResourceType(resourceType),
    updateResourceTypeStatus: (resourceType: AdminResourceType, isActive: boolean) =>
      this.updateResourceTypeStatus(resourceType, isActive),
  };
  protected readonly columnDefs: ColDef<AdminResourceType>[] = [
    { field: 'name', headerName: 'Resource type', minWidth: 180, flex: 1.1 },
    { field: 'code', headerName: 'Code', minWidth: 140, flex: 0.8 },
    { field: 'businessTypeName', headerName: 'Business type', minWidth: 150, flex: 1 },
    {
      colId: 'resourceKind',
      headerName: 'Resource kind',
      minWidth: 130,
      cellDataType: 'text',
      valueGetter: ({ data }) => (data?.isPerson ? 'Person' : 'Asset'),
    },
    {
      field: 'isActive',
      headerName: 'Status',
      minWidth: 110,
      maxWidth: 120,
      cellRenderer: ResourceTypeStatusGridCellComponent,
    },
    {
      headerName: 'Actions',
      cellRenderer: ResourceTypeGridActionsComponent,
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

  /** Loads the complete platform catalog, including retired configurations for lifecycle management. */
  ngOnInit(): void {
    this.loadResourceTypes();
  }

  protected addResourceType(): void {
    void this.router.navigateByUrl('/admin/resource-types/new');
  }

  private loadResourceTypes(): void {
    this.resourceTypesApi.getAll().subscribe({
      next: ({ resourceTypes }) => {
        this.resourceTypes = resourceTypes;
        this.applySearch();
        this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage = error.error?.message ?? 'Unable to load resource types right now.';
        this.loading = false;
      },
    });
  }

  /** Narrows the local catalog without exposing platform data to a tenant endpoint. */
  private applySearch(): void {
    const search = this.searchControl.value.trim().toLowerCase();
    this.filteredResourceTypes = search
      ? this.resourceTypes.filter((resourceType) =>
          [resourceType.name, resourceType.code, resourceType.businessTypeName]
            .join(' ')
            .toLowerCase()
            .includes(search),
        )
      : this.resourceTypes;
  }

  private editResourceType(resourceType: AdminResourceType): void {
    void this.router.navigate([
      '/admin/resource-types',
      resourceType.businessTypeId,
      resourceType.code,
      'edit',
    ]);
  }

  /** Retires a configuration without deleting tenant resources that already use its code. */
  private updateResourceTypeStatus(resourceType: AdminResourceType, isActive: boolean): void {
    this.actionErrorMessage = '';
    this.resourceTypesApi.updateStatus(resourceType, isActive).subscribe({
      next: ({ resourceType: updatedResourceType }) => {
        this.resourceTypes = this.resourceTypes.map((item) =>
          item.businessTypeId === updatedResourceType.businessTypeId && item.code === updatedResourceType.code
            ? updatedResourceType
            : item,
        );
        this.applySearch();
      },
      error: (error: HttpErrorResponse) => {
        this.actionErrorMessage = error.error?.message ?? 'Unable to update resource type status.';
      },
    });
  }
}
