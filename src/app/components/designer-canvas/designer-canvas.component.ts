import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../shared/material.module';
import { UIConfig, UIComponent, ComponentType } from '../../models/ui-config.interface';
import { DragDropModule, CdkDragDrop, CdkDrag, CdkDropList } from '@angular/cdk/drag-drop';
import { Subject, takeUntil } from 'rxjs';
import { DesignerService } from '../../services/designer.service';
import { NavigationAlignmentService } from '../../services/navigation-alignment.service';
import { FormBuilderService, FormBuilderState } from '../../services/form-builder.service';
import { DynamicRendererComponent } from '../dynamic-renderer/dynamic-renderer.component';
import { FormGridLayoutComponent, FormFieldWithPosition } from '../form-grid-layout/form-grid-layout.component';
import { MatButtonToggleChange } from '@angular/material/button-toggle';

// Grid interfaces similar to form grid layout
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

export interface ComponentWithPosition extends UIComponent {
  gridPosition?: GridPosition;
}

@Component({
  selector: 'app-designer-canvas',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule, DragDropModule, DynamicRendererComponent, FormGridLayoutComponent],
  template: `
    <div class="canvas-container" #canvasContainer>
      <!-- Form Grid Layout Mode -->
      <div class="form-grid-mode" *ngIf="isFormBuilderMode">
        <div class="grid-header">
          <div class="grid-title">
            <mat-icon>grid_view</mat-icon>
            <h3>{{ formBuilderState?.activeForm?.props?.title || 'Form Layout Designer' }}</h3>
          </div>
          
          <div class="grid-controls">
            <mat-button-toggle-group [value]="gridLayoutMode" (change)="onGridLayoutModeChange($event)">
              <mat-button-toggle value="list">
                <mat-icon>list</mat-icon>
                List View
              </mat-button-toggle>
              <mat-button-toggle value="grid">
                <mat-icon>grid_view</mat-icon>
                Grid Layout
              </mat-button-toggle>
            </mat-button-toggle-group>
          </div>
        </div>

        <!-- Grid Layout Canvas -->
        <div class="grid-canvas" *ngIf="gridLayoutMode === 'grid'">
          <app-form-grid-layout
            [formFields]="convertToFormFieldsWithPosition()"
            [editMode]="true"
            [showPalette]="true"
            (fieldsChange)="onGridFieldsChange($event)"
            (fieldSelected)="onGridFieldSelected($event)"
            (fieldEdit)="onGridFieldEdit($event)">
          </app-form-grid-layout>
        </div>

        <!-- List View (Traditional) -->
        <div class="list-canvas" *ngIf="gridLayoutMode === 'list'">
          <div class="form-preview-container" *ngIf="formBuilderState?.activeForm">
            <app-dynamic-renderer 
              [config]="getFormConfig()"
              [selectedComponent]="selectedComponent"
              [enableSelection]="true"
              [context]="{ mode: 'canvas', viewMode: viewMode }"
              (componentClicked)="onComponentClick($event)">
            </app-dynamic-renderer>
          </div>
        </div>
      </div>

      <!-- Enhanced Grid Layout Mode -->
      <div 
        class="enhanced-grid-mode" 
        *ngIf="!isFormBuilderMode && config?.layout?.type === 'grid'"
        [class.desktop]="viewMode === 'desktop'"
        [class.tablet]="viewMode === 'tablet'"
        [class.mobile]="viewMode === 'mobile'"
        [ngClass]="getCanvasClasses()"
        [ngStyle]="getCanvasAlignmentStyles()"
      >
        <!-- Grid Controls -->
        <div class="grid-controls" *ngIf="enableGridControls">
          <mat-card class="controls-card">
            <mat-card-content>
              <div class="grid-settings">
                <mat-form-field appearance="outline" class="grid-input">
                  <mat-label>Columns</mat-label>
                  <input matInput type="number" [(ngModel)]="gridCols" min="1" max="12" (change)="onGridSettingsChange()">
                </mat-form-field>
                
                <mat-form-field appearance="outline" class="grid-input">
                  <mat-label>Rows</mat-label>
                  <input matInput type="number" [(ngModel)]="gridRows" min="1" max="20" (change)="onGridSettingsChange()">
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

                <mat-slide-toggle [(ngModel)]="enableGridControls" (change)="onGridControlsToggle()">
                  Grid Controls
                </mat-slide-toggle>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Enhanced Grid Layout with Cell-based Drop Zones -->
        <div 
          class="enhanced-grid-layout"
          [class.show-grid-lines]="showGridLines"
          [class.edit-mode]="true"
          [ngStyle]="{
            'grid-template-columns': 'repeat(' + gridCols + ', 1fr)',
            'grid-template-rows': 'repeat(' + gridRows + ', minmax(80px, auto))',
            'gap': gridGap + 'px'
          }"
          cdkDropListGroup>
          
          <!-- Grid Cells with Individual Drop Lists -->
          <div 
            *ngFor="let cell of gridCells; let i = index"
            class="enhanced-grid-cell"
            [class.occupied]="isCellOccupied(cell.row, cell.col)"
            [class.drop-target]="true"
            [class.drop-zone-active]="isDragActive"
            [class.native-drag-over]="cell.isDragOver"
            [class.selected-cell]="isSelectedComponentInCell(cell.row, cell.col)"
            [attr.data-row]="cell.row"
            [attr.data-col]="cell.col"
            [id]="'enhanced-grid-cell-' + cell.row + '-' + cell.col"
            cdkDropList
            [cdkDropListData]="getComponentsInCell(cell.row, cell.col)"
            (cdkDropListDropped)="onEnhancedCellDropped($event, cell)"
            (dragover)="onNativeDragOver($event, cell)"
            (dragleave)="onNativeDragLeave($event, cell)"
            (drop)="onNativeDrop($event, cell)"
            (click)="onCellClick(cell, $event)">
            
            <!-- Drop zone indicator -->
            <div class="drop-zone-indicator" *ngIf="!isCellOccupied(cell.row, cell.col)">
              <mat-icon>add</mat-icon>
              <span>Drop here</span>
              <small>{{ cell.row + 1 }},{{ cell.col + 1 }}</small>
            </div>
            
            <!-- Component in this cell -->
            <div 
              *ngFor="let component of getComponentsInCell(cell.row, cell.col)"
              class="cell-component-wrapper"
              [class.selected]="selectedComponent?.id === component.id"
              [class.dragging]="draggingComponent?.id === component.id"
              [ngStyle]="getComponentGridStyle(component)"
              cdkDrag
              [cdkDragData]="component"
              (cdkDragStarted)="onComponentDragStart(component)"
              (cdkDragEnded)="onComponentDragEnd()"
              (click)="onComponentClick(component, $event)">
              
              <!-- Resize handles for selected component -->
              <div class="component-resize-handles" *ngIf="selectedComponent?.id === component.id">
                <div class="resize-handle resize-handle-se" 
                     (mousedown)="startComponentResize($event, component, 'se')"></div>
                <div class="resize-handle resize-handle-e" 
                     (mousedown)="startComponentResize($event, component, 'e')"></div>
                <div class="resize-handle resize-handle-s" 
                     (mousedown)="startComponentResize($event, component, 's')"></div>
              </div>

              <!-- Component content -->
              <div class="component-content">
                <app-dynamic-renderer
                  [config]="{ type: 'layout', components: [component] }"
                  [selectedComponent]="selectedComponent"
                  [enableSelection]="false"
                  [context]="{ mode: 'canvas', viewMode: viewMode, gridCell: { row: cell.row, col: cell.col } }">
                </app-dynamic-renderer>
              </div>

              <!-- Component overlay for edit mode -->
              <div class="component-overlay">
                <div class="component-info">
                  <span class="component-type">{{ component.type }}</span>
                  <span class="component-label">{{ getComponentLabel(component) }}</span>
                </div>
                <div class="component-actions">
                  <button mat-icon-button 
                          size="small"
                          (click)="onComponentClick(component, $event); $event.stopPropagation()">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button 
                          color="warn"
                          size="small"
                          (click)="onDeleteComponent(component, $event); $event.stopPropagation()">
                    <mat-icon>delete</mat-icon>
                  </button>
                  <button mat-icon-button 
                          size="small"
                          (click)="onDuplicateComponent(component, $event); $event.stopPropagation()">
                    <mat-icon>content_copy</mat-icon>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Regular Canvas Mode (NON-GRID layouts only) -->
      <div 
        class="canvas-viewport" 
        *ngIf="!isFormBuilderMode && (!config?.layout || config?.layout?.type !== 'grid')"
        [class.desktop]="viewMode === 'desktop'"
        [class.tablet]="viewMode === 'tablet'"
        [class.mobile]="viewMode === 'mobile'"
        [ngClass]="getCanvasClasses()"
        [ngStyle]="getCanvasAlignmentStyles()"
      >
        <!-- Fallback Grid Layout (should not be reached if enhanced grid mode is working) -->
        <ng-container *ngIf="config?.layout?.type === 'grid' && config?.layout?.columns">
          <div class="main-grid-layout"
               [style.display]="'grid'"
               [style.gridTemplateColumns]="'repeat(' + (config?.layout?.columns || 1) + ', 1fr)'"
               [style.gap]="config?.layout?.gap || '16px'"
               cdkDropListGroup>
            <ng-container *ngFor="let i of gridBlocks; trackBy: trackByIndex">
              <div class="main-grid-block"
                   cdkDropList
                   [id]="'grid-block-' + i"
                   [cdkDropListData]="getGridBlockData(i)"
                   (cdkDropListDropped)="onGridBlockDrop($event, i)"
                   [class.has-component]="!!config?.components?.[i]"
                   [class.drop-zone-active]="isDragActive"
                   (mouseenter)="onGridBlockHover(i)"
                   (mouseleave)="onGridBlockHoverEnd()">
                
                <!-- Component content -->
                <ng-container *ngIf="config?.components?.[i] as comp">
                  <div class="component-content" 
                       [class.selected]="isComponentSelected(comp)"
                       cdkDrag
                       [cdkDragData]="comp"
                       (cdkDragStarted)="onGridDragStarted()"
                       (cdkDragEnded)="onGridDragEnded()">
                    <app-dynamic-renderer
                      [config]="{ type: 'layout', components: [comp] }"
                      [selectedComponent]="selectedComponent"
                      [enableSelection]="true"
                      [context]="{ mode: 'canvas', viewMode: viewMode, gridBlock: i }"
                      (componentClicked)="onComponentClick($event)">
                    </app-dynamic-renderer>
                  </div>
                </ng-container>
                
                <!-- Enhanced empty block placeholder -->
                <div class="empty-block-placeholder" *ngIf="isGridBlockEmpty(i)">
                  <mat-icon>add_circle_outline</mat-icon>
                  <span>Drop Component</span>
                  <small>Block {{ i + 1 }}</small>
                </div>
                
                <!-- Interactive drop zone indicator -->
                <div class="drop-zone-indicator" *ngIf="isDragActive">
                  <mat-icon>file_download</mat-icon>
                  <span>Drop Here</span>
                </div>
              </div>
            </ng-container>
          </div>
        </ng-container>

        <!-- Existing fallback rendering for non-grid layouts -->
        <ng-container *ngIf="!config?.layout || config?.layout?.type !== 'grid'">
          <div 
            cdkDropList
            [cdkDropListData]="config?.components || []"
            (cdkDropListDropped)="onComponentDropped($event)"
            (click)="onCanvasClick($event)"
            (dragover)="onDragOver($event)"
            (drop)="onNativeDrop($event)"
            (dragenter)="onDragEnter($event)"
            (dragleave)="onDragLeave($event)">
            
            <!-- Empty state -->
            <div class="empty-state" *ngIf="!config?.components?.length">
              <mat-icon>web</mat-icon>
              <h3>Start Building Your Layout</h3>
              <p>Drag components from the palette to get started</p>
            </div>

            <!-- Preview-only rendering using dynamic renderer -->
            <div class="preview-container" *ngIf="config?.components?.length">
              <app-dynamic-renderer 
                [config]="config"
                [selectedComponent]="selectedComponent"
                [enableSelection]="true"
                [context]="{ mode: 'canvas', viewMode: viewMode }"
                (componentClicked)="onComponentClick($event)">
              </app-dynamic-renderer>
            </div>
          </div>
        </ng-container>
      </div>
    </div>
  `,
  styleUrls: ['./designer-canvas.component.css']
})
export class DesignerCanvasComponent implements OnInit, OnDestroy {
  @Input() config: UIConfig | null = null;
  @Input() selectedComponent: UIComponent | null = null;
  @Input() viewMode: 'desktop' | 'tablet' | 'mobile' = 'desktop';

