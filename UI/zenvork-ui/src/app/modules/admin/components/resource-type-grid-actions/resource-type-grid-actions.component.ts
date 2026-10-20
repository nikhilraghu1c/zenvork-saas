import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import {
  AppActionMenuComponent,
  AppActionMenuItem,
} from '../../../../shared/action-menu/action-menu.component';
import { AdminResourceType } from '../../services/resource-type.service';

type EditHandler = (resourceType: AdminResourceType) => void;
type StatusHandler = (resourceType: AdminResourceType, isActive: boolean) => void;

@Component({
  selector: 'app-resource-type-grid-actions',
  imports: [AppActionMenuComponent],
  templateUrl: './resource-type-grid-actions.component.html',
  styleUrl: './resource-type-grid-actions.component.scss',
})
export class ResourceTypeGridActionsComponent implements ICellRendererAngularComp {
  private params!: ICellRendererParams<AdminResourceType>;
  protected resourceType!: AdminResourceType;
  protected actions: AppActionMenuItem[] = [];

  /** Receives one platform configuration row from the resource-type grid. */
  agInit(params: ICellRendererParams<AdminResourceType>): void {
    this.setResourceType(params);
  }

  /** Refreshes the lifecycle action after a successful activation change. */
  refresh(params: ICellRendererParams<AdminResourceType>): boolean {
    this.setResourceType(params);
    return true;
  }

  /** Delegates mutations to the list page, which owns API calls and error handling. */
  protected handleAction(actionId: string): void {
    if (actionId === 'edit') {
      (this.params.context?.['editResourceType'] as EditHandler | undefined)?.(this.resourceType);
      return;
    }
    (this.params.context?.['updateResourceTypeStatus'] as StatusHandler | undefined)?.(
      this.resourceType,
      actionId === 'activate',
    );
  }

  private setResourceType(params: ICellRendererParams<AdminResourceType>): void {
    this.params = params;
    this.resourceType = params.data!;
    this.actions = [
      { id: 'edit', label: 'Edit name', icon: 'edit' },
      this.resourceType.isActive
        ? { id: 'deactivate', label: 'Deactivate', icon: 'toggle_off' }
        : { id: 'activate', label: 'Activate', icon: 'toggle_on' },
    ];
  }
}
