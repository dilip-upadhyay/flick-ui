import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-responsive-grid',
  standalone: true,
  imports: [
    CommonModule,
    DragDropModule
  ],
  templateUrl: './responsive-grid.component.html',
  styleUrls: ['./responsive-grid.component.css']
})
export class ResponsiveGridComponent implements OnInit, OnChanges {
  @Input() rows: number = 3;
  @Input() cols: number = 3;
  @Input() gridData: any[][] = [];
  @Output() gridChange = new EventEmitter<any[][]>();
  @Output() externalDrop = new EventEmitter<{row: number, col: number, event: CdkDragDrop<any[]>}>();

  ngOnInit() {
    this.ensureGridData();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['rows'] || changes['cols']) {
      this.ensureGridData();
    }
  }  private ensureGridData() {
    console.log('ensureGridData called - Current gridData:', this.gridData, 'rows:', this.rows, 'cols:', this.cols);
    
    // Always ensure we have a proper 2D array structure
    const needsInitialization = !this.gridData || 
      !Array.isArray(this.gridData) || 
      this.gridData.length !== this.rows || 
      this.gridData.some((row, idx) => !Array.isArray(row) || row.length !== this.cols);
    
    if (needsInitialization) {
      const newGrid = Array.from({ length: this.rows }, (_, r) =>        Array.from({ length: this.cols }, (_, c) => {
          // Preserve existing data if available
          return this.gridData?.[r]?.[c] ?? null;
        })
      );
      this.gridData = newGrid;
      console.log('Grid data initialized/rebuilt:', this.gridData);
      this.gridChange.emit(this.gridData);
    }
  }

  drop(event: CdkDragDrop<any[]>, rowIdx: number, colIdx: number) {
    // If the source is external (not from this grid), emit externalDrop
    if (event.previousContainer !== event.container) {
      this.externalDrop.emit({ row: rowIdx, col: colIdx, event });
    } else {
      // Move/transfer within grid (future: support moving between cells)
      this.gridChange.emit(this.gridData);
    }
  }
  onFieldValueChange(value: any) {
    // Handle field value changes if needed
    console.log('Field value changed:', value);
  }
}
