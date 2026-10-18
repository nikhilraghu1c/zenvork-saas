import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import {
  AppActionMenuComponent,
  AppActionMenuItem,
} from '../../../../shared/action-menu/action-menu.component';
import { AdminBusiness } from '../../services/admin.service';

type BusinessStatusUpdateHandler = (businessId: string, status: AdminBusiness['status']) => void;
type OwnerPasswordResetHandler = (businessId: string) => void;

@Component({
  selector: 'app-business-grid-actions',
  imports: [AppActionMenuComponent],
  templateUrl: './business-grid-actions.component.html',
  styleUrl: './business-grid-actions.component.scss',
})
export class BusinessGridActionsComponent implements ICellRendererAngularComp {
  private params!: ICellRendererParams<AdminBusiness>;
  protected business!: AdminBusiness;
  protected actions: AppActionMenuItem[] = [];

  /** Receives the business record rendered by the grid action cell. */
  agInit(params: ICellRendererParams<AdminBusiness>): void {
    this.setBusiness(params);
  }

  /** Refreshes the lifecycle action after its row status changes. */
  refresh(params: ICellRendererParams<AdminBusiness>): boolean {
    this.setBusiness(params);
    return true;
  }

  /** Delegates status and password actions to the parent list, which owns API requests. */
  protected handleAction(actionId: string): void {
    if (actionId === 'reset-password') {
      const resetOwnerPassword = this.params.context?.['resetOwnerPassword'] as
        | OwnerPasswordResetHandler
        | undefined;
      resetOwnerPassword?.(this.business._id);
      return;
    }

    const updateBusinessStatus = this.params.context?.['updateBusinessStatus'] as
      | BusinessStatusUpdateHandler
      | undefined;
    updateBusinessStatus?.(this.business._id, actionId === 'activate' ? 'ACTIVE' : 'SUSPENDED');
  }

  private setBusiness(params: ICellRendererParams<AdminBusiness>): void {
    this.params = params;
    this.business = params.data!;
    this.actions = [
      this.business.status === 'ACTIVE'
        ? { id: 'suspend', label: 'Suspend', icon: 'block' }
        : { id: 'activate', label: 'Activate', icon: 'check_circle' },
      { id: 'reset-password', label: 'Reset password', icon: 'lock_reset' },
    ];
  }
}
