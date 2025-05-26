import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { TableConfig, TableColumn, DataSourceConfig } from '../../models/ui-config.interface';
import { RendererService } from '../../services/renderer.service';

interface SortState {
  column: string;
  direction: 'asc' | 'desc' | '';
}

@Component({
  selector: 'app-table-renderer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './table-renderer.component.html',
  styleUrl: './table-renderer.component.css'
})
export class TableRendererComponent implements OnInit, OnDestroy {
  @Input() config!: TableConfig;
  
  // Expose Math to template
  Math = Math;
  @Output() event = new EventEmitter<any>();

  data: any[] = [];
  filteredData: any[] = [];
  paginatedData: any[] = [];
  selectedRows: Set<number> = new Set();
  isLoading = false;
  error: string | null = null;

  // Pagination
  currentPage = 1;
  totalPages = 1;
  pageSize = 10;
  totalItems = 0;

  // Sorting
  sortState: SortState = { column: '', direction: '' };

  // Filtering
  filterValues: { [key: string]: string } = {};
  globalFilter = '';

  private destroy$ = new Subject<void>();

  constructor(private rendererService: RendererService) {}

  ngOnInit(): void {
    this.initializeTable();
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize table configuration
   */
  private initializeTable(): void {
    if (this.config.pagination) {
      this.pageSize = this.config.pagination.pageSize || 10;
    }

    // Initialize filter values
    this.config.columns.forEach(column => {
      if (column.filterable) {
        this.filterValues[column.key] = '';
      }
    });
  }

  /**
   * Load data from data source or use static data
   */
  private loadData(): void {
    if (this.config.data) {
      // Use static data
      this.data = [...this.config.data];
      this.processData();
    } else if (this.config.dataSource) {
      // Load data from API
      this.isLoading = true;
      this.error = null;

      this.rendererService.loadData(this.config.dataSource)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.data = Array.isArray(response) ? response : response.data || [];
            this.processData();
            this.isLoading = false;
          },
          error: (error) => {
            this.error = 'Failed to load table data';
            this.isLoading = false;
            console.error('Table data loading error:', error);
          }
        });
    }
  }

  /**
   * Process data (filter, sort, paginate)
   */
  private processData(): void {
    let processedData = [...this.data];

    // Apply filters
    processedData = this.applyFilters(processedData);

    // Apply sorting
    processedData = this.applySorting(processedData);

    this.filteredData = processedData;
    this.totalItems = processedData.length;

    // Apply pagination
    this.applyPagination();
  }

  /**
   * Apply filters to data
   */
  private applyFilters(data: any[]): any[] {
    let filtered = data;

    // Apply global filter
    if (this.globalFilter.trim()) {
      const globalFilterLower = this.globalFilter.toLowerCase();
      filtered = filtered.filter(row => 
        this.config.columns.some(column => 
          String(row[column.key] || '').toLowerCase().includes(globalFilterLower)
        )
      );
    }

    // Apply column filters
    Object.keys(this.filterValues).forEach(columnKey => {
      const filterValue = this.filterValues[columnKey];
      if (filterValue.trim()) {
        const filterValueLower = filterValue.toLowerCase();
        filtered = filtered.filter(row => 
          String(row[columnKey] || '').toLowerCase().includes(filterValueLower)
        );
      }
    });

    return filtered;
  }

  /**
   * Apply sorting to data
   */
  private applySorting(data: any[]): any[] {
    if (!this.sortState.column || !this.sortState.direction) {
      return data;
    }

    return data.sort((a, b) => {
      const valueA = a[this.sortState.column];
      const valueB = b[this.sortState.column];

      let comparison = 0;

      if (valueA < valueB) {
        comparison = -1;
      } else if (valueA > valueB) {
        comparison = 1;
      }

      return this.sortState.direction === 'desc' ? comparison * -1 : comparison;
    });
  }

  /**
   * Apply pagination to filtered data
   */
  private applyPagination(): void {
    if (!this.config.pagination?.enabled) {
      this.paginatedData = this.filteredData;
      return;
    }

    this.totalPages = Math.ceil(this.totalItems / this.pageSize);
    this.currentPage = Math.min(this.currentPage, this.totalPages || 1);

    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;

    this.paginatedData = this.filteredData.slice(startIndex, endIndex);
  }

  /**
   * Handle column sorting
   */
  onSort(column: TableColumn): void {
    if (!column.sortable) return;

    if (this.sortState.column === column.key) {
      // Toggle sort direction
      if (this.sortState.direction === 'asc') {
        this.sortState.direction = 'desc';
      } else if (this.sortState.direction === 'desc') {
        this.sortState.direction = '';
        this.sortState.column = '';
      } else {
        this.sortState.direction = 'asc';
      }
    } else {
      // New column sort
      this.sortState.column = column.key;
      this.sortState.direction = 'asc';
    }

    this.processData();
    this.emitEvent('sort', { column: column.key, direction: this.sortState.direction });
  }

  /**
   * Handle filter changes
   */
  onFilter(): void {
    this.currentPage = 1;
    this.processData();
    this.emitEvent('filter', { 
      globalFilter: this.globalFilter,
      columnFilters: this.filterValues 
    });
  }

  /**
   * Handle page changes
   */
  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.applyPagination();
      this.emitEvent('pageChange', { page: this.currentPage, pageSize: this.pageSize });
    }
  }

  /**
   * Handle page size changes
   */
  onPageSizeChange(newPageSize: number): void {
    this.pageSize = newPageSize;
    this.currentPage = 1;
    this.processData();
    this.emitEvent('pageSizeChange', { pageSize: this.pageSize });
  }

  /**
   * Handle row selection
   */
  onRowSelect(index: number, event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    
    if (checkbox.checked) {
      this.selectedRows.add(index);
    } else {
      this.selectedRows.delete(index);
    }

    this.emitEvent('rowSelect', { 
      selectedRows: Array.from(this.selectedRows),
      selectedData: this.getSelectedRowData()
    });
  }

  /**
   * Handle select all rows
   */
  onSelectAll(event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    
    if (checkbox.checked) {
      this.paginatedData.forEach((_, index) => {
        this.selectedRows.add(index);
      });
    } else {
      this.selectedRows.clear();
    }

    this.emitEvent('selectAll', { 
      selectedRows: Array.from(this.selectedRows),
      selectedData: this.getSelectedRowData()
    });
  }

  /**
   * Get selected row data
   */
  private getSelectedRowData(): any[] {
    return Array.from(this.selectedRows).map(index => this.paginatedData[index]);
  }

  /**
   * Handle table actions
   */
  onTableAction(action: any): void {
    this.emitEvent('tableAction', { action: action.type, actionData: action });
  }

  /**
   * Handle row actions
   */
  onRowAction(action: any, rowData: any, index: number): void {
    this.emitEvent('rowAction', { 
      action: action.type, 
      actionData: action,
      rowData: rowData,
      rowIndex: index
    });
  }

  /**
   * Format cell value
   */
  formatCellValue(value: any, column: TableColumn): string {
    if (value === null || value === undefined) {
      return '';
    }

    switch (column.type) {
      case 'date':
        return new Date(value).toLocaleDateString();
      case 'number':
        return typeof value === 'number' ? value.toLocaleString() : value;
      case 'boolean':
        return value ? 'Yes' : 'No';
      default:
        return String(value);
    }
  }

  /**
   * Get column alignment class
   */
  getColumnAlignClass(column: TableColumn): string {
    return `text-${column.align || 'left'}`;
  }

  /**
   * Get sort icon class
   */
  getSortIconClass(column: TableColumn): string {
    if (!column.sortable || this.sortState.column !== column.key) {
      return 'sort-icon';
    }

    return `sort-icon sort-${this.sortState.direction}`;
  }

  /**
   * Check if all rows are selected
   */
  isAllSelected(): boolean {
    return this.paginatedData.length > 0 && 
           this.selectedRows.size === this.paginatedData.length;
  }

  /**
   * Check if some rows are selected (for indeterminate state)
   */
  isSomeSelected(): boolean {
    return this.selectedRows.size > 0 && !this.isAllSelected();
  }

  /**
   * Refresh table data
   */
  refresh(): void {
    this.selectedRows.clear();
    this.loadData();
    this.emitEvent('refresh', {});
  }

  /**
   * Get total column count for colspan
   */
  getColumnCount(): number {
    let count = this.config.columns.length;
    if (this.config.selectable) count++;
    if (this.config.rowActions && this.config.rowActions.length > 0) count++;
    return count;
  }

  /**
   * Get page numbers for pagination
   */
  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 5;
    
    let startPage = Math.max(1, this.currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(this.totalPages, startPage + maxPagesToShow - 1);
    
    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  /**
   * Emit events to parent component
   */
  private emitEvent(type: string, data: any): void {
    this.event.emit({
      type,
      action: type,
      data
    });
  }
}
