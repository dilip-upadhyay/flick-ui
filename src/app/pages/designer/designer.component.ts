import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MaterialModule } from '../../shared/material.module';
import { DesignerCanvasComponent } from '../../components/designer-canvas/designer-canvas.component';
import { ComponentPaletteComponent } from '../../components/component-palette/component-palette.component';
import { PropertyEditorComponent } from '../../components/property-editor/property-editor.component';
import { DesignerToolbarComponent } from '../../components/designer-toolbar/designer-toolbar.component';
import { ConfigPreviewComponent } from '../../components/config-preview/config-preview.component';
import { UIConfig, UIComponent, ComponentType } from '../../models/ui-config.interface';
import { DesignerService } from '../../services/designer.service';
import { FormBuilderService } from '../../services/form-builder.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-designer',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MaterialModule,
    DesignerCanvasComponent,
    ComponentPaletteComponent,
    PropertyEditorComponent,
    DesignerToolbarComponent,
    ConfigPreviewComponent
  ],
  template: `
    <div class="designer-container">
      <!-- Designer Header -->
      <div class="designer-header">
        <div class="designer-title">
          <mat-icon>design_services</mat-icon>
          <h1>Visual Layout Designer</h1>
          <span class="subtitle">Drag & Drop Interface Builder</span>

          <!-- Move toolbar controls here, right-aligned -->
          <span class="designer-header-toolbar">
            <app-designer-toolbar
              [hasChanges]="hasUnsavedChanges"
              [viewMode]="viewMode"
              [zoomLevel]="zoomLevel"
              (viewModeChange)="onViewModeChange($event)"
              (zoomLevelChange)="onZoomLevelChanged($event)"
              (action)="onToolbarAction($event)">
            </app-designer-toolbar>
          </span>
        </div>
      </div>

      <!-- Designer Layout -->
      <div class="designer-layout">
        <!-- Left Sidebar - Component Palette -->
        <div class="designer-sidebar left-sidebar" [class.collapsed]="leftSidebarCollapsed">
          <div class="sidebar-header">
            <h3>Components</h3>
            <button mat-icon-button (click)="toggleLeftSidebar()">
              <mat-icon>{{ leftSidebarCollapsed ? 'chevron_right' : 'chevron_left' }}</mat-icon>
            </button>
          </div>
          
          <div class="sidebar-content" *ngIf="!leftSidebarCollapsed">
            <app-component-palette
              (componentSelected)="onComponentSelected($event)">
            </app-component-palette>
          </div>
        </div>

        <!-- Center - Design Canvas -->
        <div class="designer-canvas-area">
          <div class="canvas-container" [style.transform]="'scale(' + zoomLevel/100 + ')'">
            <app-designer-canvas
              [config]="currentConfig"
              [selectedComponent]="selectedComponent"
              [viewMode]="viewMode"
              (componentSelected)="onCanvasComponentSelected($event)"
              (componentUpdated)="onComponentUpdated($event)"
              (componentDeleted)="onComponentDeleted($event)"
              (componentAdded)="onComponentAdded($event)">
            </app-designer-canvas>
          </div>
        </div>

        <!-- Right Sidebar - Properties Panel -->
        <div class="designer-sidebar right-sidebar" [class.collapsed]="rightSidebarCollapsed">
          <div class="sidebar-header">
            <h3>Properties</h3>
            <button mat-icon-button (click)="toggleRightSidebar()">
              <mat-icon>{{ rightSidebarCollapsed ? 'chevron_left' : 'chevron_right' }}</mat-icon>
            </button>
          </div>
          
          <div class="sidebar-content" *ngIf="!rightSidebarCollapsed">
            <!-- Property Editor - shown for all components -->
            <app-property-editor
              [selectedComponent]="selectedComponent"
              [config]="currentConfig"
              (propertyChanged)="onPropertyChanged($event)">
            </app-property-editor>
          </div>
        </div>
      </div>

      <!-- Bottom Panel - Code Preview (Collapsible) -->
      <div class="designer-bottom-panel" [class.collapsed]="bottomPanelCollapsed">
        <div class="panel-header">
          <div class="panel-title">
            <mat-icon>code</mat-icon>
            <span>Configuration Preview</span>
          </div>
          <button mat-icon-button (click)="toggleBottomPanel()">
            <mat-icon>{{ bottomPanelCollapsed ? 'expand_less' : 'expand_more' }}</mat-icon>
          </button>
        </div>
        
        <div class="panel-content" *ngIf="!bottomPanelCollapsed">
          <app-config-preview
            [config]="currentConfig"
            (configImported)="onConfigImported($event)">
          </app-config-preview>
        </div>
      </div>
    </div>

    <!-- Dialogs and overlays will be handled by individual components -->
  `,
  styleUrls: ['./designer.component.css']
})
export class DesignerComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  currentConfig: UIConfig = {
    type: 'layout',
    components: [],
    layout: {
      type: 'stack',
      direction: 'column'
    },
    metadata: {
      title: 'New Layout'
    }
  };

  selectedComponent: UIComponent | null = null;
  viewMode: 'desktop' | 'tablet' | 'mobile' = 'desktop';
  zoomLevel = 100;
  hasUnsavedChanges = false;

  // UI State
  leftSidebarCollapsed = false;
  rightSidebarCollapsed = false;
  bottomPanelCollapsed = true;
  
  // Form Builder State
  isFormBuilderActive = false;

  // Injected services
  private designerService: DesignerService = inject(DesignerService);
  private formBuilderService: FormBuilderService = inject(FormBuilderService);
  private fb = inject(FormBuilder);

  constructor() {}

  ngOnInit() {
    // Subscribe to designer service updates
    this.designerService.getCurrentConfig()
      .pipe(takeUntil(this.destroy$))
      .subscribe((config: UIConfig) => {
        if (config) {
          this.currentConfig = config;
        }
      });

    this.designerService.getSelectedComponent()
      .pipe(takeUntil(this.destroy$))
      .subscribe((component: UIComponent | null) => {
        this.selectedComponent = component;
        // Toggle form builder when form component is selected
        this.isFormBuilderActive = component?.type === 'form';
        if (this.isFormBuilderActive) {
          this.formBuilderService.setActiveForm(component);
        }
      });

    this.designerService.getHasUnsavedChanges()
      .pipe(takeUntil(this.destroy$))
      .subscribe((hasChanges: boolean) => {
        this.hasUnsavedChanges = hasChanges;
      });

    // TEMPORARY: Test preview functionality after component loads
    setTimeout(() => {
      console.log('TEMP TEST: Testing preview functionality automatically...');
      this.testPreviewFunctionality();
    }, 3000);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Toolbar Actions
  onToolbarAction(action: string) {
    console.log('Designer: onToolbarAction called with:', action);
    switch (action) {
      case 'new':
        this.createNewLayout();
        break;
      case 'save':
        this.saveLayout();
        break;
      case 'load':
        this.loadLayout();
        break;
      case 'export':
        this.exportConfig();
        break;
      case 'preview':
        console.log('Designer: Calling previewLayout()');
        this.previewLayout();
        break;
      case 'undo':
        this.designerService.undo();
        break;
      case 'redo':
        this.designerService.redo();
        break;
      case 'load-test-config':
        this.loadTestConfig();
        break;
    }
  }

  // Component Selection
  onComponentSelected(componentType: ComponentType) {
    // Component will be added when dropped on canvas
    this.designerService.setDraggedComponent(componentType);
  }

  onCanvasComponentSelected(component: UIComponent | null) {
    this.designerService.selectComponent(component);
  }

  // Component Management
  onComponentAdded(event: { component: UIComponent; parent?: UIComponent; index?: number }) {
    this.designerService.addComponent(event.component, event.parent, event.index);
  }

  onComponentUpdated(component: UIComponent) {
    this.designerService.updateComponent(component);
  }

  onComponentDeleted(component: UIComponent) {
    this.designerService.deleteComponent(component);
  }

  onPropertyChanged(event: { component: UIComponent; property: string; value: any }) {
    this.designerService.updateComponentProperty(event.component, event.property, event.value);
  }

  // View Controls
  onViewModeChange(event: any) {
    this.viewMode = event.value;
  }

  onZoomChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.zoomLevel = parseInt(target.value);
  }

  onZoomLevelChanged(value: number) {
    this.zoomLevel = value;
  }

  // Config Management
  onConfigImported(config: UIConfig) {
    this.designerService.loadConfig(config);
  }

  // UI State Management
  toggleLeftSidebar() {
    this.leftSidebarCollapsed = !this.leftSidebarCollapsed;
  }

  toggleRightSidebar() {
    this.rightSidebarCollapsed = !this.rightSidebarCollapsed;
  }

  toggleBottomPanel() {
    this.bottomPanelCollapsed = !this.bottomPanelCollapsed;
  }

  // Layout Operations
  private createNewLayout() {
    if (this.hasUnsavedChanges) {
      // Show confirmation dialog
      const confirmed = confirm('You have unsaved changes. Are you sure you want to create a new layout?');
      if (!confirmed) return;
    }

    this.designerService.createNew();
  }

  private saveLayout() {
    this.designerService.save();
  }

  private loadLayout() {
    // This could open a file picker or show a list of saved layouts
    this.designerService.showLoadDialog();
  }

  private exportConfig() {
    this.designerService.exportConfig();
  }

  private previewLayout() {
    console.log('Designer: previewLayout() called');
    console.log('Designer: Current config:', this.currentConfig);
    this.designerService.showPreview();
  }

  private loadTestConfig() {
    this.designerService.loadTestConfiguration();
  }

  // TEMPORARY: Test method for preview functionality
  private testPreviewFunctionality() {
    console.log('TEMP TEST: Simulating preview button click...');
    this.onToolbarAction('preview');
  }
}
