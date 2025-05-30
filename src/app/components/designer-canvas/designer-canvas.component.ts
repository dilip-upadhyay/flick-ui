import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../shared/material.module';
import { UIConfig, UIComponent, ComponentType } from '../../models/ui-config.interface';
import { DragDropModule, CdkDragDrop, CdkDrag, CdkDropList } from '@angular/cdk/drag-drop';
import { Subject, takeUntil } from 'rxjs';
import { DesignerService } from '../../services/designer.service';
import { NavigationAlignmentService } from '../../services/navigation-alignment.service';
import { FormBuilderService, FormBuilderState } from '../../services/form-builder.service';
import { DynamicRendererComponent } from '../dynamic-renderer/dynamic-renderer.component';
import { FormGridLayoutComponent, FormFieldWithPosition } from '../form-grid-layout/form-grid-layout.component';
import { FormElementConfig } from '../form-element-renderer/form-element-renderer.component';
import { MatButtonToggleChange } from '@angular/material/button-toggle';

@Component({
  selector: 'app-designer-canvas',
  standalone: true,
  imports: [CommonModule, MaterialModule, DragDropModule, DynamicRendererComponent, FormGridLayoutComponent],
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

      <!-- Regular Canvas Mode -->
      <div 
        class="canvas-viewport" 
        *ngIf="!isFormBuilderMode"
        [class.desktop]="viewMode === 'desktop'"
        [class.tablet]="viewMode === 'tablet'"
        [class.mobile]="viewMode === 'mobile'"
        [ngClass]="getCanvasClasses()"
        [ngStyle]="getCanvasAlignmentStyles()"
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

  constructor(
    private designerService: DesignerService,
    private navigationAlignmentService: NavigationAlignmentService,
    private formBuilderService: FormBuilderService
  ) {}

  ngOnInit() {
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
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  trackByComponentId(index: number, component: UIComponent): string {
    return component.id;
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

  onNativeDrop(event: DragEvent) {
    event.preventDefault();
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

  // Simplified helper methods for backward compatibility
  getComponentLabel(component: UIComponent): string {
    const labels: Partial<Record<ComponentType, string>> = {
      container: 'Container',
      grid: 'Grid Layout',
      header: 'Header',
      navigation: 'Navigation',
      text: 'Text',
      card: 'Card',
      button: 'Button',
      form: 'Form',
      image: 'Image',
      chart: 'Chart',
      modal: 'Modal',
      tabs: 'Tabs',
      accordion: 'Accordion',
      dashboard: 'Dashboard',
      // Form elements
      'text-input': 'Text Input',
      'email-input': 'Email Input',
      'password-input': 'Password Input',
      'number-input': 'Number Input',
      'textarea': 'Textarea',
      'checkbox': 'Checkbox',
      'radio': 'Radio Button',
      'date-input': 'Date Input',
      'file-input': 'File Input',
      'submit-button': 'Submit Button',
      'reset-button': 'Reset Button'
    };
    return labels[component.type] || component.type;
  }

  getCanvasClasses(): string {
    const baseClasses = ['canvas-viewport'];
    const navigationClasses = this.navigationAlignmentService.getNavigationClasses(this.config);
    return [...baseClasses, navigationClasses].filter(c => c).join(' ');
  }

  /**
   * Get canvas alignment styles using the shared service
   */
  getCanvasAlignmentStyles(): any {
    return this.navigationAlignmentService.getCanvasAlignmentStyles(this.config);
  }
}
