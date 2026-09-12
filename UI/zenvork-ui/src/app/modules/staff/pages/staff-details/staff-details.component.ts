import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AppButtonComponent } from '../../../../shared/button/button.component';
import { StaffService, StaffUser } from '../../services/staff.service';

@Component({
  selector: 'app-staff-details',
  imports: [DatePipe, MatIconModule, MatSlideToggleModule, AppButtonComponent, RouterLink],
  templateUrl: './staff-details.component.html',
  styleUrl: './staff-details.component.scss',
})
export class StaffDetailsComponent implements OnInit {
  protected staffMember: StaffUser | null = null;
  protected loading = true;
  protected errorMessage = '';
  protected readonly permissions = [
    { name: 'Manage bookings', description: 'Create, edit, and cancel appointments' },
    { name: 'Manage clients', description: 'Add and edit client records' },
    { name: 'View analytics', description: 'See revenue and business reports' },
    { name: 'Manage staff', description: 'Add or remove other staff accounts' },
  ];

  protected get initials(): string {
    const parts = this.staffMember?.name.trim().split(/\s+/).filter(Boolean) ?? [];
    return [parts[0]?.[0], parts.length > 1 ? parts[parts.length - 1][0] : '']
      .join('').toUpperCase();
  }


  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly staffService: StaffService,
  ) {}

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
}
