import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../shared/material.module';
import { UIConfig, UIComponent, ComponentType } from '../../models/ui-config.interface';
import { DragDropModule, CdkDragDrop, CdkDrag, CdkDropList } from '@angular/cdk/drag-drop';
import { Subject, takeUntil } from 'rxjs';
import { DesignerService } from '../../services/designer.service';
import { NavigationAlignmentService } from '../../services/navigation-alignment.service';
import { DynamicRendererComponent } from '../dynamic-renderer/dynamic-renderer.component';

@Component({
  selector: 'app-designer-canvas',
  standalone: true,
  imports: [CommonModule, MaterialModule, DragDropModule, DynamicRendererComponent],
  template: `
    <div class="canvas-container" #canvasContainer>
      <div 
        class="canvas-viewport" 
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

  constructor(
    private designerService: DesignerService,
    private navigationAlignmentService: NavigationAlignmentService
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
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  trackByComponentId(index: number, component: UIComponent): string {
    return component.id;
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
      'select': 'Select',
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
