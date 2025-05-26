import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { TableConfig, TableColumn, DataSourceConfig } from '../../models/ui-config.interface';
import { RendererService } from '../../services/renderer.service';
import { MaterialModule } from '../../shared/material.module';

interface SortState {
  column: string;
  direction: 'asc' | 'desc' | '';
}

@Component({
  selector: 'app-table-renderer',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule],
  templateUrl: './table-renderer-material.component.html',
  styleUrl: './table-renderer-material.component.css'
})
export class TableRendererComponent implements OnInit, OnDestroy {
  @Input() config!: TableConfig;
  @Output() tableEvent = new EventEmitter<any>();

  // Table data
  data: any[] = [];
  filteredData: any[] = [];
  paginatedData: any[] = [];

  // Loading and error states
  isLoading = false;
  error: string | null = null;

  // Filtering
  globalFilter = '';
  columnFilters: { [key: string]: string } = {};

  // Sorting
  sortState: SortState = { column: '', direction: '' };

  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalItems = 0;
  totalPages = 0;

  // Selection
  selectedItems: Set<any> = new Set();
  isAllSelected = false;

  // Material Table
  displayedColumns: string[] = [];

  private destroy$ = new Subject<void>();

  constructor(private rendererService: RendererService) {}

  ngOnInit(): void {
    this.setupDisplayedColumns();
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupDisplayedColumns(): void {
    this.displayedColumns = [];
    
    if (this.config.selectable) {
      this.displayedColumns.push('select');
    }
    
    this.config.columns.forEach(column => {
      this.displayedColumns.push(column.field);
    });
    
    if (this.config.rowActions && this.config.rowActions.length > 0) {
      this.displayedColumns.push('actions');
    }
  }

  loadData(): void {
    if (!this.config.dataSource) {
      this.data = [];
      this.applyFiltersAndPagination();
      return;
    }

    this.isLoading = true;
    this.error = null;

    this.rendererService.loadData(this.config.dataSource)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.data = Array.isArray(data) ? data : [];
          this.isLoading = false;
          this.applyFiltersAndPagination();
        },
        error: (error) => {
          this.error = 'Failed to load table data';
          this.isLoading = false;
          console.error('Table data loading error:', error);
        }
      });
  }

  onFilter(): void {
    this.applyFiltersAndPagination();
  }

  onSort(column: string): void {
    if (this.sortState.column === column) {
      this.sortState.direction = this.sortState.direction === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortState.column = column;
      this.sortState.direction = 'asc';
    }
    this.applyFiltersAndPagination();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.applyFiltersAndPagination();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 1;
    this.applyFiltersAndPagination();
  }

  onSelectItem(item: any, event: MatCheckboxChange): void {
    if (event.checked) {
      this.selectedItems.add(item);
    } else {
      this.selectedItems.delete(item);
    }
    this.updateSelectAllState();
    this.emitEvent('selection-changed', Array.from(this.selectedItems));
  }

  onSelectAll(event: MatCheckboxChange): void {
    if (event.checked) {
      this.paginatedData.forEach(item => this.selectedItems.add(item));
    } else {
      this.paginatedData.forEach(item => this.selectedItems.delete(item));
    }
    this.updateSelectAllState();
    this.emitEvent('selection-changed', Array.from(this.selectedItems));
  }

  onRowAction(action: any, item: any): void {
    this.emitEvent('row-action', { action, item });
  }

  onTableAction(action: any): void {
    this.emitEvent('table-action', { action });
  }

  isSelected(item: any): boolean {
    return this.selectedItems.has(item);
  }

  getSortDirection(column: string): string {
    return this.sortState.column === column ? this.sortState.direction : '';
  }

  private applyFiltersAndPagination(): void {
    // Apply filters
    this.filteredData = this.data.filter(item => {
      // Global filter
      if (this.globalFilter) {
        const globalMatch = Object.values(item).some(value => 
          String(value).toLowerCase().includes(this.globalFilter.toLowerCase())
        );
        if (!globalMatch) return false;
      }

      // Column filters
      for (const [column, filter] of Object.entries(this.columnFilters)) {
        if (filter && !String(item[column]).toLowerCase().includes(filter.toLowerCase())) {
          return false;
        }
      }

      return true;
    });

    // Apply sorting
    if (this.sortState.column && this.sortState.direction) {
      this.filteredData.sort((a, b) => {
        const aVal = a[this.sortState.column];
        const bVal = b[this.sortState.column];
        
        let result = 0;
        if (aVal < bVal) result = -1;
        else if (aVal > bVal) result = 1;
        
        return this.sortState.direction === 'desc' ? -result : result;
      });
    }

    // Apply pagination
    this.totalItems = this.filteredData.length;
    this.totalPages = Math.ceil(this.totalItems / this.pageSize);
    
    if (this.currentPage > this.totalPages) {
      this.currentPage = Math.max(1, this.totalPages);
    }

    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedData = this.filteredData.slice(startIndex, endIndex);

    this.updateSelectAllState();
  }

  private updateSelectAllState(): void {
    const selectedInPage = this.paginatedData.filter(item => this.selectedItems.has(item));
    this.isAllSelected = this.paginatedData.length > 0 && selectedInPage.length === this.paginatedData.length;
  }

  private emitEvent(eventType: string, data: any): void {
    this.tableEvent.emit({
      type: eventType,
      data: data,
      config: this.config
    });
  }

  refresh(): void {
    this.loadData();
  }
}
