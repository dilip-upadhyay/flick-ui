import { Component, Input, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { UIConfig, UIComponent } from '../../models/ui-config.interface';
import { ConfigService } from '../../services/config.service';
import { RendererService } from '../../services/renderer.service';

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

  currentConfig: UIConfig | null = null;
  isLoading = false;
  error: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private configService: ConfigService,
    private rendererService: RendererService,
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
}
