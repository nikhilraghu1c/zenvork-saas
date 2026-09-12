import { DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ColDef } from 'ag-grid-community';
import { AppButtonComponent } from '../../../../shared/button/button.component';
import { AppInputComponent } from '../../../../shared/input/input.component';
import { AppDataGridComponent } from '../../../../shared/data-grid/data-grid.component';
import { AuthService } from '../../../auth/services/auth.service';
import { ResourceRecord, ResourceService } from '../../services/resource.service';
import { ResourceGridActionsComponent } from '../../components/resource-grid-actions/resource-grid-actions.component';

@Component({
  selector: 'app-resource-list',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    RouterLink,
    MatIconModule,
    AppButtonComponent,
    AppInputComponent,
    AppDataGridComponent,
  ],
  templateUrl: './resource-list.component.html',
  styleUrl: './resource-list.component.scss',
})
export class ResourceListComponent implements OnInit {
  private readonly service = inject(ResourceService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly isOwner = inject(AuthService).getCurrentUser()?.role === 'OWNER';
  /** Search value used to narrow the visible resources. */
  protected readonly searchControl = new FormControl('', { nonNullable: true });
  protected resources: ResourceRecord[] = [];
  protected filteredResources: ResourceRecord[] = [];
  protected loading = true;
  protected errorMessage = '';
  /** Defines the desktop resource grid columns and available row actions. */
  protected readonly columnDefs: ColDef<ResourceRecord>[] = [
    { field: 'name', headerName: 'Resource', minWidth: 190, flex: 1.3 },
    { field: 'resourceType', headerName: 'Type', minWidth: 150 },
    {
      field: 'isActive',
      headerName: 'Status',
      minWidth: 110,
      // Render status text instead of AG Grid's inferred boolean checkbox.
      cellDataType: false,
      valueFormatter: ({ value }) => (value ? 'Active' : 'Inactive'),
      cellStyle: ({ value }) => ({ color: value ? 'var(--green)' : 'var(--text-dim)' }),
    },
    {
      field: 'linkedUserId',
      headerName: 'Login account',
      minWidth: 150,
      valueFormatter: ({ value, data }) =>
        data?.isPerson ? (value ? 'Linked' : 'Not linked') : '--',
    },
    {
      field: 'createdAt',
      headerName: 'Added',
      minWidth: 130,
      valueFormatter: ({ value }) => new Date(value).toLocaleDateString(),
    },
    {
      headerName: 'Actions',
      cellRenderer: ResourceGridActionsComponent,
      sortable: false,
      resizable: false,
      pinned: 'right',
      lockPinned: true,
      minWidth: 96,
      maxWidth: 96,
    },
  ];
  /** Loads tenant-owned resources and listens for search changes. */
  ngOnInit(): void {
    this.searchControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.filter());
    this.service
      .getResources()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ resources }) => {
          this.resources = resources;
          this.filter();
          this.loading = false;
        },
        error: (error) => {
          this.errorMessage = error.error?.message ?? 'Unable to load resources.';
          this.loading = false;
        },
      });
  }
  /** Filters resources by name, type, or status. */
  private filter(): void {
    const query = this.searchControl.value.trim().toLowerCase();
    this.filteredResources = this.resources.filter((resource) =>
      [resource.name, resource.resourceType, resource.isActive ? 'active' : 'inactive'].some(
        (value) => value.toLowerCase().includes(query),
      ),
    );
  }
}
