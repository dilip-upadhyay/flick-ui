import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../shared/material.module';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { FormElementConfig } from '../form-element-renderer/form-element-renderer.component';
import { FormElementRendererComponent } from '../form-element-renderer/form-element-renderer.component';
import { Subject, takeUntil } from 'rxjs';

export interface GridPosition {
  row: number;
  col: number;
  width: number;
  height: number;
}

export interface GridCell {
  row: number;
  col: number;
  isDragOver?: boolean;
}

export interface FormFieldWithPosition extends FormElementConfig {
  gridPosition?: GridPosition;
}

@Component({
  selector: 'app-form-grid-layout',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule, DragDropModule, FormElementRendererComponent],
  template: `
    <div class="form-grid-container">
      <!-- Grid Controls -->
      <div class="grid-controls" *ngIf="editMode">
        <mat-card class="controls-card">
          <mat-card-content>
            <div class="grid-settings">
              <mat-form-field appearance="outline" class="grid-input">
                <mat-label>Columns</mat-label>
                <input matInput type="number" [(ngModel)]="gridCols" min="1" max="12" (change)="onGridSettingsChange()">
              </mat-form-field>
              
              <mat-form-field appearance="outline" class="grid-input">
                <mat-label>Gap (px)</mat-label>
                <input matInput type="number" [(ngModel)]="gridGap" min="0" max="50" (change)="onGridSettingsChange()">
              </mat-form-field>

              <mat-slide-toggle [(ngModel)]="showGridLines" (change)="onGridSettingsChange()">
                Show Grid Lines
              </mat-slide-toggle>

              <mat-slide-toggle [(ngModel)]="snapToGrid" (change)="onGridSettingsChange()">
                Snap to Grid
              </mat-slide-toggle>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Grid Layout -->
      <div 
        class="form-grid"
        [class.show-grid-lines]="showGridLines"
        [class.edit-mode]="editMode"
        [ngStyle]="{
          'grid-template-columns': 'repeat(' + gridCols + ', 1fr)',
          'grid-template-rows': 'repeat(' + gridRows + ', minmax(80px, auto))',
          'gap': gridGap + 'px'
        }">
        
        <!-- Grid Cells with Individual Drop Lists -->
        <div 
          *ngFor="let cell of gridCells; let i = index"
          class="grid-cell"
          [class.occupied]="isCellOccupied(cell.row, cell.col)"
          [class.drop-target]="editMode"
          [class.drop-zone-active]="isDragActive"
          [class.native-drag-over]="cell.isDragOver"
          [attr.data-row]="cell.row"
          [attr.data-col]="cell.col"
          [id]="'grid-cell-' + cell.row + '-' + cell.col"
          cdkDropList
          [cdkDropListData]="getFieldsInCell(cell.row, cell.col)"
          (cdkDropListDropped)="onCellDropped($event, cell)"
          (dragover)="onNativeDragOver($event, cell)"
          (dragleave)="onNativeDragLeave($event, cell)"
          (drop)="onNativeDrop($event, cell)"
          (click)="onCellClick(cell, $event)">
          
          <!-- Drop zone indicator -->
          <div class="drop-zone-indicator" *ngIf="editMode && !isCellOccupied(cell.row, cell.col)">
            <mat-icon>add</mat-icon>
            <span>Drop here</span>
          </div>
          
          <!-- Field in this cell -->
          <div 
            *ngFor="let field of getFieldsInCell(cell.row, cell.col)"
            class="field-wrapper"
            [class.selected]="selectedField?.id === field.id"
            [class.dragging]="draggingField?.id === field.id"
            cdkDrag
            [cdkDragData]="field"
            (cdkDragStarted)="onFieldDragStart(field)"
            (cdkDragEnded)="onFieldDragEnd()"
            (click)="onFieldClick(field, $event)">
            
            <div class="field-resize-handles" *ngIf="editMode && selectedField?.id === field.id">
              <div class="resize-handle resize-handle-se" 
                   (mousedown)="startResize($event, field, 'se')"></div>
              <div class="resize-handle resize-handle-e" 
                   (mousedown)="startResize($event, field, 'e')"></div>
              <div class="resize-handle resize-handle-s" 
                   (mousedown)="startResize($event, field, 's')"></div>
            </div>

            <div class="field-content">
              <app-form-element-renderer 
                [config]="field"
                [disabled]="editMode"
                (valueChange)="onFieldValueChange(field, $event)">
              </app-form-element-renderer>
            </div>

            <!-- Field overlay for edit mode -->
            <div class="field-overlay" *ngIf="editMode">
              <div class="field-info">
                <span class="field-type">{{ field.type }}</span>
                <span class="field-label">{{ field.label }}</span>
              </div>
              <div class="field-actions">
                <button mat-icon-button 
                        size="small"
                        (click)="editField(field); $event.stopPropagation()">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button 
                        color="warn"
                        size="small"
                        (click)="removeField(field); $event.stopPropagation()">
                  <mat-icon>delete</mat-icon>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      
  `,
  styles: [`
    .form-grid-container {
      position: relative;
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .grid-controls {
      margin-bottom: 16px;
    }

    .controls-card {
      padding: 8px;
    }

    .grid-settings {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }

    .grid-input {
      width: 80px;
    }

    .form-grid {
      flex: 1;
      display: grid;
      min-height: 400px;
      padding: 16px;
      background: #fafafa;
      border-radius: 8px;
      position: relative;
    }

    .form-grid.show-grid-lines {
      background-image: 
        linear-gradient(to right, #e0e0e0 1px, transparent 1px),
        linear-gradient(to bottom, #e0e0e0 1px, transparent 1px);
      background-size: calc(100% / var(--grid-cols, 3)) calc(100% / var(--grid-rows, 5));
    }

    .grid-cell {
      min-height: 80px;
      border: 2px dashed #e0e0e0;
      border-radius: 8px;
      position: relative;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #fafafa;
    }

    .grid-cell.drop-target:hover,
    .grid-cell.drop-zone-active,
    .grid-cell.native-drag-over {
      border-color: #2196f3;
      background-color: rgba(33, 150, 243, 0.1);
    }

    .grid-cell.native-drag-over {
      border-width: 2px;
      border-style: dashed;
    }

    .grid-cell.occupied {
      border-color: transparent;
      background-color: transparent;
    }

    .drop-zone-indicator {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #9e9e9e;
      font-size: 14px;
      text-align: center;
      height: 100%;
      width: 100%;
      pointer-events: none;
    }

    .drop-zone-indicator mat-icon {
      font-size: 24px;
      margin-bottom: 4px;
      opacity: 0.5;
    }

    .cdk-drop-list-receiving .drop-zone-indicator {
      color: #2196f3;
    }

    .cdk-drop-list-receiving .drop-zone-indicator mat-icon {
      opacity: 1;
    }

    .field-wrapper {
      position: relative;
      width: 100%;
      height: 100%;
      min-height: 60px;
      border-radius: 4px;
      transition: all 0.2s ease;
      cursor: move;
    }

    .field-wrapper.selected {
      box-shadow: 0 0 0 2px #2196f3;
      z-index: 10;
    }

    .field-wrapper.dragging {
      opacity: 0.5;
      transform: rotate(2deg);
    }

    .field-content {
      height: 100%;
      pointer-events: none;
    }

    .edit-mode .field-content {
      pointer-events: none;
    }

    .field-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.9);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px;
      opacity: 0;
      transition: opacity 0.2s ease;
      border-radius: 4px;
    }

    .field-wrapper:hover .field-overlay {
      opacity: 1;
    }

    .field-info {
      display: flex;
      flex-direction: column;
      font-size: 12px;
    }

    .field-type {
      font-weight: 500;
      color: #666;
      text-transform: uppercase;
    }

    .field-label {
      color: #333;
    }

    .field-actions {
      display: flex;
      gap: 4px;
    }

    .field-resize-handles {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
      z-index: 20;
    }

    .resize-handle {
      position: absolute;
      background: #2196f3;
      pointer-events: all;
      cursor: nw-resize;
    }

    .resize-handle-se {
      bottom: -3px;
      right: -3px;
      width: 6px;
      height: 6px;
      cursor: se-resize;
    }

    .resize-handle-e {
      top: 50%;
      right: -3px;
      width: 6px;
      height: 12px;
      transform: translateY(-50%);
      cursor: e-resize;
    }

    .resize-handle-s {
      bottom: -3px;
      left: 50%;
      width: 12px;
      height: 6px;
      transform: translateX(-50%);
      cursor: s-resize;
    }

    .field-palette {
      position: fixed;
      top: 100px;
      right: 20px;
      width: 200px;
      z-index: 1000;
    }

    .palette-card {
      max-height: 400px;
      overflow-y: auto;
    }

    .palette-elements {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .palette-element {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px;
      background: #f5f5f5;
      border-radius: 4px;
      cursor: grab;
      transition: background-color 0.2s ease;
    }

    .palette-element:hover {
      background: #e0e0e0;
    }

    .palette-element:active {
      cursor: grabbing;
    }

    .cdk-drag-preview.palette-element {
      background: #2196f3;
      color: white;
      box-shadow: 0 4px 8px rgba(0,0,0,0.3);
      transform: rotate(5deg);
    }

    .cdk-drag-preview.field-wrapper {
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      transform: rotate(2deg);
    }

    .cdk-drop-list-dragging .grid-cell:not(.cdk-drop-list-receiving) {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }

    .cdk-drop-list-receiving {
      border-color: #4caf50 !important;
      background-color: rgba(76, 175, 80, 0.1) !important;
    }

    .cdk-drop-list-receiving .drop-zone-indicator {
      color: #4caf50;
    }

    .cdk-drop-list-receiving .drop-zone-indicator mat-icon {
      animation: pulse 0.5s ease-in-out infinite alternate;
    }

    @keyframes pulse {
      from { transform: scale(1); }
      to { transform: scale(1.1); }
    }
  `]
})
export class FormGridLayoutComponent implements OnInit, OnDestroy {
  @Input() formFields: FormFieldWithPosition[] = [];
  @Input() editMode: boolean = false;
  @Input() showPalette: boolean = true;
  @Output() fieldsChange = new EventEmitter<FormFieldWithPosition[]>();
  @Output() fieldSelected = new EventEmitter<FormFieldWithPosition | null>();
  @Output() fieldEdit = new EventEmitter<FormFieldWithPosition>();

