import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { ColDef } from 'ag-grid-community';
import { AppButtonComponent } from '../../../../shared/button/button.component';
import { AppDataGridComponent } from '../../../../shared/data-grid/data-grid.component';
import { AppInputComponent } from '../../../../shared/input/input.component';
import { StaffGridActionsComponent } from '../../components/staff-grid-actions/staff-grid-actions.component';
import { StaffService, StaffUser } from '../../services/staff.service';

@Component({
  selector: 'app-staff-list',
  imports: [
    ReactiveFormsModule,
    MatIconModule,
    AppButtonComponent,
    AppDataGridComponent,
    AppInputComponent,
  ],
  templateUrl: './staff-list.component.html',
  styleUrl: './staff-list.component.scss',
})
export class StaffListComponent implements OnInit {
  /** Search value used to narrow the visible staff list. */
  protected readonly searchControl = new FormControl('', { nonNullable: true });
  protected staff: StaffUser[] = [];
  protected filteredStaff: StaffUser[] = [];
  protected loading = true;
  protected errorMessage = '';
  protected readonly columnDefs: ColDef<StaffUser>[] = [
    { field: 'name', headerName: 'Staff Member', minWidth: 190, flex: 1.3 },
    {
      field: 'email',
      headerName: 'Email',
      minWidth: 210,
      valueFormatter: ({ value }) => value || 'Not Provided',
    },
    { field: 'mobile', headerName: 'Mobile', minWidth: 140 },
    { headerName: 'Access', valueGetter: () => 'Staff', minWidth: 110, maxWidth: 130 },
    {
      field: 'createdAt',
      headerName: 'Added',
      minWidth: 130,
      valueFormatter: ({ value }) => new Date(value).toLocaleDateString(),
    },
    {
      headerName: 'Actions',
      cellRenderer: StaffGridActionsComponent,
      sortable: false,
      resizable: false,
      pinned: 'right',
      lockPinned: true,
      suppressMovable: true,
      maxWidth: 96,
      minWidth: 96,
    },
  ];

  constructor(
    private readonly staffService: StaffService,
    private readonly router: Router,
    destroyRef: DestroyRef,
  ) {
    this.searchControl.valueChanges.pipe(takeUntilDestroyed(destroyRef)).subscribe(() => {
      this.applySearch();
    });
  }

  /** Loads the owner-visible staff list when the page opens. */
  ngOnInit(): void {
    this.staffService.getStaff().subscribe({
      next: ({ users }) => {
        this.staff = users;
        this.applySearch();
        this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage = error.error?.message ?? 'Unable to load staff right now.';
        this.loading = false;
      },
    });
  }

  /** Filters staff members by their name, email, or mobile number. */
  private applySearch(): void {
    const search = this.searchControl.value.trim().toLowerCase();
    if (!search) {
      this.filteredStaff = this.staff;
      return;
    }

    this.filteredStaff = this.staff.filter((staffMember) =>
      [staffMember.name, staffMember.email ?? '', staffMember.mobile]
        .join(' ')
        .toLowerCase()
        .includes(search),
    );
  }

  /** Opens the dedicated staff-creation page. */
  protected addStaff(): void {
    this.router.navigateByUrl('/app/staff/new');
  }
}
