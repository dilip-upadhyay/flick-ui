import { Component, Input, Output, EventEmitter, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { PageEvent, MatPaginator } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { TableGridComponentProps, TableGridColumnConfig } from '../../models/ui-config.interface';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../shared/material.module';

@Component({
  selector: 'app-table-grid',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './table-grid.component.html',
  styleUrls: ['./table-grid.component.css']
})
export class TableGridComponent implements OnInit, AfterViewInit {
  @Input() config!: TableGridComponentProps;
  @Input() data: any[] = [];
  @Input() serverSide: boolean = false;
  @Input() theme: string = 'default';
  @Input() alternateRowColor: string = '';
  @Input() collapsible: boolean = false;
  @Input() collapsed: boolean = false;
  @Output() pageChange = new EventEmitter<PageEvent>();
  @Output() rowSelect = new EventEmitter<any[]>();
  @Output() selectAll = new EventEmitter<boolean>();
  @Output() filterChange = new EventEmitter<string>();
  @Output() sortChange = new EventEmitter<Sort>();
  @Output() collapseToggle = new EventEmitter<boolean>();

  displayedColumns: string[] = [];
  filterColumns: string[] = [];
  dataSource = new MatTableDataSource<any>();
  selection = new Set<Record<string, any>>();
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Keep a reference to full data for client-side pagination
  private fullData: Record<string, any>[] = [];

  // Store per-column filter values
  columnFilters: { [key: string]: string } = {};

  filterValue: string = '';

  ngOnInit() {
    // Initialize collapse state from config if provided
    if (this.config?.collapsed !== undefined) {
      this.collapsed = this.config.collapsed;
    }
    if (this.config?.collapsible !== undefined) {
      this.collapsible = this.config.collapsible;
    }
    
    this.displayedColumns = this.config?.columns?.map((col: TableGridColumnConfig) => col.key) || [];
    if (this.config?.selectable) {
      this.displayedColumns.unshift('select');
    }
    
    // Setup filter columns
    this.filterColumns = this.config?.columns?.map((col: TableGridColumnConfig) => col.key + '-filter') || [];
    if (this.config?.selectable) {
      this.filterColumns.unshift('select-filter');
    }
    // Store full data
    this.fullData = this.data as Record<string, any>[];
    // For client-side pagination, always set full data; paginator will handle slicing
    this.dataSource.data = this.fullData;
    if (!this.serverSide) {
      this.dataSource.filterPredicate = (data: any, filter: string) => {
        // Parse filter string as JSON for column filters
        let global = '';
        let columns: { [key: string]: string } = {};
        try {
          const parsed = JSON.parse(filter);
          global = parsed.global ?? '';
          columns = parsed.columns ?? {};
        } catch {
          global = filter;
        }
        // Global filter
        const globalMatch = !global || Object.values(data).some(val => {
          if (typeof val === 'string') return val.toLowerCase().includes(global.trim().toLowerCase());
          if (typeof val === 'number') return val.toString().includes(global.trim());
          return false;
        });
        // Per-column filter
        const columnMatch = Object.entries(columns).every(([key, val]) => {
          if (!val) return true;
          const cell = data[key];
          if (typeof cell === 'string') return cell.toLowerCase().includes(val.trim().toLowerCase());
          if (typeof cell === 'number') return cell.toString().includes(val.trim());
          return false;
        });
        return globalMatch && columnMatch;
      };
    }
  }

  ngAfterViewInit() {
    if (!this.serverSide) {
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    }
  }

  onPage(event: any) {
    const pageEvent = event as PageEvent;
    // No manual slicing; MatTableDataSource + MatPaginator handle pagination
    this.pageChange.emit(pageEvent);
  }

  onRowSelect(row: Record<string, any>) {
    if (this.selection.has(row)) {
      this.selection.delete(row);
    } else {
      this.selection.add(row);
    }
    this.rowSelect.emit(Array.from(this.selection));
  }

  onSelectAll(checked: boolean) {
    if (checked) {
      (this.data as Record<string, any>[]).forEach(row => this.selection.add(row));
    } else {
      this.selection.clear();
    }
    this.selectAll.emit(checked);
  }

  isSelected(row: Record<string, any>): boolean {
    return this.selection.has(row);
  }

  applyColumnFilter(columnKey: string, value: string) {
    this.columnFilters[columnKey] = value;
    if (this.serverSide) {
      this.filterChange.emit(JSON.stringify({ global: this.filterValue, columns: this.columnFilters }));
    } else {
      this.dataSource.filter = JSON.stringify({ global: this.filterValue, columns: this.columnFilters });
    }
  }

  applyFilter(filterValue: string) {
    this.filterValue = filterValue;
    if (this.serverSide) {
      this.filterChange.emit(JSON.stringify({ global: filterValue, columns: this.columnFilters }));
    } else {
      this.dataSource.filter = JSON.stringify({ global: filterValue, columns: this.columnFilters });
    }
  }

  onFilterInput(event: Event) {
    const value = (event.target as HTMLInputElement)?.value || '';
    this.applyFilter(value);
  }

  onColumnFilterInput(columnKey: string, event: Event) {
    const value = (event.target as HTMLInputElement)?.value || '';
    this.applyColumnFilter(columnKey, value);
  }

  onSortChange(sortState: Sort) {
    if (this.serverSide) {
      this.sortChange.emit(sortState);
    }
    // For client-side sorting, MatTableDataSource handles it automatically
  }

  toggleCollapse() {
    this.collapsed = !this.collapsed;
    this.collapseToggle.emit(this.collapsed);
  }

  shouldShowColumnFilters(): boolean {
    return !!(this.config?.columns?.length);
  }
}
