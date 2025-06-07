import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { UIConfig, UIComponent, FormConfig, FormField } from '../../models/ui-config.interface';
import { ConfigService } from '../../services/config.service';
import { RendererService } from '../../services/renderer.service';
import { NavigationAlignmentService } from '../../services/navigation-alignment.service';

// Import all renderer components
import { HeaderRendererComponent } from '../header-renderer/header-renderer.component';
import { NavigationRendererComponent } from '../navigation-renderer/navigation-renderer.component';
import { DashboardRendererComponent } from '../dashboard-renderer/dashboard-renderer.component';
import { FormRendererComponent } from '../form-renderer/form-renderer.component';
import { FormElementRendererComponent } from '../form-element-renderer/form-element-renderer.component';

@Component({
  selector: 'app-dynamic-renderer',
  standalone: true,
  imports: [
    CommonModule,
    HeaderRendererComponent,
    NavigationRendererComponent,
    DashboardRendererComponent,
    FormRendererComponent,
    FormElementRendererComponent
  ],
  templateUrl: './dynamic-renderer.component.html',
  styleUrl: './dynamic-renderer.component.css'
})
export class DynamicRendererComponent implements OnInit, OnDestroy {
  @Input() config: UIConfig | null = null;
  @Input() configSource?: string;
  @Input() context?: { [key: string]: any };
  @Input() selectedComponent?: UIComponent | null = null;
  @Input() enableSelection: boolean = false;

  @Output() componentClicked = new EventEmitter<UIComponent>();