  // Grid settings
  gridCols: number = 3;
  gridRows: number = 5;
  gridGap: number = 16;
  showGridLines: boolean = true;
  snapToGrid: boolean = true;

  // State
  selectedField: FormFieldWithPosition | null = null;
  draggingField: FormFieldWithPosition | null = null;
  isDragActive: boolean = false;
  gridCells: GridCell[] = [];
  
  // Available element types for palette
  availableElementTypes = [
    { type: 'text-input', name: 'Text Input', icon: 'text_fields' },
    { type: 'email-input', name: 'Email', icon: 'email' },
    { type: 'password-input', name: 'Password', icon: 'lock' },
    { type: 'number-input', name: 'Number', icon: 'numbers' },
    { type: 'textarea', name: 'Textarea', icon: 'notes' },
    { type: 'radio', name: 'Radio', icon: 'radio_button_checked' },
    { type: 'checkbox', name: 'Checkbox', icon: 'check_box' },
    { type: 'date-picker', name: 'Date', icon: 'date_range' },
    { type: 'file-upload', name: 'File Upload', icon: 'upload_file' },
    { type: 'slider', name: 'Slider', icon: 'tune' },
    { type: 'toggle', name: 'Toggle', icon: 'toggle_on' }
  ];

  private destroy$ = new Subject<void>();
  private resizing = false;
  private resizeStartPos = { x: 0, y: 0 };
  private resizeStartSize = { width: 1, height: 1 };

