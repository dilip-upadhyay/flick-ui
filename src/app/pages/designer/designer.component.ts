import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { MaterialModule } from '../../shared/material.module';
import { DesignerCanvasComponent } from '../../components/designer-canvas/designer-canvas.component';
import { ComponentPaletteComponent } from '../../components/component-palette/component-palette.component';
import { PropertyEditorComponent } from '../../components/property-editor/property-editor.component';
import { DesignerToolbarComponent } from '../../components/designer-toolbar/designer-toolbar.component';
import { ConfigPreviewComponent } from '../../components/config-preview/config-preview.component';
import { AiChatEmbeddedComponent } from '../../components/ai-chat/ai-chat-embedded.component';
import { UIConfig, UIComponent, ComponentType } from '../../models/ui-config.interface';
import { DesignerService } from '../../services/designer.service';
import { FormBuilderService } from '../../services/form-builder.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-designer',
  standalone: true,  imports: [
    CommonModule,
    ReactiveFormsModule,
    MaterialModule,
    DesignerCanvasComponent,
    ComponentPaletteComponent,
    PropertyEditorComponent,
    DesignerToolbarComponent,
    ConfigPreviewComponent,
    AiChatEmbeddedComponent
  ],templateUrl: './designer.component.html',
  styleUrls: ['./designer.component.css']
})
export class DesignerComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

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
  rightSidebarTab: 'properties' | 'ai-chat' = 'properties';
  bottomPanelCollapsed = true;
  
  // Form Builder State
  isFormBuilderActive = false;

  // Injected services
  private readonly designerService: DesignerService = inject(DesignerService);
  private readonly formBuilderService: FormBuilderService = inject(FormBuilderService);
  private readonly fb = inject(FormBuilder);

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
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Toolbar Actions
  onToolbarAction(action: string) {
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
        this.previewLayout();
        break;
      case 'undo':
        this.designerService.undo();
        break;
      case 'redo':
        this.designerService.redo();
        break;      case 'load-test-config':
        this.loadTestConfig();
        break;      case 'load-grid-test':
        this.testLoadGridFormConfig();
        break;
      case 'load-form-field-test':
        this.testLoadFormFieldConfig();
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

  switchRightSidebarTab(tab: 'properties' | 'ai-chat') {
    this.rightSidebarTab = tab;
    // Ensure sidebar is open when switching tabs
    if (this.rightSidebarCollapsed) {
      this.rightSidebarCollapsed = false;
    }
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
    this.designerService.showPreview();
  }  public loadTestConfig() {
    this.designerService.loadTestConfiguration();
  }

  public loadGridTestScenario() {
    this.designerService.loadConfigurationFromAssets('grid-test-scenario.json');
  }

  // TEMPORARY: Test method to load grid form test configuration
  public async testLoadGridFormConfig() {
    await this.designerService.loadGridFormPreviewTest();
  }

  // TEMPORARY: Test method to load form field test configuration
  public async testLoadFormFieldConfig() {
    await this.designerService.loadFormFieldTest();
  }

  // Test method to load form field configuration
  loadTestFormFieldConfig() {
    const testConfig: UIConfig = {
      type: 'layout',
      components: [
        {
          id: 'test-grid',
          type: 'grid',
          props: {
            title: 'Form Fields Test',
            columns: 2,
            gap: '16px'
          },
          children: [
            {
              id: 'text-field-1',
              type: 'text-input',
              props: {
                label: 'First Name',
                placeholder: 'Enter your first name',
                required: true
              }
            },
            {
              id: 'email-field-1', 
              type: 'email-input',
              props: {
                label: 'Email Address',
                placeholder: 'Enter your email',
                required: true
              }
            },
            {
              id: 'number-field-1',
              type: 'number-input', 
              props: {
                label: 'Age',
                placeholder: 'Enter your age',
                required: false
              }
            },
            {
              id: 'textarea-field-1',
              type: 'textarea',
              props: {
                label: 'Comments', 
                placeholder: 'Enter any comments',
                rows: 3,
                required: false
              }
            }
          ]
        }
      ],
      layout: {
        type: 'stack',
        direction: 'column'
      },
      metadata: {
        title: 'Form Fields Test Layout'
      }
    };

    this.designerService.loadConfig(testConfig);
  }
}
