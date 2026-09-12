import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import {
  AppActionMenuComponent,
  AppActionMenuItem,
} from '../../../../shared/action-menu/action-menu.component';
import { ResourceRecord } from '../../services/resource.service';

@Component({
  selector: 'app-resource-grid-actions',
  imports: [AppActionMenuComponent],
  templateUrl: './resource-grid-actions.component.html',
  styleUrl: './resource-grid-actions.component.scss',
})
export class ResourceGridActionsComponent implements ICellRendererAngularComp {
  private readonly router = inject(Router);
  protected resource!: ResourceRecord;
  protected readonly actions: AppActionMenuItem[] = [
    { id: 'details', label: 'Details', icon: 'visibility' },
    { id: 'edit', label: 'Edit', icon: 'edit', disabled: true },
    { id: 'delete', label: 'Delete', icon: 'person_off', disabled: true },
  ];

  /** Receives the resource record rendered by the AG Grid action cell. */
  agInit(params: ICellRendererParams<ResourceRecord>): void {
    this.resource = params.data!;
  }

  /** Refreshes the rendered resource record when AG Grid updates a row. */
  refresh(params: ICellRendererParams<ResourceRecord>): boolean {
    this.resource = params.data!;
    return true;
  }

  /** Opens the currently available details view for this resource record. */
  protected handleAction(actionId: string): void {
    if (actionId === 'details') {
      void this.router.navigate(['/app/resources', this.resource._id]);
    }
  }
}
