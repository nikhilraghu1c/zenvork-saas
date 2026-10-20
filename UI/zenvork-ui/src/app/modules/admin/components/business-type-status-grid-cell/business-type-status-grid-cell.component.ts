import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { AdminBusinessType } from '../../services/business-type.service';

@Component({
  selector: 'app-business-type-status-grid-cell',
  imports: [MatIconModule],
  templateUrl: './business-type-status-grid-cell.component.html',
  styleUrl: './business-type-status-grid-cell.component.scss',
})
export class BusinessTypeStatusGridCellComponent implements ICellRendererAngularComp {
  protected isActive = true;

  /** Reads the platform catalogue lifecycle state from the rendered grid row. */
  agInit(params: ICellRendererParams<AdminBusinessType>): void {
    this.setStatus(params);
  }

  /** Keeps the badge in sync after a catalogue lifecycle update. */
  refresh(params: ICellRendererParams<AdminBusinessType>): boolean {
    this.setStatus(params);
    return true;
  }

  private setStatus(params: ICellRendererParams<AdminBusinessType>): void {
    this.isActive = params.data?.isActive !== false;
  }
}
