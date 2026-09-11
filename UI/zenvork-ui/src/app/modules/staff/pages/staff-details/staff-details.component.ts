import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { AppButtonComponent } from '../../../../shared/button/button.component';
import { StaffService, StaffUser } from '../../services/staff.service';

@Component({
  selector: 'app-staff-details',
  imports: [DatePipe, MatIconModule, AppButtonComponent],
  templateUrl: './staff-details.component.html',
  styleUrl: './staff-details.component.scss',
})
export class StaffDetailsComponent implements OnInit {
  protected staffMember: StaffUser | null = null;
  protected loading = true;
  protected errorMessage = '';

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
