import { Component, OnInit, OnDestroy, OnChanges, SimpleChanges, Input, Output, EventEmitter, ViewChild, ElementRef, inject } from '@angular/core';
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
  templateUrl: './designer-canvas.component.html',
  styleUrls: ['./designer-canvas.component.css']
})
export class DesignerCanvasComponent implements OnInit, OnDestroy, OnChanges {
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
    // Ensure we have a basic configuration without forcing grid layout
    this.ensureBasicConfiguration();
    
    // Subscribe to config changes from designer service as well as input changes
    this.designerService.getCurrentConfig()
      .pipe(takeUntil(this.destroy$))
      .subscribe(config => {
        if (config && config !== this.config) {
          this.config = config;
          this.ensureBasicConfiguration();
          this.generateGridCells();
          this.initializeComponentPositions();
        }
      });
    
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
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['config']) {
      if (changes['config'].currentValue) {
        this.ensureBasicConfiguration();
        this.generateGridCells();
        this.initializeComponentPositions();
      }
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  trackByComponentId(index: number, component: UIComponent): string {
    return component.id;
  }
  // Method to ensure we have a basic configuration (without forcing grid layout)
  ensureBasicConfiguration() {
    if (!this.config) {
      this.config = {
        type: 'layout',
        components: []
      };
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
    console.log('onGridSettingsChange called with:', {
      gridCols: this.gridCols,
      gridRows: this.gridRows,
      gridGap: this.gridGap
    });
    
    this.generateGridCells();
    
    // Update the configuration's layout properties
    if (this.config) {      if (!this.config.layout) {
        this.config.layout = {
          type: 'grid',
          columns: this.gridCols,
          rows: this.gridRows,
          gap: `${this.gridGap}px`
        };
      } else {
        this.config.layout.columns = this.gridCols;
        this.config.layout.rows = this.gridRows;
        this.config.layout.gap = `${this.gridGap}px`;
      }
      
      console.log('Updated config layout:', this.config.layout);
      
      // Adjust component positions if they're outside the new grid
      if (this.config.components) {
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
      
      // Persist the updated configuration through the DesignerService
      this.designerService.updateConfig(this.config);
      console.log('Configuration updated through DesignerService');
    }
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

  onFormGridSettingsChange(settings: { columns: number; rows: number; gap: number }): void {
    console.log('Form grid settings changed:', settings);
    
    if (!this.formBuilderState?.activeForm) {
      return;
    }

    // Update the form's layout configuration
    if (!this.formBuilderState.activeForm.props) {
      this.formBuilderState.activeForm.props = {};
    }
    
    if (!this.formBuilderState.activeForm.props.layout) {
      this.formBuilderState.activeForm.props.layout = { type: 'grid' };
    }
    
    // Update layout properties
    this.formBuilderState.activeForm.props.layout = {
      type: 'grid',
      columns: settings.columns,
      rows: settings.rows,
      gap: `${settings.gap}px`
    };    console.log('Updated form layout:', this.formBuilderState.activeForm.props.layout);

    // Update the form through the designer service
    this.designerService.updateComponent(this.formBuilderState.activeForm);
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

  getFormLayoutCols(): number {
    const layout = this.formBuilderState?.activeForm?.props?.layout;
    return layout?.columns || 1;
  }

  getFormLayoutRows(): number {
    const layout = this.formBuilderState?.activeForm?.props?.layout;
    return layout?.rows || 1;
  }

  getFormLayoutGap(): number {
    const layout = this.formBuilderState?.activeForm?.props?.layout;
    const gap = layout?.gap || '10px';
    return parseInt(gap.replace('px', ''), 10) || 10;
  }
}
