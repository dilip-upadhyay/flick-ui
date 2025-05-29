import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { UIConfig, UIComponent } from '../../models/ui-config.interface';
import { ConfigService } from '../../services/config.service';
import { RendererService } from '../../services/renderer.service';
import { NavigationAlignmentService } from '../../services/navigation-alignment.service';

// Import all renderer components
import { HeaderRendererComponent } from '../header-renderer/header-renderer.component';
import { NavigationRendererComponent } from '../navigation-renderer/navigation-renderer.component';
import { DashboardRendererComponent } from '../dashboard-renderer/dashboard-renderer.component';
import { FormRendererComponent } from '../form-renderer/form-renderer.component';

@Component({
  selector: 'app-dynamic-renderer',
  standalone: true,
  imports: [
    CommonModule,
    HeaderRendererComponent,
    NavigationRendererComponent,
    DashboardRendererComponent,
    FormRendererComponent
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
    // Set initial context if provided
    if (this.context) {
      this.rendererService.setContext(this.context);
    }

    // Load configuration
    if (this.config) {
      // Use provided config
      this.loadStaticConfig(this.config);
    } else if (this.configSource) {
      // Load config from source
      this.loadConfigFromSource(this.configSource);
    } else {
      // Subscribe to config service for changes
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
   */
  private loadStaticConfig(config: UIConfig): void {
    this.isLoading = true;
    this.error = null;

    this.configService.loadStaticConfig(config)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (loadedConfig) => {
          this.currentConfig = loadedConfig;
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.error = 'Failed to load configuration';
          this.isLoading = false;
          console.error('Configuration loading error:', error);
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
   */
  getLayoutStyles(): { [key: string]: string } {
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
    
    // Also include any existing styles from component.styles
    if (component.styles) {
      Object.assign(styles, component.styles);
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
}
