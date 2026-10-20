import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { AdminResourceType } from '../../services/resource-type.service';

@Component({
  selector: 'app-resource-type-status-grid-cell',
  imports: [MatIconModule],
  templateUrl: './resource-type-status-grid-cell.component.html',
  styleUrl: './resource-type-status-grid-cell.component.scss',
})
export class ResourceTypeStatusGridCellComponent implements ICellRendererAngularComp {
  protected isActive = true;

  /** Reads the resource-type lifecycle state from the rendered platform configuration row. */
  agInit(params: ICellRendererParams<AdminResourceType>): void {
    this.setStatus(params);
  }

  /** Keeps the lifecycle badge in sync after a configuration is activated or deactivated. */
  refresh(params: ICellRendererParams<AdminResourceType>): boolean {
    this.setStatus(params);
    return true;
  }

  private setStatus(params: ICellRendererParams<AdminResourceType>): void {
    this.isActive = params.data?.isActive !== false;
  }
}
