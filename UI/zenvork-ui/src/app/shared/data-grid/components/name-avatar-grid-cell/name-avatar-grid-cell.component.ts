import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

interface NamedRecord {
  name?: string | null;
}

@Component({
  selector: 'app-name-avatar-grid-cell',
  templateUrl: './name-avatar-grid-cell.component.html',
  styleUrl: './name-avatar-grid-cell.component.scss',
})
export class NameAvatarGridCellComponent implements ICellRendererAngularComp {
  protected name = 'Not provided';
  protected initial = '?';

  /** Reads a record name from the grid cell and builds its one-letter visual identifier. */
  agInit(params: ICellRendererParams<NamedRecord>): void {
    this.setName(params);
  }

  /** Refreshes the visual identifier whenever AG Grid changes the row data. */
  refresh(params: ICellRendererParams<NamedRecord>): boolean {
    this.setName(params);
    return true;
  }

  private setName(params: ICellRendererParams<NamedRecord>): void {
    this.name = String(params.value ?? params.data?.name ?? '').trim() || 'Not provided';
    this.initial = this.name.charAt(0).toUpperCase() || '?';
  }
}
