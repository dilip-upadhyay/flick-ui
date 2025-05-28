import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../shared/material.module';
import { UIConfig, UIComponent, ComponentType } from '../../models/ui-config.interface';
import { DragDropModule, CdkDragDrop, CdkDrag, CdkDropList } from '@angular/cdk/drag-drop';
import { Subject, takeUntil } from 'rxjs';
import { DesignerService } from '../../services/designer.service';

@Component({
  selector: 'app-designer-canvas',
  standalone: true,
  imports: [CommonModule, MaterialModule, DragDropModule],
  template: `
    <div class="canvas-container" #canvasContainer>
      <div 
        class="canvas-viewport" 
        [class.desktop]="viewMode === 'desktop'"
        [class.tablet]="viewMode === 'tablet'"
        [class.mobile]="viewMode === 'mobile'"
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

        <!-- Render components -->
        <div 
          *ngFor="let component of config?.components; let i = index; trackBy: trackByComponentId"
          class="canvas-component"
          [class.selected]="isComponentSelected(component)"
          [class.hover]="hoveredComponent === component"
          [attr.data-component-id]="component.id"
          [attr.data-component-type]="component.type"
          (click)="onComponentClick(component, $event)"
          (mouseenter)="onComponentHover(component)"
          (mouseleave)="onComponentHoverEnd()">
          
          <!-- Component selection overlay -->
          <div class="component-overlay" *ngIf="isComponentSelected(component)">
            <div class="selection-handles">
              <div class="handle top-left"></div>
              <div class="handle top-right"></div>
              <div class="handle bottom-left"></div>
              <div class="handle bottom-right"></div>
            </div>
            
            <div class="component-toolbar">
              <span class="component-label">{{ getComponentLabel(component) }}</span>
              <button mat-icon-button (click)="onDeleteComponent(component, $event)" class="delete-btn">
                <mat-icon>delete</mat-icon>
              </button>
              <button mat-icon-button (click)="onDuplicateComponent(component, $event)" class="duplicate-btn">
                <mat-icon>content_copy</mat-icon>
              </button>
            </div>
          </div>

          <!-- Component preview -->
          <div class="component-preview" 
               [attr.data-type]="component.type"
               [ngSwitch]="component.type" 
               [ngStyle]="getComponentStyles(component)">
            <!-- Container -->
            <div *ngSwitchCase="'container'" class="preview-container">
              <div class="container-header" *ngIf="component.props?.title">
                {{ component.props.title }}
              </div>
              <div 
                class="container-content"
                cdkDropList
                [cdkDropListData]="component.children || []"
                (cdkDropListDropped)="onChildComponentDropped($event, component)"
                (dragover)="onDragOver($event)"
                (drop)="onNativeChildDrop($event, component)"
                (dragenter)="onDragEnter($event)"
                (dragleave)="onDragLeave($event)">
                
                <div class="drop-zone" *ngIf="!component.children?.length">
                  <mat-icon>add</mat-icon>
                  <span>Drop components here</span>
                </div>

                <div 
                  *ngFor="let child of component.children; trackBy: trackByComponentId"
                  class="child-component"
                  [class.selected]="isComponentSelected(child)"
                  (click)="onComponentClick(child, $event)">
                  <ng-container [ngTemplateOutlet]="componentPreview" [ngTemplateOutletContext]="{component: child}"></ng-container>
                </div>
              </div>
            </div>

            <!-- Grid -->
            <div *ngSwitchCase="'grid'" class="preview-grid">
              <div class="grid-header">
                <mat-icon>grid_view</mat-icon>
                {{ component.props?.title || 'Grid Layout' }}
              </div>
              <div class="grid-content" 
                   [style.grid-template-columns]="getGridColumns(component)"
                   [style.gap]="component.props?.gap || '16px'">
                <div 
                  *ngFor="let child of component.children; let i = index; trackBy: trackByComponentId"
                  class="grid-item"
                  [class.selected]="isComponentSelected(child)"
                  (click)="onComponentClick(child, $event)">
                  <ng-container [ngTemplateOutlet]="componentPreview" [ngTemplateOutletContext]="{component: child}"></ng-container>
                </div>
                <div class="grid-placeholder" *ngIf="!component.children?.length">
                  <mat-icon>add</mat-icon>
                  <span>Add grid items</span>
                </div>
              </div>
            </div>

            <!-- Text -->
            <div *ngSwitchCase="'text'" class="preview-text">
              <div [innerHTML]="component.props?.content || 'Sample text content'"></div>
            </div>

            <!-- Button -->
            <div *ngSwitchCase="'button'" class="preview-button">
              <button mat-raised-button 
                      [color]="component.props?.color || 'primary'"
                      [disabled]="component.props?.disabled">
                {{ component.props?.text || 'Button' }}
              </button>
            </div>

            <!-- Card -->
            <div *ngSwitchCase="'card'" class="preview-card">
              <mat-card>
                <mat-card-header *ngIf="component.props?.title">
                  <mat-card-title>{{ component.props.title }}</mat-card-title>
                  <mat-card-subtitle *ngIf="component.props?.subtitle">
                    {{ component.props.subtitle }}
                  </mat-card-subtitle>
                </mat-card-header>
                <mat-card-content>
                  <div *ngIf="component.children?.length; else cardPlaceholder"
                       cdkDropList
                       [cdkDropListData]="component.children || []"
                       (cdkDropListDropped)="onChildComponentDropped($event, component)"
                       (dragover)="onDragOver($event)"
                       (drop)="onNativeChildDrop($event, component)"
                       (dragenter)="onDragEnter($event)"
                       (dragleave)="onDragLeave($event)">
                    <div *ngFor="let child of component.children; trackBy: trackByComponentId"
                         class="card-child"
                         [class.selected]="isComponentSelected(child)"
                         (click)="onComponentClick(child, $event)">
                      <ng-container [ngTemplateOutlet]="componentPreview" [ngTemplateOutletContext]="{component: child}"></ng-container>
                    </div>
                  </div>
                  <ng-template #cardPlaceholder>
                    <div class="card-placeholder"
                         (dragover)="onDragOver($event)"
                         (drop)="onNativeChildDrop($event, component)"
                         (dragenter)="onDragEnter($event)"
                         (dragleave)="onDragLeave($event)">
                      <mat-icon>add</mat-icon>
                      <span>Add content to card</span>
                    </div>
                  </ng-template>
                </mat-card-content>
              </mat-card>
            </div>

            <!-- Form -->
            <div *ngSwitchCase="'form'" class="preview-form">
              <div class="form-header">
                <mat-icon>assignment</mat-icon>
                {{ component.props?.title || 'Form' }}
              </div>
              <div class="form-fields">
                <div *ngFor="let field of component.props?.fields || getDefaultFormFields()" 
                     class="form-field">
                  <mat-form-field appearance="outline">
                    <mat-label>{{ field.label }}</mat-label>
                    <input matInput [type]="field.type" [placeholder]="field.placeholder">
                  </mat-form-field>
                </div>
                <button mat-raised-button color="primary">
                  {{ component.props?.submitText || 'Submit' }}
                </button>
              </div>
            </div>

            <!-- Navigation -->
            <div *ngSwitchCase="'navigation'" class="preview-navigation">
              <mat-toolbar color="primary">
                <span>{{ component.props?.brand || 'Brand' }}</span>
                <span class="spacer"></span>
                <button mat-button *ngFor="let item of component.props?.items || getDefaultNavItems()">
                  {{ item.label }}
                </button>
              </mat-toolbar>
            </div>

            <!-- Header -->
            <div *ngSwitchCase="'header'" class="preview-header">
              <div class="header-content">
                <h1>{{ component.props?.title || 'Page Title' }}</h1>
                <p *ngIf="component.props?.subtitle">{{ component.props.subtitle }}</p>
              </div>
            </div>

            <!-- Image -->
            <div *ngSwitchCase="'image'" class="preview-image">
              <img [src]="component.props?.src || '/assets/placeholder-image.png'" 
                   [alt]="component.props?.alt || 'Image'"
                   [style.width]="component.props?.width || '100%'"
                   [style.height]="component.props?.height || 'auto'">
            </div>

            <!-- Default preview for other components -->
            <div *ngSwitchDefault class="preview-default">
              <mat-icon>{{ getComponentIcon(component.type) }}</mat-icon>
              <span>{{ getComponentLabel(component) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Component preview template for recursion -->
    <ng-template #componentPreview let-component="component">
      <div class="nested-component" [ngSwitch]="component.type">
        <div *ngSwitchCase="'text'" [innerHTML]="component.props?.content || 'Text'"></div>
        <button *ngSwitchCase="'button'" mat-button>{{ component.props?.text || 'Button' }}</button>
        <div *ngSwitchDefault class="nested-default">
          <mat-icon>{{ getComponentIcon(component.type) }}</mat-icon>
          <span>{{ getComponentLabel(component) }}</span>
        </div>
      </div>
    </ng-template>
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

  constructor(private designerService: DesignerService) {}

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

  onComponentClick(component: UIComponent, event: Event) {
    event.stopPropagation();
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

  getComponentLabel(component: UIComponent): string {
    const labels: Record<ComponentType, string> = {
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
      dashboard: 'Dashboard'
    };
    return labels[component.type] || component.type;
  }

  getComponentIcon(type: ComponentType): string {
    const icons: Record<ComponentType, string> = {
      container: 'crop_free',
      grid: 'grid_view',
      header: 'title',
      navigation: 'menu',
      text: 'text_fields',
      card: 'featured_play_list',
      button: 'smart_button',
      form: 'assignment',
      image: 'image',
      chart: 'bar_chart',
      modal: 'open_in_new',
      tabs: 'tab',
      accordion: 'expand_more',
      dashboard: 'dashboard'
    };
    return icons[type] || 'widgets';
  }

  getGridColumns(component: UIComponent): string {
    const columns = component.props?.columns || 2;
    return `repeat(${columns}, 1fr)`;
  }

  getDefaultFormFields() {
    return [
      { label: 'Name', type: 'text', placeholder: 'Enter your name' },
      { label: 'Email', type: 'email', placeholder: 'Enter your email' }
    ];
  }

  getDefaultNavItems() {
    return [
      { label: 'Home', href: '#' },
      { label: 'About', href: '#' },
      { label: 'Contact', href: '#' }
    ];
  }

  /**
   * Get component styles for design-time preview
   */
  getComponentStyles(component: UIComponent): { [key: string]: string } {
    const props = component.props || {};
    const styles: { [key: string]: any } = {};
    
    // Extract layout and style properties from props
    const styleProps = [
      'width', 'height', 'margin', 'padding', 'backgroundColor', 'textColor', 
      'borderRadius', 'boxShadow', 'border', 'display', 'flexDirection',
      'justifyContent', 'alignItems', 'gap', 'gridTemplateColumns'
    ];
    
    styleProps.forEach(prop => {
      if (props[prop] !== undefined && props[prop] !== null && props[prop] !== '') {
        styles[prop] = props[prop];
      }
    });
    
    // Convert to CSS styles
    const cssStyles: { [key: string]: string } = {};
    Object.keys(styles).forEach(key => {
      // Convert camelCase to kebab-case for CSS properties
      const cssProperty = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      cssStyles[cssProperty] = styles[key];
    });
    
    return cssStyles;
  }
}
