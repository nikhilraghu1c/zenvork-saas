import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import {
  AppActionMenuComponent,
  AppActionMenuItem,
} from '../../../../shared/action-menu/action-menu.component';
import { AdminBusinessType } from '../../services/business-type.service';

type EditHandler = (businessType: AdminBusinessType) => void;
type StatusHandler = (businessType: AdminBusinessType, isActive: boolean) => void;

@Component({
  selector: 'app-business-type-grid-actions',
  imports: [AppActionMenuComponent],
  templateUrl: './business-type-grid-actions.component.html',
  styleUrl: './business-type-grid-actions.component.scss',
})
export class BusinessTypeGridActionsComponent implements ICellRendererAngularComp {
  private params!: ICellRendererParams<AdminBusinessType>;
  protected businessType!: AdminBusinessType;
  protected actions: AppActionMenuItem[] = [];

  /** Receives one platform business-type configuration row. */
  agInit(params: ICellRendererParams<AdminBusinessType>): void {
    this.setBusinessType(params);
  }

  /** Refreshes the lifecycle action after an activation change. */
  refresh(params: ICellRendererParams<AdminBusinessType>): boolean {
    this.setBusinessType(params);
    return true;
  }

  protected handleAction(actionId: string): void {
    if (actionId === 'edit') {
      (this.params.context?.['editBusinessType'] as EditHandler | undefined)?.(this.businessType);
      return;
    }
    (this.params.context?.['updateBusinessTypeStatus'] as StatusHandler | undefined)?.(
      this.businessType,
      actionId === 'activate',
    );
  }

  private setBusinessType(params: ICellRendererParams<AdminBusinessType>): void {
    this.params = params;
    this.businessType = params.data!;
    this.actions = [
      { id: 'edit', label: 'Edit details', icon: 'edit' },
      this.businessType.isActive
        ? { id: 'deactivate', label: 'Deactivate', icon: 'toggle_off' }
        : { id: 'activate', label: 'Activate', icon: 'toggle_on' },
    ];
  }
}