  currentConfig: UIConfig | null = null;
  isLoading = false;
  error: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private configService: ConfigService,
    private rendererService: RendererService,
    private navigationAlignmentService: NavigationAlignmentService,
    private cdr: ChangeDetectorRef
  ) {}
  ngOnInit(): void {
    console.log('DynamicRenderer: ngOnInit called');
    console.log('DynamicRenderer: Input config:', this.config);
    console.log('DynamicRenderer: Input configSource:', this.configSource);
    console.log('DynamicRenderer: Input context:', this.context);
    
    // Set initial context if provided
    if (this.context) {
      this.rendererService.setContext(this.context);
    }

    // Load configuration
    if (this.config) {
      // Use provided config
      console.log('DynamicRenderer: Using provided config');
      this.loadStaticConfig(this.config);
    } else if (this.configSource) {
      // Load config from source
      console.log('DynamicRenderer: Loading config from source');
      this.loadConfigFromSource(this.configSource);
    } else {
      // Subscribe to config service for changes
      console.log('DynamicRenderer: Subscribing to config changes');
      this.subscribeToConfigChanges();
    }
  }

  /**
   * Get renderer container classes based on navigation position and context
   */
  getRendererClasses(): string {
    const baseClasses = ['dynamic-renderer'];
    const navigationClasses = this.navigationAlignmentService.getNavigationClasses(this.currentConfig);
    
    // Add context-specific classes
    const context = this.getRenderingContext();
    if (context.mode) {
      baseClasses.push(`renderer-${context.mode}`);
    }
    if (context.viewMode) {
      baseClasses.push(`view-${context.viewMode}`);
    }
    
    return [...baseClasses, navigationClasses].filter(c => c).join(' ');
  }

  /**
   * Get content alignment styles for proper spacing around navigation
   */
  getContentAlignmentStyles(): any {
    return this.navigationAlignmentService.getContentAlignmentStyles(this.currentConfig);
  }

  /**
   * Get combined layout and alignment styles
   */
  getCombinedStyles(): any {
    return {
      ...this.getLayoutStyles(),
      ...this.getContentAlignmentStyles()
    };
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load configuration from static object
   */  private loadStaticConfig(config: UIConfig): void {
    console.log('DynamicRenderer: loadStaticConfig called with:', config);
    this.isLoading = true;
    this.error = null;

    this.configService.loadStaticConfig(config)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (loadedConfig) => {
          console.log('DynamicRenderer: Config loaded successfully:', loadedConfig);
          console.log('DynamicRenderer: Components in loaded config:', loadedConfig?.components?.length || 0);
          this.currentConfig = loadedConfig;
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('DynamicRenderer: Configuration loading error:', error);
          this.error = 'Failed to load configuration';
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
  }

  /**
   * Load configuration from source URL
   */
  private loadConfigFromSource(source: string): void {
    this.isLoading = true;
    this.error = null;

    this.configService.loadConfig(source)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (config) => {
          this.currentConfig = config;
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.error = 'Failed to load configuration from source';
          this.isLoading = false;
          console.error('Configuration loading error:', error);
          this.cdr.detectChanges();
        }
      });
  }

  /**
   * Subscribe to configuration changes from service
   */
  private subscribeToConfigChanges(): void {
    this.configService.getCurrentConfig()
      .pipe(takeUntil(this.destroy$))
      .subscribe(config => {
        this.currentConfig = config;
        this.cdr.detectChanges();
      });
  }

  /**
   * Check if component should be rendered
   */
  shouldRenderComponent(component: UIComponent): boolean {
    return this.rendererService.shouldDisplayComponent(component);
  }

  /**
   * Get layout styles for the main container
   */  getLayoutStyles(): { [key: string]: string } {
    if (!this.currentConfig?.layout) {
      return {};
    }

    const layout = this.currentConfig.layout;
    const styles: { [key: string]: string } = {};

    switch (layout.type) {
      case 'grid':
        styles['display'] = 'grid';
        if (layout.columns) {
          styles['grid-template-columns'] = `repeat(${layout.columns}, 1fr)`;
        }
        if (layout.rows) {
          styles['grid-template-rows'] = `repeat(${layout.rows}, minmax(120px, auto))`;
        }
        if (layout.gap) {
          styles['gap'] = layout.gap;
        }
        break;
      case 'flex':
        styles['display'] = 'flex';
        if (layout.direction) {
          styles['flex-direction'] = layout.direction;
        }
        if (layout.justify) {
          styles['justify-content'] = layout.justify;
        }
        if (layout.align) {
          styles['align-items'] = layout.align;
        }
        if (layout.gap) {
          styles['gap'] = layout.gap;
        }
        break;
      case 'stack':
        styles['display'] = 'flex';
        styles['flex-direction'] = layout.direction || 'column';
        if (layout.gap) {
          styles['gap'] = layout.gap;
        }
        break;
    }

    return styles;
  }
  /**
   * Get component styles
   */
  getComponentStyles(component: UIComponent): { [key: string]: string } {
    const props = component.props ?? {};
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
    
    // Also include any existing styles from component.styles
    if (component.styles) {
      Object.assign(styles, component.styles);
    }    // Apply CSS grid positioning if the component has gridPosition
    if (component.gridPosition || component.props?.gridPosition) {
      const gridPos = component.gridPosition || component.props.gridPosition;
      
      // Apply grid positioning styles using col/row (not column/row)
      styles['grid-column'] = `${gridPos.col + 1} / ${gridPos.col + (gridPos.width ?? 1) + 1}`;
      styles['grid-row'] = `${gridPos.row + 1} / ${gridPos.row + (gridPos.height ?? 1) + 1}`;
    }

    // Apply context-specific styling adjustments
    const context = this.getRenderingContext();
    if (context.mode === 'canvas') {
      // Add canvas-specific styling (slightly more spacing for designer)
      if (component.type === 'navigation') {
        styles['transition'] = 'all 0.2s ease';
      }
    } else if (context.mode === 'preview') {
      // Add preview-specific styling (optimized for final presentation)
      if (component.type === 'navigation') {
        styles['position'] = 'sticky';
        styles['top'] = '0';
        styles['z-index'] = '1000';
      }
    }
    
    return this.rendererService.generateStyles(styles);
  }

  /**
   * Handle component events
   */
  onComponentEvent(event: any, component: UIComponent): void {
    console.log('Component event:', event, component);
    // Handle events from child components
    if (event.action) {
      this.rendererService.executeAction(event.action, event.data);
    }
  }

  /**
   * Handle component click for selection
   */
  onComponentClick(component: UIComponent, event: Event): void {
    if (this.enableSelection) {
      event.stopPropagation();
      this.componentClicked.emit(component);
    }
  }

  /**
   * Reload configuration
   */
  reloadConfig(): void {
    if (this.configSource) {
      this.loadConfigFromSource(this.configSource);
    }
  }

  /**
   * Update component in current configuration
   */
  updateComponent(componentId: string, updates: Partial<UIComponent>): void {
    this.configService.updateComponent(componentId, updates);
  }

  /**
   * Get rendering context information
   */
  getRenderingContext(): any {
    return this.context || {};
  }

  /**
   * Check if we're in canvas mode (designer)
   */
  isCanvasMode(): boolean {
    return this.getRenderingContext().mode === 'canvas';
  }

  /**
   * Check if we're in preview mode
   */
  isPreviewMode(): boolean {
    return this.getRenderingContext().mode === 'preview';
  }

  /**
   * Get view mode from context
   */
  getViewMode(): string {
    return this.getRenderingContext().viewMode || 'desktop';
  }

  /**
   * Handle form element button clicks
   */
  onFormElementButtonClick(event: { type: string; config: any }, component: UIComponent): void {
    console.log('Form element button clicked:', event, component);
    
    if (event.type === 'submit') {
      // Handle form submission
      this.onComponentEvent({ action: 'submit', data: component.props }, component);
    } else if (event.type === 'reset') {
      // Handle form reset
      this.onComponentEvent({ action: 'reset', data: component.props }, component);
    } else {
      // Handle custom button click
      this.onComponentEvent({ action: 'buttonClick', data: { ...component.props, buttonType: event.type } }, component);
    }
  }
  /**
   * Handle form element file selection
   */
  onFormElementFileSelected(event: { files: FileList; config: any }, component: UIComponent): void {
    console.log('Form element file selected:', event, component);
    this.onComponentEvent({ action: 'fileSelected', data: { files: event.files, component: component.props } }, component);
  }  /**
   * Get form configuration, converting children to fields if necessary
   */  getFormConfig(component: UIComponent): FormConfig {
    const props = component.props ?? {};

    // If it already has proper fields array with content, return as is
    if (props.fields && Array.isArray(props.fields) && props.fields.length > 0) {
      return props as FormConfig;
    }

    // If it has children array, convert them to fields
    if (component.children && Array.isArray(component.children)) {
      console.log('DynamicRenderer: Converting form with children to FormConfig. Children count:', component.children.length);
      const convertedConfig = this.convertFormComponentToConfig(component);
      console.log('DynamicRenderer: Converted to FormConfig with', convertedConfig.fields.length, 'fields');
      return convertedConfig;
    }

    // Fallback to empty form config
    return {
      title: props.title ?? 'Form',
      description: props.description ?? '',
      fields: [],
      actions: props.actions ?? []
    };
  }  /**
   * Convert form component with children array to FormConfig
   */
  private convertFormComponentToConfig(formComponent: UIComponent): FormConfig {
    const props = formComponent.props ?? {};
    const fields: FormField[] = [];

    // Convert children to FormField objects
    if (formComponent.children && Array.isArray(formComponent.children)) {
      formComponent.children.forEach((child: UIComponent) => {
        if (this.isFormFieldElement(child.type)) {
          const convertedField = this.convertElementToFormField(child);
          fields.push(convertedField);
        }
      });
    }

    // Extract fields from props.fields if they exist
    if (props.fields && Array.isArray(props.fields)) {
      fields.push(...props.fields);
    }

    const finalConfig = {
      title: props.title ?? 'Form',
      description: props.description ?? '',
      fields: fields,
      actions: props.actions ?? []
    };
    
    return finalConfig;
  }

  /**
   * Check if component type is a form field element
   */
  private isFormFieldElement(type: string): boolean {
    return [
      'text-input', 'email-input', 'password-input', 'number-input',
      'textarea', 'checkbox', 'radio', 'date-input', 'file-input', 'text'
    ].includes(type);
  }  /**
   * Convert form element component to FormField configuration
   */
  private convertElementToFormField(element: UIComponent): FormField {
    const props = element.props ?? {};
    
    // Map component type to form field type
    const typeMapping: { [key: string]: string } = {
      'text-input': 'text',
      'email-input': 'email', 
      'password-input': 'password',
      'number-input': 'number',
      'textarea': 'textarea',
      'checkbox': 'checkbox',
      'radio': 'radio',
      'date-input': 'date',
      'file-input': 'file',
      'text': 'text' // Handle 'text' type components in children
    };
    
    const mappedType = typeMapping[element.type] as any ?? 'text';
    
    // Fix grid positioning format: row-start / col-start / row-end / col-end
    let gridColumn: string | undefined;
    if (props.gridPosition) {
      const { row, col, height, width } = props.gridPosition;
      gridColumn = `${row + 1} / ${col + 1} / ${row + height + 1} / ${col + width + 1}`;
    }

    const convertedField: FormField = {
      id: element.id,
      type: mappedType,
      label: props.label ?? props.content ?? 'Field Label', // Use content for text elements
      placeholder: props.placeholder,
      required: props.required ?? false,
      disabled: props.disabled ?? false,
      options: props.options,
      defaultValue: props.defaultValue,
      helpText: props.helpText,
      gridColumn: gridColumn
    };
    
    return convertedField;
  }
}
