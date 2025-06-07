import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { PageEvent } from '@angular/material/paginator';
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
export class TableGridComponent implements OnInit {
  @Input() config!: TableGridComponentProps;
  @Input() data: any[] = [];
  @Input() serverSide: boolean = false;
  @Input() theme: string = 'default';
  @Input() alternateRowColor: string = '';
  @Output() pageChange = new EventEmitter<PageEvent>();
  @Output() rowSelect = new EventEmitter<any[]>();
  @Output() selectAll = new EventEmitter<boolean>();

  displayedColumns: string[] = [];
  dataSource = new MatTableDataSource<any>();
  selection = new Set<Record<string, any>>();

  ngOnInit() {
    this.displayedColumns = this.config?.columns?.map((col: TableGridColumnConfig) => col.key) || [];
    if (this.config?.selectable) {
      this.displayedColumns.unshift('select');
    }
    this.dataSource.data = this.data as Record<string, any>[];
  }

  onPage(event: any) {
    const pageEvent = event as PageEvent;
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
}
