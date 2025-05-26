import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { UIConfig, UIComponent } from '../models/ui-config.interface';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private configCache = new Map<string, UIConfig>();
  private currentConfig$ = new BehaviorSubject<UIConfig | null>(null);

  constructor(private http: HttpClient) {}

  /**
   * Load UI configuration from a JSON file or API endpoint
   */
  loadConfig(source: string): Observable<UIConfig> {
    // Check cache first
    if (this.configCache.has(source)) {
      const config = this.configCache.get(source)!;
      this.currentConfig$.next(config);
      return of(config);
    }

    // Load from HTTP
    return this.http.get<UIConfig>(source).pipe(
      map(config => {
        // Validate and transform config if needed
        const validatedConfig = this.validateConfig(config);
        this.configCache.set(source, validatedConfig);
        this.currentConfig$.next(validatedConfig);
        return validatedConfig;
      }),
      catchError(error => {
        console.error('Failed to load configuration:', error);
        throw error;
      })
    );
  }

  /**
   * Load configuration from static JSON object
   */
  loadStaticConfig(config: UIConfig): Observable<UIConfig> {
    const validatedConfig = this.validateConfig(config);
    this.currentConfig$.next(validatedConfig);
    return of(validatedConfig);
  }

  /**
   * Get current configuration as observable
   */
  getCurrentConfig(): Observable<UIConfig | null> {
    return this.currentConfig$.asObservable();
  }

  /**
   * Update specific component in current configuration
   */
  updateComponent(componentId: string, updates: Partial<UIComponent>): void {
    const currentConfig = this.currentConfig$.value;
    if (!currentConfig) return;

    const updatedConfig = this.updateComponentInConfig(currentConfig, componentId, updates);
    this.currentConfig$.next(updatedConfig);
  }

  /**
   * Find component by ID in configuration
   */
  findComponent(config: UIConfig, componentId: string): UIComponent | null {
    for (const component of config.components) {
      const found = this.findComponentRecursive(component, componentId);
      if (found) return found;
    }
    return null;
  }

  /**
   * Get components by type
   */
  getComponentsByType(config: UIConfig, type: string): UIComponent[] {
    const components: UIComponent[] = [];
    this.collectComponentsByType(config.components, type, components);
    return components;
  }

  /**
   * Validate configuration structure
   */
  private validateConfig(config: UIConfig): UIConfig {
    if (!config.components || !Array.isArray(config.components)) {
      throw new Error('Configuration must have a components array');
    }

    // Validate each component
    config.components.forEach(component => this.validateComponent(component));

    // Set default values
    return {
      type: config.type || 'page',
      components: config.components,
      layout: config.layout || { type: 'stack', direction: 'column' },
      metadata: config.metadata || { title: 'Dynamic UI' }
    };
  }

  /**
   * Validate individual component
   */
  private validateComponent(component: UIComponent): void {
    if (!component.id) {
      throw new Error('Component must have an id');
    }
    if (!component.type) {
      throw new Error(`Component ${component.id} must have a type`);
    }
    if (!component.props) {
      component.props = {};
    }

    // Validate children recursively
    if (component.children) {
      component.children.forEach(child => this.validateComponent(child));
    }
  }

  /**
   * Recursively find component by ID
   */
  private findComponentRecursive(component: UIComponent, targetId: string): UIComponent | null {
    if (component.id === targetId) {
      return component;
    }

    if (component.children) {
      for (const child of component.children) {
        const found = this.findComponentRecursive(child, targetId);
        if (found) return found;
      }
    }

    return null;
  }

  /**
   * Update component in configuration
   */
  private updateComponentInConfig(
    config: UIConfig, 
    componentId: string, 
    updates: Partial<UIComponent>
  ): UIConfig {
    const updatedComponents = config.components.map(component => 
      this.updateComponentRecursive(component, componentId, updates)
    );

    return {
      ...config,
      components: updatedComponents
    };
  }

  /**
   * Recursively update component
   */
  private updateComponentRecursive(
    component: UIComponent, 
    targetId: string, 
    updates: Partial<UIComponent>
  ): UIComponent {
    if (component.id === targetId) {
      return { ...component, ...updates };
    }

    if (component.children) {
      const updatedChildren = component.children.map(child =>
        this.updateComponentRecursive(child, targetId, updates)
      );
      return { ...component, children: updatedChildren };
    }

    return component;
  }

  /**
   * Collect components by type
   */
  private collectComponentsByType(
    components: UIComponent[], 
    type: string, 
    result: UIComponent[]
  ): void {
    components.forEach(component => {
      if (component.type === type) {
        result.push(component);
      }
      if (component.children) {
        this.collectComponentsByType(component.children, type, result);
      }
    });
  }

  /**
   * Clear configuration cache
   */
  clearCache(): void {
    this.configCache.clear();
    this.currentConfig$.next(null);
  }

  /**
   * Export current configuration as JSON
   */
  exportConfig(): string {
    const config = this.currentConfig$.value;
    return config ? JSON.stringify(config, null, 2) : '';
  }
}
