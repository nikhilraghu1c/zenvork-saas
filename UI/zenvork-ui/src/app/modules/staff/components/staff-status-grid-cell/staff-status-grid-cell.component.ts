import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { StaffUser } from '../../services/staff.service';

@Component({
  selector: 'app-staff-status-grid-cell',
  imports: [MatIconModule],
  templateUrl: './staff-status-grid-cell.component.html',
  styleUrl: './staff-status-grid-cell.component.scss',
})
export class StaffStatusGridCellComponent implements ICellRendererAngularComp {
  protected isActive = true;

  /** Reads the staff access state from the rendered grid row. */
  agInit(params: ICellRendererParams<StaffUser>): void {
    this.setStatus(params);
  }

  /** Keeps the badge in sync after the owner activates or deactivates the staff member. */
  refresh(params: ICellRendererParams<StaffUser>): boolean {
    this.setStatus(params);
    return true;
  }

  private setStatus(params: ICellRendererParams<StaffUser>): void {
    this.isActive = params.data?.isActive !== false;
  }
}
