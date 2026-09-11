import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { AppActionMenuComponent, AppActionMenuItem } from '../../../../shared/action-menu/action-menu.component';
import { StaffUser } from '../../services/staff.service';

@Component({
  selector: 'app-staff-grid-actions',
  imports: [AppActionMenuComponent],
  templateUrl: './staff-grid-actions.component.html',
  styleUrl: './staff-grid-actions.component.scss',
})
export class StaffGridActionsComponent implements ICellRendererAngularComp {
  private readonly router = inject(Router);
  protected staffMember!: StaffUser;
  protected readonly actions: AppActionMenuItem[] = [
    { id: 'details', label: 'Details', icon: 'visibility' },
    { id: 'edit', label: 'Edit', icon: 'edit', disabled: true },
    { id: 'delete', label: 'Delete', icon: 'person_off', disabled: true },
  ];

  /** Receives the staff record rendered by the AG Grid action cell. */
  agInit(params: ICellRendererParams<StaffUser>): void {
    this.staffMember = params.data!;
  }

  /** Refreshes the rendered staff record when AG Grid updates a row. */
  refresh(params: ICellRendererParams<StaffUser>): boolean {
    this.staffMember = params.data!;
    return true;
  }

  /** Opens the currently available details view for this staff record. */
  protected handleAction(actionId: string): void {
    if (actionId === 'details') {
      void this.router.navigate(['/app/staff', this.staffMember._id]);
    }
  }
}
