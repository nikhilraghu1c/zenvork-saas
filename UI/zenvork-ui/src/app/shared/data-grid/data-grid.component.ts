import { Component, Input } from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';
import { AllCommunityModule, ColDef, themeQuartz } from 'ag-grid-community';

@Component({
  selector: 'app-data-grid',
  imports: [AgGridAngular],
  templateUrl: './data-grid.component.html',
  styleUrl: './data-grid.component.scss',
})
export class AppDataGridComponent {
  /** Rows displayed by the shared desktop data grid. */
  @Input({ required: true }) rowData: unknown[] = [];
  /** Column configuration supplied by the feature that owns the data. */
  @Input({ required: true }) columnDefs: ColDef<any>[] = [];

  /** Registers the free AG Grid Community features used by Zenvork. */
  protected readonly modules = [AllCommunityModule];
  /** Applies Zenvork's dark Material-aligned visual treatment to every shared grid. */
  protected readonly theme = themeQuartz.withParams({
    accentColor: 'var(--cyan)',
    backgroundColor: 'var(--surface-grid)',
    foregroundColor: 'var(--text)',
    headerBackgroundColor: 'var(--surface-subtle)',
    headerTextColor: 'var(--text)',
    borderColor: 'var(--border)',
    oddRowBackgroundColor: 'var(--surface-grid-row)',
    rowHoverColor: 'var(--cyan-soft)',
    fontFamily: 'var(--font-body)',
    fontSize: 14,
    rowHeight: 64,
    headerHeight: 48,
    autoHeightMinBodyHeight: 0,
    borderRadius: 12,
    wrapperBorderRadius: 16,
  });
  /** Gives feature columns sensible behavior unless they opt out. */
  protected readonly defaultColDef: ColDef = {
    flex: 1,
    minWidth: 130,
    resizable: true,
    sortable: true,
  };
}
