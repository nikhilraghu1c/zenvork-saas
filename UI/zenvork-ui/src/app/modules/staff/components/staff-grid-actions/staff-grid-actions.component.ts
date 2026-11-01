import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import {
  AppActionMenuComponent,
  AppActionMenuItem,
} from '../../../../shared/action-menu/action-menu.component';
import { StaffUser } from '../../services/staff.service';
import { LanguageService } from '../../../../core/services/language.service';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';

type StaffStatusUpdateHandler = (staffId: string, isActive: boolean) => void;

@Component({
  selector: 'app-staff-grid-actions',
  imports: [AppActionMenuComponent, TranslatePipe],
  templateUrl: './staff-grid-actions.component.html',
  styleUrl: './staff-grid-actions.component.scss',
})
export class StaffGridActionsComponent implements ICellRendererAngularComp {
  private readonly router = inject(Router);
  private readonly language = inject(LanguageService);
  private params!: ICellRendererParams<StaffUser>;
  protected staffMember!: StaffUser;
  protected actions: AppActionMenuItem[] = [];

  /** Receives the staff record rendered by the AG Grid action cell. */
  agInit(params: ICellRendererParams<StaffUser>): void {
    this.setStaffMember(params);
  }

  /** Refreshes the rendered staff record when AG Grid updates a row. */
  refresh(params: ICellRendererParams<StaffUser>): boolean {
    this.setStaffMember(params);
    return true;
  }

  /** Opens details or delegates the login-access lifecycle change to the staff list. */
  protected handleAction(actionId: string): void {
    if (actionId === 'details') {
      void this.router.navigate(['/app/staff', this.staffMember._id]);
      return;
    }

    if (actionId.startsWith('status:')) {
      const updateStaffStatus = this.params.context?.['updateStaffStatus'] as
        | StaffStatusUpdateHandler
        | undefined;
      updateStaffStatus?.(this.staffMember._id, actionId === 'status:activate');
    }
  }

  private setStaffMember(params: ICellRendererParams<StaffUser>): void {
    this.params = params;
    this.staffMember = params.data!;
    this.actions = [
      { id: 'details', label: this.language.translate('staff.actionDetails'), icon: 'visibility' },
      this.staffMember.isActive
        ? {
            id: 'status:deactivate',
            label: this.language.translate('staff.deactivate'),
            icon: 'person_off',
          }
        : {
            id: 'status:activate',
            label: this.language.translate('staff.activate'),
            icon: 'person_add',
          },
      // { id: 'edit', label: 'Edit', icon: 'edit' },
    ];
  }
}
