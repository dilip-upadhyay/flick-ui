import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { DragDropModule } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-responsive-grid',
  standalone: true,
  imports: [CommonModule, DragDropModule],
  templateUrl: './responsive-grid.component.html',
  styleUrls: ['./responsive-grid.component.css']
})
export class ResponsiveGridComponent implements OnInit, OnChanges {
  @Input() rows: number = 3;
  @Input() cols: number = 3;
  @Input() gridData: any[][] = [];
  @Output() gridChange = new EventEmitter<any[][]>();

  ngOnInit() {
    this.ensureGridData();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['rows'] || changes['cols']) {
      this.ensureGridData();
    }
  }

  private ensureGridData() {
    // Rebuild gridData if rows/cols change
    if (!this.gridData || this.gridData.length !== this.rows || this.gridData.some(row => row.length !== this.cols)) {
      const newGrid = Array.from({ length: this.rows }, (_, r) =>
        Array.from({ length: this.cols }, (_, c) => (this.gridData[r]?.[c] ?? null))
      );
      this.gridData = newGrid;
      this.gridChange.emit(this.gridData);
    }
  }

  drop(event: CdkDragDrop<any[]>, rowIdx: number, colIdx: number) {
    // Implement logic to move/transfer items between cells
    // For now, just emit gridChange
    this.gridChange.emit(this.gridData);
  }
}