  @Output() componentSelected = new EventEmitter<UIComponent | null>();
  @Output() componentUpdated = new EventEmitter<UIComponent>();
  @Output() componentDeleted = new EventEmitter<UIComponent>();
  @Output() componentAdded = new EventEmitter<{component: UIComponent, parent?: UIComponent, index?: number}>();

  @ViewChild('canvasContainer', { static: true }) canvasContainer!: ElementRef;

  private destroy$ = new Subject<void>();
  hoveredComponent: UIComponent | null = null;

  // Form Builder properties
  formBuilderState: FormBuilderState | null = null;
  gridLayoutMode: 'list' | 'grid' = 'grid';
  isFormBuilderMode = false;

  // Enhanced Grid Layout properties
  gridCols: number = 3;
  gridRows: number = 5;
  gridGap: number = 16;
  showGridLines: boolean = true;
  snapToGrid: boolean = true;
  enableGridControls: boolean = true;
  gridCells: GridCell[] = [];
  
  // Interactive grid properties
  isDragActive = false;
  hoveredGridBlock: number | null = null;
  draggingComponent: UIComponent | null = null;
  
  // Resizing state
  private resizing = false;
  private resizeStartPos = { x: 0, y: 0 };
  private resizeStartSize = { width: 1, height: 1 };

