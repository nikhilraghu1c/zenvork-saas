import { InitialsPipe } from '../../../../core/pipes/initials.pipe';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AppButtonComponent } from '../../../../shared/button/button.component';
import { AppCheckboxComponent } from '../../../../shared/checkbox/checkbox.component';
import { AppSelectComponent, AppSelectOption } from '../../../../shared/select/select.component';
import { AppToggleComponent } from '../../../../shared/toggle/toggle.component';
import { BusinessDatePipe } from '../../../../core/pipes/business-date.pipe';
import { BookingAccessScope, StaffService, StaffUser } from '../../services/staff.service';

@Component({
  selector: 'app-staff-details',
  imports: [
    InitialsPipe,
    BusinessDatePipe,
    ReactiveFormsModule,
    MatIconModule,
    AppButtonComponent,
    AppCheckboxComponent,
    AppSelectComponent,
    AppToggleComponent,
    RouterLink,
  ],
  templateUrl: './staff-details.component.html',
  styleUrl: './staff-details.component.scss',
})
export class StaffDetailsComponent implements OnInit {
  protected staffMember: StaffUser | null = null;
  protected loading = true;
  protected errorMessage = '';
  protected actionErrorMessage = '';
  protected updatingStatus = false;
  protected editingPermissions = false;
  protected updatingPermissions = false;
  protected permissionsErrorMessage = '';
  protected readonly bookingAccessOptions: AppSelectOption[] = [
    { value: 'NONE', label: 'No booking access' },
    { value: 'OWN_AND_UNASSIGNED', label: 'Own and unassigned bookings' },
    { value: 'ALL', label: 'All bookings' },
  ];
  protected readonly permissionsForm;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly staffService: StaffService,
    formBuilder: FormBuilder,
  ) {
    this.permissionsForm = formBuilder.nonNullable.group({
      bookingAccessScope: ['NONE' as BookingAccessScope],
      canSendReminders: [false],
    });
  }

  /** Loads the requested staff member from the current owner-visible staff list. */
  ngOnInit(): void {
    const staffId = this.route.snapshot.paramMap.get('id');
    if (!staffId) {
      this.errorMessage = 'Staff member not found.';
      this.loading = false;
      return;
    }

    this.staffService.getStaff().subscribe({
      next: ({ users }) => {
        this.staffMember = users.find((user) => user._id === staffId) ?? null;
        if (!this.staffMember) this.errorMessage = 'Staff member not found.';
        this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage = error.error?.message ?? 'Unable to load staff details.';
        this.loading = false;
      },
    });
  }

  /** Returns to the staff list. */
  protected returnToList(): void {
    this.router.navigateByUrl('/app/staff');
  }

  /** Toggles sign-in access without changing the staff member's existing history. */
  protected toggleStaffStatus(): void {
    if (!this.staffMember || this.updatingStatus) return;

    this.actionErrorMessage = '';
    this.updatingStatus = true;
    this.staffService.updateStaffStatus(this.staffMember._id, !this.staffMember.isActive).subscribe({
      next: ({ user }) => {
        this.staffMember = user;
        this.updatingStatus = false;
      },
      error: (error: HttpErrorResponse) => {
        this.actionErrorMessage = error.error?.message ?? 'Unable to update staff status.';
        this.updatingStatus = false;
      },
    });
  }

  /** Pre-fills the owner-only editor with the selected staff member's current permissions. */
  protected startPermissionEdit(): void {
    if (!this.staffMember) return;
    this.permissionsErrorMessage = '';
    this.permissionsForm.setValue({
      bookingAccessScope: this.staffMember.bookingAccessScope,
      canSendReminders: this.staffMember.canSendReminders,
    });
    this.editingPermissions = true;
  }

  /** Closes the inline editor without persisting permission changes. */
  protected cancelPermissionEdit(): void {
    if (this.updatingPermissions) return;
    this.permissionsErrorMessage = '';
    this.editingPermissions = false;
  }

  /** Persists only the operational permissions allowed by the generic staff update API. */
  protected savePermissions(): void {
    if (!this.staffMember || this.updatingPermissions) return;

    this.permissionsErrorMessage = '';
    this.updatingPermissions = true;
    const permissions = this.permissionsForm.getRawValue();
    this.staffService.updateStaff(this.staffMember._id, permissions).subscribe({
      next: ({ user }) => {
        this.staffMember = user;
        this.editingPermissions = false;
        this.updatingPermissions = false;
      },
      error: (error: HttpErrorResponse) => {
        this.permissionsErrorMessage = error.error?.message ?? 'Unable to update staff permissions.';
        this.updatingPermissions = false;
      },
    });
  }

  /** Shows only the permissions that owners can currently configure for staff. */
  protected permissionsFor(staffMember: StaffUser) {
    const bookingLabels = {
      NONE: 'No booking changes allowed',
      OWN_AND_UNASSIGNED: 'Own and unassigned bookings',
      ALL: 'All tenant bookings',
    } as const;
    return [
      {
        name: 'Booking access',
        description: bookingLabels[staffMember.bookingAccessScope],
        enabled: staffMember.bookingAccessScope !== 'NONE',
      },
      {
        name: 'Reminder access',
        description: staffMember.canSendReminders
          ? 'Can open the reminder workspace and send or skip reminders'
          : 'Cannot access the reminder workspace',
        enabled: staffMember.canSendReminders,
      },
    ];
  }
}
