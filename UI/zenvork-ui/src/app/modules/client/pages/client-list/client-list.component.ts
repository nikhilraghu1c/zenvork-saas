import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ColDef } from 'ag-grid-community';
import { AppDataGridComponent } from '../../../../shared/data-grid/data-grid.component';
import { AppInputComponent } from '../../../../shared/input/input.component';
import { BusinessDatePipe } from '../../../../core/pipes/business-date.pipe';
import { BusinessDateTimeService } from '../../../../core/services/business-date-time.service';
import { ClientRecord, ClientService } from '../../services/client.service';
import { NameAvatarGridCellComponent } from '../../../../shared/data-grid/components/name-avatar-grid-cell/name-avatar-grid-cell.component';

@Component({
  selector: 'app-client-list',
  imports: [
    BusinessDatePipe,
    ReactiveFormsModule,
    MatIconModule,
    AppDataGridComponent,
    AppInputComponent,
  ],
  templateUrl: './client-list.component.html',
  styleUrl: './client-list.component.scss',
})
export class ClientListComponent implements OnInit {
  private readonly service = inject(ClientService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dateTime = inject(BusinessDateTimeService);

  /** Search value used to narrow the already loaded tenant client list. */
  protected readonly searchControl = new FormControl('', { nonNullable: true });
  protected clients: ClientRecord[] = [];
  protected filteredClients: ClientRecord[] = [];
  protected loading = true;
  protected errorMessage = '';
  /** Defines the concise desktop client grid. */
  protected readonly columnDefs: ColDef<ClientRecord>[] = [
    {
      field: 'name',
      headerName: 'Client',
      minWidth: 200,
      flex: 1.2,
      cellRenderer: NameAvatarGridCellComponent,
    },
    { field: 'mobile', headerName: 'Mobile', minWidth: 150 },
    {
      field: 'email',
      headerName: 'Email',
      minWidth: 220,
      flex: 1,
      valueFormatter: ({ value }) => value || 'Not provided',
    },
    {
      field: 'notes',
      headerName: 'Notes',
      minWidth: 180,
      flex: 1,
      valueFormatter: ({ value }) => value || '—',
    },
    {
      field: 'createdAt',
      headerName: 'Added',
      minWidth: 130,
      valueFormatter: ({ value }) => this.dateTime.format(value, 'date'),
    },
  ];

  /** Loads tenant-owned clients once, then filters them locally as staff type. */
  ngOnInit(): void {
    this.searchControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.filter());

    this.service
      .getClients()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ clients }) => {
          this.clients = clients;
          this.filter();
          this.loading = false;
        },
        error: (error) => {
          this.errorMessage = error.error?.message ?? 'Unable to load clients.';
          this.loading = false;
        },
      });
  }

  /** Filters client records by the practical lookup fields used at reception. */
  private filter(): void {
    const query = this.searchControl.value.trim().toLowerCase();
    this.filteredClients = this.clients.filter((client) =>
      [client.name, client.mobile, client.email ?? ''].some((value) =>
        value.toLowerCase().includes(query),
      ),
    );
  }
}