  constructor(
    private designerService: DesignerService,
    private navigationAlignmentService: NavigationAlignmentService,
    private formBuilderService: FormBuilderService
  ) {}

  ngOnInit() {
    // Ensure we have a proper grid layout configuration first
    this.ensureGridLayoutConfiguration();
    
    // Subscribe to drag events from component palette
    this.designerService.getDraggedComponent()
      .pipe(takeUntil(this.destroy$))
      .subscribe(componentType => {
        if (componentType) {
          this.handleComponentDrag(componentType);
        }
      });

    // Subscribe to form builder state changes
    this.formBuilderService.getFormBuilderState()
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.formBuilderState = state;
        this.isFormBuilderMode = !!state.activeForm;
      });

    // Initialize enhanced grid
    this.generateGridCells();
    this.initializeComponentPositions();
    
    // Debug grid configuration
    setTimeout(() => this.debugGridConfiguration(), 1000);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  trackByComponentId(index: number, component: UIComponent): string {
    return component.id;
  }

  // Method to ensure we have a grid layout configuration
  ensureGridLayoutConfiguration() {
    if (!this.config) {
      this.config = {
        type: 'layout',
        layout: {
          type: 'grid',
          columns: 3,
          gap: '16px'
        },
        components: []
      };
      console.log('Created default grid configuration:', this.config);
    } else if (!this.config.layout || this.config.layout.type !== 'grid') {
      this.config.layout = {
        type: 'grid',
        columns: 3,
        gap: '16px'
      };
      console.log('Updated layout to grid configuration:', this.config.layout);
    }
    
    // Ensure components array exists
    if (this.config && !this.config.components) {
      this.config.components = [];
    }
  }

  // Enhanced Grid Layout Methods
  generateGridCells() {
    this.gridCells = [];
    for (let row = 0; row < this.gridRows; row++) {
      for (let col = 0; col < this.gridCols; col++) {
        this.gridCells.push({ row, col });
      }
    }
  }

  initializeComponentPositions() {
    // Initialize positions for components that don't have them
    if (this.config?.components) {
      this.config.components.forEach((component, index) => {
        const compWithPos = component as ComponentWithPosition;
        if (!compWithPos.gridPosition) {
          const row = Math.floor(index / this.gridCols);
          const col = index % this.gridCols;
          compWithPos.gridPosition = { row, col, width: 1, height: 1 };
        }
      });
    }
  }

  onGridSettingsChange() {
    this.generateGridCells();
    // Adjust component positions if they're outside the new grid
    if (this.config?.components) {
      this.config.components.forEach(component => {
        const compWithPos = component as ComponentWithPosition;
        if (compWithPos.gridPosition) {
          if (compWithPos.gridPosition.col >= this.gridCols) {
            compWithPos.gridPosition.col = this.gridCols - 1;
          }
          if (compWithPos.gridPosition.row >= this.gridRows) {
            compWithPos.gridPosition.row = this.gridRows - 1;
          }
        }
      });
    }
    // Emit configuration change
    this.componentUpdated.emit(this.config as any);
  }

  onGridControlsToggle() {
    // Just toggle the controls visibility
  }

  isCellOccupied(row: number, col: number): boolean {
    if (!this.config?.components) return false;
    
    return this.config.components.some(component => {
      const compWithPos = component as ComponentWithPosition;
      return compWithPos.gridPosition && 
        compWithPos.gridPosition.row <= row && 
        compWithPos.gridPosition.row + compWithPos.gridPosition.height > row &&
        compWithPos.gridPosition.col <= col && 
        compWithPos.gridPosition.col + compWithPos.gridPosition.width > col;
    });
  }

  getComponentsInCell(row: number, col: number): ComponentWithPosition[] {
    if (!this.config?.components) return [];
    
    return this.config.components.filter(component => {
      const compWithPos = component as ComponentWithPosition;
      return compWithPos.gridPosition && 
        compWithPos.gridPosition.row === row && 
        compWithPos.gridPosition.col === col;
    }) as ComponentWithPosition[];
  }

  isSelectedComponentInCell(row: number, col: number): boolean {
    if (!this.selectedComponent) return false;
    
    const compWithPos = this.selectedComponent as ComponentWithPosition;
    return compWithPos.gridPosition?.row === row && compWithPos.gridPosition?.col === col;
  }

  onCellClick(cell: GridCell, event: Event) {
    const componentsInCell = this.getComponentsInCell(cell.row, cell.col);
    if (componentsInCell.length === 0) {
      this.componentSelected.emit(null);
    }
  }

  onComponentDragStart(component: UIComponent) {
    this.draggingComponent = component;
    this.isDragActive = true;
  }

  onComponentDragEnd() {
    this.draggingComponent = null;
    this.isDragActive = false;
  }

  onEnhancedCellDropped(event: CdkDragDrop<ComponentWithPosition[]>, cell: GridCell) {
    const draggedItem = event.item.data;
    this.isDragActive = false;
    
    if (draggedItem && typeof draggedItem === 'object') {
      if (draggedItem.id) {
        // It's an existing component being moved
        const existingComponent = draggedItem as ComponentWithPosition;
        if (existingComponent.gridPosition) {
          existingComponent.gridPosition.row = cell.row;
          existingComponent.gridPosition.col = cell.col;
          this.componentUpdated.emit(existingComponent);
        }
      } else if (draggedItem.type || typeof draggedItem === 'string') {
        // It's a new component from palette
        const componentType = (typeof draggedItem === 'string' ? draggedItem : draggedItem.type) as ComponentType;
        const newComponent = this.designerService.createComponent(componentType) as ComponentWithPosition;
        newComponent.gridPosition = { row: cell.row, col: cell.col, width: 1, height: 1 };
        
        this.componentAdded.emit({ 
          component: newComponent, 
          index: cell.row * this.gridCols + cell.col 
        });
      }
    }
  }

  getComponentGridStyle(component: ComponentWithPosition): any {
    if (!component.gridPosition) return {};
    
    return {
      'grid-column': `span ${component.gridPosition.width}`,
      'grid-row': `span ${component.gridPosition.height}`
    };
  }

  startComponentResize(event: MouseEvent, component: ComponentWithPosition, direction: string) {
    if (!component.gridPosition) return;
    
    event.preventDefault();
    event.stopPropagation();
    
    this.resizing = true;
    this.resizeStartPos = { x: event.clientX, y: event.clientY };
    this.resizeStartSize = { 
      width: component.gridPosition.width, 
      height: component.gridPosition.height 
    };
    
    const onMouseMove = (e: MouseEvent) => {
      if (!this.resizing || !component.gridPosition) return;
      
      const deltaX = e.clientX - this.resizeStartPos.x;
      const deltaY = e.clientY - this.resizeStartPos.y;
      
      // Calculate new size based on direction
      if (direction.includes('e')) {
        const newWidth = Math.max(1, this.resizeStartSize.width + Math.round(deltaX / 100));
        component.gridPosition.width = Math.min(newWidth, this.gridCols - component.gridPosition.col);
      }
      
      if (direction.includes('s')) {
        const newHeight = Math.max(1, this.resizeStartSize.height + Math.round(deltaY / 60));
        component.gridPosition.height = Math.min(newHeight, this.gridRows - component.gridPosition.row);
      }
    };
    
    const onMouseUp = () => {
      this.resizing = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      this.componentUpdated.emit(component);
    };
    
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  // Native drag-and-drop handlers for enhanced grid
  onNativeDragOver(event: DragEvent, cell: GridCell) {
    event.preventDefault();
    event.dataTransfer!.dropEffect = 'copy';
    cell.isDragOver = true;
  }

  onNativeDragLeave(event: DragEvent, cell: GridCell) {
    // Only clear drag over if we're actually leaving the cell
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const x = event.clientX;
    const y = event.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      cell.isDragOver = false;
    }
  }

  // Form Builder methods
  getFormConfig(): any {
    if (this.formBuilderState?.activeForm) {
      return { type: 'layout', components: [this.formBuilderState.activeForm] };
    }
    return { type: 'layout', components: [] };
  }

  onGridLayoutModeChange(event: MatButtonToggleChange): void {
    this.gridLayoutMode = event.value;
  }

  convertToFormFieldsWithPosition(): FormFieldWithPosition[] {
    if (!this.formBuilderState?.formElements) {
      return [];
    }

    return this.formBuilderState.formElements.map(element => ({
      id: element.id,
      type: element.type as any,
      label: element.props?.label || this.getComponentLabel(element),
      placeholder: element.props?.placeholder || '',
      required: element.props?.required || false,
      disabled: element.props?.disabled || false,
      defaultValue: element.props?.defaultValue || element.props?.value || '',
      options: element.props?.options || [],
      gridPosition: element.props?.gridPosition || { row: 0, col: 0, width: 1, height: 1 }
    }));
  }

  onGridFieldsChange(fields: FormFieldWithPosition[]): void {
    if (!this.formBuilderState?.activeForm) {
      return;
    }

    // Convert grid fields back to UIComponents
    const updatedElements = fields.map(field => {
      const existingElement = this.formBuilderState?.formElements.find(el => el.id === field.id);
      if (existingElement) {
        return {
          ...existingElement,
          props: {
            ...existingElement.props,
            label: field.label,
            placeholder: field.placeholder,
            required: field.required,
            disabled: field.disabled,
            defaultValue: field.defaultValue,
            options: field.options,
            gridPosition: field.gridPosition
          }
        };
      }
      
      // Create new element if not found
      const newComponent = this.designerService.createComponent(field.type as ComponentType);
      return {
        ...newComponent,
        props: {
          ...newComponent.props,
          label: field.label,
          placeholder: field.placeholder,
          required: field.required,
          disabled: field.disabled,
          defaultValue: field.defaultValue,
          options: field.options,
          gridPosition: field.gridPosition
        }
      };
    });

    // Update the form builder service
    this.formBuilderService.setFormElements(updatedElements);
  }

  onGridFieldSelected(field: FormFieldWithPosition | null): void {
    if (!field || !this.formBuilderState?.formElements) {
      return;
    }

    const component = this.formBuilderState.formElements.find(el => el.id === field.id);
    if (component) {
      this.componentSelected.emit(component);
    }
  }

  onGridFieldEdit(field: FormFieldWithPosition | null): void {
    if (!field || !this.formBuilderState?.formElements) {
      return;
    }

    const component = this.formBuilderState.formElements.find(el => el.id === field.id);
    if (component) {
      this.componentSelected.emit(component);
    }
  }

  isComponentSelected(component: UIComponent): boolean {
    return this.selectedComponent?.id === component.id;
  }

  onCanvasClick(event: Event) {
    event.stopPropagation();
    this.componentSelected.emit(null);
  }

  onComponentClick(component: UIComponent, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.componentSelected.emit(component);
  }

  onComponentHover(component: UIComponent) {
    this.hoveredComponent = component;
  }

  onComponentHoverEnd() {
    this.hoveredComponent = null;
  }

  onDeleteComponent(component: UIComponent, event: Event) {
    event.stopPropagation();
    this.componentDeleted.emit(component);
  }

  onDuplicateComponent(component: UIComponent, event: Event) {
    event.stopPropagation();
    const duplicatedComponent = this.designerService.duplicateComponent(component);
    this.componentAdded.emit({ component: duplicatedComponent });
  }

  onComponentDropped(event: CdkDragDrop<UIComponent[]>) {
    if (event.previousContainer === event.container) {
      // Reordering within the same container
      this.designerService.moveComponent(
        event.item.data,
        undefined,
        event.currentIndex
      );
    } else {
      // Adding new component from palette
      const componentType = event.item.data as ComponentType;
      const newComponent = this.designerService.createComponent(componentType);
      this.componentAdded.emit({ 
        component: newComponent, 
        index: event.currentIndex 
      });
    }
  }

  onChildComponentDropped(event: CdkDragDrop<UIComponent[]>, parent: UIComponent) {
    if (event.previousContainer === event.container) {
      // Reordering within the same parent
      this.designerService.moveComponent(
        event.item.data,
        parent,
        event.currentIndex
      );
    } else {
      // Adding new component to parent
      const componentType = event.item.data as ComponentType;
      const newComponent = this.designerService.createComponent(componentType);
      this.componentAdded.emit({ 
        component: newComponent, 
        parent: parent, 
        index: event.currentIndex 
      });
    }
  }

  // Native drag and drop handlers for component palette
  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.dataTransfer!.dropEffect = 'copy';
  }

  onDragEnter(event: DragEvent) {
    event.preventDefault();
    // Add visual feedback for drag over
    const canvas = event.currentTarget as HTMLElement;
    canvas.classList.add('drag-over');
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    // Remove visual feedback
    const canvas = event.currentTarget as HTMLElement;
    canvas.classList.remove('drag-over');
  }

  onNativeDrop(event: DragEvent, cell?: GridCell) {
    event.preventDefault();
    
    if (cell) {
      // Enhanced grid mode
      cell.isDragOver = false;
      
      // Get the component type from the drag data
      const componentType = event.dataTransfer?.getData('text/plain') as ComponentType;
      if (!componentType) return;
      
      // Check if cell is already occupied
      if (this.isCellOccupied(cell.row, cell.col)) {
        console.warn('Cannot drop component: cell is already occupied');
        return;
      }
      
      // Create a new component with grid position
      const newComponent = this.designerService.createComponent(componentType) as ComponentWithPosition;
      newComponent.gridPosition = { row: cell.row, col: cell.col, width: 1, height: 1 };
      
      this.componentAdded.emit({ 
        component: newComponent, 
        index: cell.row * this.gridCols + cell.col 
      });
      
      // Select the newly created component
      this.componentSelected.emit(newComponent);
    } else {
      // Regular canvas mode
      const canvas = event.currentTarget as HTMLElement;
      canvas.classList.remove('drag-over');
      
      const componentType = event.dataTransfer?.getData('text/plain') as ComponentType;
      if (componentType) {
        const newComponent = this.designerService.createComponent(componentType);
        this.componentAdded.emit({ 
          component: newComponent
        });
      }
    }
  }

  onNativeChildDrop(event: DragEvent, parent: UIComponent) {
    event.preventDefault();
    const dropZone = event.currentTarget as HTMLElement;
    dropZone.classList.remove('drag-over');
    
    const componentType = event.dataTransfer?.getData('text/plain') as ComponentType;
    if (componentType) {
      const newComponent = this.designerService.createComponent(componentType);
      this.componentAdded.emit({ 
        component: newComponent,
        parent: parent
      });
    }
  }

  private handleComponentDrag(componentType: ComponentType) {
    // This will be handled by the drop events
  }

  // Interactive Grid Layout Methods
  trackByIndex(index: number): number {
    return index;
  }

  getGridBlockData(blockIndex: number): UIComponent[] {
    // Return the component at this grid position, or empty array if none
    const component = this.config?.components?.[blockIndex];
    return component ? [component] : [];
  }

  onGridBlockDrop(event: CdkDragDrop<UIComponent[]>, blockIndex: number) {
    this.isDragActive = false;
    
    if (event.previousContainer === event.container) {
      // Reordering within the same grid block - update component position
      if (event.item.data && typeof event.item.data === 'object' && 'id' in event.item.data) {
        const component = event.item.data as UIComponent;
        // Update the component's grid position
        this.designerService.moveComponent(component, undefined, blockIndex);
      }
    } else {
      // Adding new component to grid block or moving from palette
      if (typeof event.item.data === 'string') {
        // New component from palette
        const componentType = event.item.data as ComponentType;
        const newComponent = this.designerService.createComponent(componentType);
        this.componentAdded.emit({ 
          component: newComponent, 
          index: blockIndex 
        });
      } else if (event.item.data && typeof event.item.data === 'object' && 'id' in event.item.data) {
        // Moving existing component to new grid position
        const component = event.item.data as UIComponent;
        this.designerService.moveComponent(component, undefined, blockIndex);
      }
    }
  }

  onGridBlockHover(blockIndex: number) {
    this.hoveredGridBlock = blockIndex;
  }

  onGridBlockHoverEnd() {
    this.hoveredGridBlock = null;
  }

  onGridDragStarted() {
    this.isDragActive = true;
  }

  onGridDragEnded() {
    this.isDragActive = false;
    this.hoveredGridBlock = null;
  }

  get gridBlocks(): number[] {
    const count = this.config?.layout?.columns || 1;
    return Array.from({ length: count }, (_, i) => i);
  }

  // Helper method to check if a grid block is empty
  isGridBlockEmpty(blockIndex: number): boolean {
    const isEmpty = !this.config?.components?.[blockIndex];
    // Debug logging to help troubleshoot visibility issues
    if (blockIndex < 5) { // Only log first 5 blocks to avoid spam
      console.log(`Block ${blockIndex + 1} isEmpty:`, isEmpty, 
                  'config.components:', this.config?.components?.length || 0,
                  'component at index:', this.config?.components?.[blockIndex] || 'undefined');
    }
    return isEmpty;
  }

  // Debug method to help with empty block placeholder visibility issues  
  debugGridConfiguration() {
    console.log('=== GRID DEBUG INFO ===');
    console.log('isFormBuilderMode:', this.isFormBuilderMode);
    console.log('config:', this.config);
    console.log('config?.layout:', this.config?.layout);
    console.log('config?.layout?.type:', this.config?.layout?.type);
    console.log('config?.layout?.columns:', this.config?.layout?.columns);
    console.log('config?.components:', this.config?.components);
    console.log('config?.components?.length:', this.config?.components?.length);
    console.log('gridBlocks array:', this.gridBlocks);
    console.log('Enhanced Grid Mode Condition:', !this.isFormBuilderMode && this.config?.layout?.type === 'grid');
    console.log('Regular Canvas Mode Condition:', !this.isFormBuilderMode && (!this.config?.layout || this.config?.layout?.type !== 'grid'));
    console.log('=====================');
  }

  // Canvas styling and helper methods
  getComponentLabel(component: UIComponent): string {
    // Extract label from component props or provide default based on type
    if (component.props?.label) {
      return component.props.label;
    }
    
    // Provide default labels based on component type
    switch (component.type) {
      case 'text-input':
        return 'Text Input';
      case 'email-input':
        return 'Email Input';
      case 'password-input':
        return 'Password Input';
      case 'number-input':
        return 'Number Input';
      case 'textarea':
        return 'Text Area';
      case 'checkbox':
        return 'Checkbox';
      case 'radio':
        return 'Radio Button';
      case 'date-input':
        return 'Date Input';
      case 'file-input':
        return 'File Input';
      case 'submit-button':
        return 'Submit Button';
      case 'reset-button':
        return 'Reset Button';
      case 'button':
        return 'Button';
      case 'text':
        return 'Text';
      case 'image':
        return 'Image';
      case 'container':
        return 'Container';
      case 'form':
        return 'Form';
      case 'header':
        return 'Header';
      case 'navigation':
        return 'Navigation';
      case 'card':
        return 'Card';
      case 'grid':
        return 'Grid';
      case 'chart':
        return 'Chart';
      case 'dashboard':
        return 'Dashboard';
      case 'modal':
        return 'Modal';
      case 'tabs':
        return 'Tabs';
      case 'accordion':
        return 'Accordion';
      default:
        return (component.type as string).charAt(0).toUpperCase() + (component.type as string).slice(1);
    }
  }

  getCanvasClasses(): { [key: string]: boolean } {
    return {
      'canvas-desktop': this.viewMode === 'desktop',
      'canvas-tablet': this.viewMode === 'tablet',
      'canvas-mobile': this.viewMode === 'mobile',
      'drag-active': this.isDragActive,
      'has-selection': !!this.selectedComponent
    };
  }

  getCanvasAlignmentStyles(): { [key: string]: string } {
    const styles = this.navigationAlignmentService.getCanvasAlignmentStyles(this.config);
    return styles || {};
  }
}
