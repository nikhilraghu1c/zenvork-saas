import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { AdminBusiness } from '../../services/admin.service';

@Component({
  selector: 'app-business-status-grid-cell',
  imports: [MatIconModule],
  templateUrl: './business-status-grid-cell.component.html',
  styleUrl: './business-status-grid-cell.component.scss',
})
export class BusinessStatusGridCellComponent implements ICellRendererAngularComp {
  protected status: AdminBusiness['status'] = 'ACTIVE';

  /** Reads the account lifecycle state from the rendered platform business row. */
  agInit(params: ICellRendererParams<AdminBusiness>): void {
    this.setStatus(params);
  }

  /** Keeps the status indicator in sync after a platform lifecycle update. */
  refresh(params: ICellRendererParams<AdminBusiness>): boolean {
    this.setStatus(params);
    return true;
  }

  private setStatus(params: ICellRendererParams<AdminBusiness>): void {
    this.status = params.data?.status ?? 'ACTIVE';
  }
}