  ngOnInit() {
    this.generateGridCells();
    this.initializeFieldPositions();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  generateGridCells() {
    this.gridCells = [];
    for (let row = 0; row < this.gridRows; row++) {
      for (let col = 0; col < this.gridCols; col++) {
        this.gridCells.push({ row, col });
      }
    }
  }

  initializeFieldPositions() {
    // Initialize positions for fields that don't have them
    this.formFields.forEach((field, index) => {
      if (!field.gridPosition) {
        const row = Math.floor(index / this.gridCols);
        const col = index % this.gridCols;
        field.gridPosition = { row, col, width: 1, height: 1 };
      }
    });
  }

  onGridSettingsChange() {
    this.generateGridCells();
    // Adjust field positions if they're outside the new grid
    this.formFields.forEach(field => {
      if (field.gridPosition) {
        if (field.gridPosition.col >= this.gridCols) {
          field.gridPosition.col = this.gridCols - 1;
        }
        if (field.gridPosition.row >= this.gridRows) {
          field.gridPosition.row = this.gridRows - 1;
        }
      }
    });
    this.fieldsChange.emit(this.formFields);
  }

  isCellOccupied(row: number, col: number): boolean {
    return this.formFields.some(field => 
      field.gridPosition && 
      field.gridPosition.row <= row && 
      field.gridPosition.row + field.gridPosition.height > row &&
      field.gridPosition.col <= col && 
      field.gridPosition.col + field.gridPosition.width > col
    );
  }

  getFieldsInCell(row: number, col: number): FormFieldWithPosition[] {
    return this.formFields.filter(field => 
      field.gridPosition && 
      field.gridPosition.row === row && 
      field.gridPosition.col === col
    );
  }

  onCellClick(cell: { row: number; col: number }, event: Event) {
    if (!this.editMode) return;
    
    const fieldsInCell = this.getFieldsInCell(cell.row, cell.col);
    if (fieldsInCell.length === 0) {
      this.selectedField = null;
      this.fieldSelected.emit(null);
    }
  }

  onFieldClick(field: FormFieldWithPosition, event: Event) {
    event.stopPropagation();
    if (this.editMode) {
      this.selectedField = field;
      this.fieldSelected.emit(field);
    }
  }

  onFieldDragStart(field: FormFieldWithPosition) {
    this.draggingField = field;
    this.isDragActive = true;
  }

  onFieldDragEnd() {
    this.draggingField = null;
    this.isDragActive = false;
  }

  onPaletteElementDragStart(elementType: any) {
    this.isDragActive = true;
  }

  onCellDropped(event: CdkDragDrop<FormFieldWithPosition[]>, cell: { row: number; col: number }) {
    const draggedItem = event.item.data;
    
    if (draggedItem && typeof draggedItem === 'object') {
      if (draggedItem.id) {
        // It's an existing field being moved
        const existingField = draggedItem as FormFieldWithPosition;
        if (existingField.gridPosition) {
          existingField.gridPosition.row = cell.row;
          existingField.gridPosition.col = cell.col;
        }
      } else if (draggedItem.type) {
        // It's a new element from palette
        const newField: FormFieldWithPosition = {
          id: this.generateFieldId(),
          type: draggedItem.type,
          label: draggedItem.name,
          placeholder: `Enter ${draggedItem.name.toLowerCase()}`,
          gridPosition: { row: cell.row, col: cell.col, width: 1, height: 1 }
        };
        
        this.formFields.push(newField);
      }
    }
    
    this.isDragActive = false;
    this.fieldsChange.emit(this.formFields);
  }

  onFieldDropped(event: CdkDragDrop<FormFieldWithPosition[]>) {
    if (event.previousContainer === event.container) {
      // Reordering within the same container
      moveItemInArray(this.formFields, event.previousIndex, event.currentIndex);
    } else {
      // Transfer from palette or another container
      const draggedItem = event.item.data;
      
      if (typeof draggedItem === 'object' && draggedItem.type) {
        // It's a new element from palette
        const newField: FormFieldWithPosition = {
          id: this.generateFieldId(),
          type: draggedItem.type,
          label: draggedItem.name,
          placeholder: `Enter ${draggedItem.name.toLowerCase()}`,
          gridPosition: { row: 0, col: 0, width: 1, height: 1 }
        };
        
        // Find empty cell for new field
        const emptyCell = this.findEmptyCell();
        if (emptyCell) {
          newField.gridPosition = { ...emptyCell, width: 1, height: 1 };
        }
        
        this.formFields.push(newField);
      }
    }
    
    this.fieldsChange.emit(this.formFields);
  }

  onCellDragOver(event: DragEvent, cell: { row: number; col: number }) {
    if (this.editMode) {
      event.preventDefault();
    }
  }

  onCellDrop(event: DragEvent, cell: { row: number; col: number }) {
    if (!this.editMode) return;
    
    event.preventDefault();
    
    // Handle drop from external source or move existing field
    if (this.draggingField && this.draggingField.gridPosition) {
      this.draggingField.gridPosition.row = cell.row;
      this.draggingField.gridPosition.col = cell.col;
      this.fieldsChange.emit(this.formFields);
    }
  }

  findEmptyCell(): { row: number; col: number } | null {
    for (let row = 0; row < this.gridRows; row++) {
      for (let col = 0; col < this.gridCols; col++) {
        if (!this.isCellOccupied(row, col)) {
          return { row, col };
        }
      }
    }
    return null;
  }

  generateFieldId(): string {
    return 'field_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  editField(field: FormFieldWithPosition) {
    this.fieldEdit.emit(field);
  }

  removeField(field: FormFieldWithPosition) {
    const index = this.formFields.findIndex(f => f.id === field.id);
    if (index > -1) {
      this.formFields.splice(index, 1);
      this.fieldsChange.emit(this.formFields);
      
      if (this.selectedField?.id === field.id) {
        this.selectedField = null;
        this.fieldSelected.emit(null);
      }
    }
  }

  startResize(event: MouseEvent, field: FormFieldWithPosition, direction: string) {
    if (!this.editMode || !field.gridPosition) return;
    
    event.preventDefault();
    event.stopPropagation();
    
    this.resizing = true;
    this.resizeStartPos = { x: event.clientX, y: event.clientY };
    this.resizeStartSize = { 
      width: field.gridPosition.width, 
      height: field.gridPosition.height 
    };
    
    const onMouseMove = (e: MouseEvent) => {
      if (!this.resizing || !field.gridPosition) return;
      
      const deltaX = e.clientX - this.resizeStartPos.x;
      const deltaY = e.clientY - this.resizeStartPos.y;
      
      // Calculate new size based on direction
      if (direction.includes('e')) {
        const newWidth = Math.max(1, this.resizeStartSize.width + Math.round(deltaX / 100));
        field.gridPosition.width = Math.min(newWidth, this.gridCols - field.gridPosition.col);
      }
      
      if (direction.includes('s')) {
        const newHeight = Math.max(1, this.resizeStartSize.height + Math.round(deltaY / 60));
        field.gridPosition.height = Math.min(newHeight, this.gridRows - field.gridPosition.row);
      }
    };
    
    const onMouseUp = () => {
      this.resizing = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      this.fieldsChange.emit(this.formFields);
    };
    
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  onFieldValueChange(field: FormFieldWithPosition, value: any) {
    // Handle field value changes in preview mode
    if (!this.editMode) {
      // Emit value change or handle form data
    }
  }

  // Native drag-and-drop handlers for component palette integration
  onNativeDragOver(event: DragEvent, cell: GridCell) {
    if (!this.editMode) return;
    
    event.preventDefault();
    event.dataTransfer!.dropEffect = 'copy';
    
    // Update cell drag over state
    cell.isDragOver = true;
  }

  onNativeDragLeave(event: DragEvent, cell: GridCell) {
    if (!this.editMode) return;
    
    // Only clear drag over if we're actually leaving the cell
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const x = event.clientX;
    const y = event.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      cell.isDragOver = false;
    }
  }

  onNativeDrop(event: DragEvent, cell: GridCell) {
    if (!this.editMode) return;
    
    event.preventDefault();
    cell.isDragOver = false;
    
    // Get the component type from the drag data
    const componentType = event.dataTransfer?.getData('text/plain');
    if (!componentType) return;
    
    // Check if cell is already occupied
    if (this.isCellOccupied(cell.row, cell.col)) {
      console.warn('Cannot drop component: cell is already occupied');
      return;
    }
    
    // Create a new form field based on the component type
    const fieldTypeMap: { [key: string]: string } = {
      'text': 'text',
      'email': 'email', 
      'password': 'password',
      'number': 'number',
      'tel': 'tel',
      'url': 'url',
      'textarea': 'textarea',
      'radio': 'radio',
      'checkbox': 'checkbox',
      'date': 'date',
      'time': 'time',
      'datetime-local': 'datetime-local',
      'file': 'file',
      'button': 'button'
    };
    
    const fieldType = fieldTypeMap[componentType] || 'text';
    const fieldName = componentType.charAt(0).toUpperCase() + componentType.slice(1);
    
    const newField: FormFieldWithPosition = {
      id: this.generateFieldId(),
      type: fieldType as any,
      label: `${fieldName} Field`,
      placeholder: `Enter ${fieldName.toLowerCase()}`,
      required: false,
      gridPosition: { row: cell.row, col: cell.col, width: 1, height: 1 }
    };
    
    // Add options for radio, checkbox fields
    if (['radio', 'checkbox'].includes(fieldType)) {
      newField.options = [
        { value: 'option1', label: 'Option 1' },
        { value: 'option2', label: 'Option 2' },
        { value: 'option3', label: 'Option 3' }
      ];
    }
    
    this.formFields.push(newField);
    this.fieldsChange.emit(this.formFields);
    
    // Select the newly created field
    this.selectedField = newField;
    this.fieldSelected.emit(newField);
  }
}
