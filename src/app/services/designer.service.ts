import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { UIConfig, UIComponent, ComponentType } from '../models/ui-config.interface';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

export interface DesignerAction {
  type: 'add' | 'update' | 'delete' | 'move';
  component: UIComponent;
  parent?: UIComponent;
  index?: number;
  previousState?: any;
}

@Injectable({
  providedIn: 'root'
})
export class DesignerService {
  private currentConfig$ = new BehaviorSubject<UIConfig>(this.getDefaultConfig());
  private selectedComponent$ = new BehaviorSubject<UIComponent | null>(null);
  private draggedComponent$ = new BehaviorSubject<ComponentType | null>(null);
  private hasUnsavedChanges$ = new BehaviorSubject<boolean>(false);
  
  // Undo/Redo functionality
  private history: UIConfig[] = [];
  private historyIndex = -1;
  private maxHistorySize = 50;

  constructor(
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.saveToHistory(this.getDefaultConfig());
  }

  // Observable getters
  getCurrentConfig(): Observable<UIConfig> {
    return this.currentConfig$.asObservable();
  }

  getSelectedComponent(): Observable<UIComponent | null> {
    return this.selectedComponent$.asObservable();
  }

  getDraggedComponent(): Observable<ComponentType | null> {
    return this.draggedComponent$.asObservable();
  }

  getHasUnsavedChanges(): Observable<boolean> {
    return this.hasUnsavedChanges$.asObservable();
  }

  // Config Management
  loadConfig(config: UIConfig): void {
    this.currentConfig$.next(config);
    this.saveToHistory(config);
    this.setUnsavedChanges(false);
    this.selectedComponent$.next(null);
  }

  updateConfig(config: UIConfig): void {
    this.currentConfig$.next(config);
    this.saveToHistory(config);
    this.setUnsavedChanges(true);
  }

  exportConfig(): string {
    const config = this.currentConfig$.value;
    const jsonString = JSON.stringify(config, null, 2);
    
    // Create download link
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `layout-${Date.now()}.json`;
    link.click();
    window.URL.revokeObjectURL(url);

    this.snackBar.open('Configuration exported successfully', 'Close', {
      duration: 3000
    });

    return jsonString;
  }

  // Component Management
  selectComponent(component: UIComponent | null): void {
    this.selectedComponent$.next(component);
  }

  setDraggedComponent(componentType: ComponentType | null): void {
    this.draggedComponent$.next(componentType);
  }

  addComponent(component: UIComponent, parent?: UIComponent, index?: number): void {
    const config = { ...this.currentConfig$.value };
    
    if (parent) {
      // Add to parent's children
      if (!parent.children) {
        parent.children = [];
      }
      if (index !== undefined) {
        parent.children.splice(index, 0, component);
      } else {
        parent.children.push(component);
      }
    } else {
      // Add to root level
      if (index !== undefined) {
        config.components.splice(index, 0, component);
      } else {
        config.components.push(component);
      }
    }

    this.updateConfig(config);
    this.selectComponent(component);
  }

  updateComponent(updatedComponent: UIComponent): void {
    const config = { ...this.currentConfig$.value };
    this.updateComponentInConfig(config, updatedComponent);
    this.updateConfig(config);
  }

  updateComponentProperty(component: UIComponent, property: string, value: any): void {
    const config = { ...this.currentConfig$.value };
    const foundComponent = this.findComponentInConfig(config, component.id);
    
    if (foundComponent) {
      if (property.includes('.')) {
        // Handle nested properties like 'props.title'
        const parts = property.split('.');
        let current: any = foundComponent;
        for (let i = 0; i < parts.length - 1; i++) {
          if (!current[parts[i]]) {
            current[parts[i]] = {};
          }
          current = current[parts[i]];
        }
        current[parts[parts.length - 1]] = value;
      } else {
        (foundComponent as any)[property] = value;
      }
    }

    this.updateConfig(config);
  }

  deleteComponent(component: UIComponent): void {
    const config = { ...this.currentConfig$.value };
    this.removeComponentFromConfig(config, component.id);
    this.updateConfig(config);
    
    if (this.selectedComponent$.value?.id === component.id) {
      this.selectComponent(null);
    }
  }

  moveComponent(component: UIComponent, newParent?: UIComponent, newIndex?: number): void {
    const config = { ...this.currentConfig$.value };
    
    // Remove from current location
    this.removeComponentFromConfig(config, component.id);
    
    // Add to new location
    if (newParent) {
      if (!newParent.children) {
        newParent.children = [];
      }
      if (newIndex !== undefined) {
        newParent.children.splice(newIndex, 0, component);
      } else {
        newParent.children.push(component);
      }
    } else {
      if (newIndex !== undefined) {
        config.components.splice(newIndex, 0, component);
      } else {
        config.components.push(component);
      }
    }

    this.updateConfig(config);
  }

  duplicateComponent(component: UIComponent): UIComponent {
    const config = { ...this.currentConfig$.value };
    
    // Create a deep copy of the component with a new ID
    const duplicatedComponent = this.deepCloneComponent(component);
    duplicatedComponent.id = this.generateComponentId();
    
    // Find the parent of the original component
    const parent = this.findComponentParent(config, component.id);
    
    if (parent) {
      const index = parent.children?.findIndex((c: UIComponent) => c.id === component.id) ?? -1;
      if (index !== -1 && parent.children) {
        parent.children.splice(index + 1, 0, duplicatedComponent);
      }
    } else {
      const index = config.components.findIndex((c: UIComponent) => c.id === component.id);
      if (index !== -1) {
        config.components.splice(index + 1, 0, duplicatedComponent);
      }
    }
    
    this.updateConfig(config);
    return duplicatedComponent;
  }

  // History Management
  undo(): void {
    if (this.canUndo()) {
      this.historyIndex--;
      const config = this.history[this.historyIndex];
      this.currentConfig$.next(config);
      this.selectedComponent$.next(null);
      this.setUnsavedChanges(true);
    }
  }

  redo(): void {
    if (this.canRedo()) {
      this.historyIndex++;
      const config = this.history[this.historyIndex];
      this.currentConfig$.next(config);
      this.selectedComponent$.next(null);
      this.setUnsavedChanges(true);
    }
  }

  canUndo(): boolean {
    return this.historyIndex > 0;
  }

  canRedo(): boolean {
    return this.historyIndex < this.history.length - 1;
  }

  // Component Creation Helpers
  createComponent(type: ComponentType, id?: string): UIComponent {
    const componentId = id || this.generateId(type);
    
    const baseComponent: UIComponent = {
      id: componentId,
      type,
      props: this.getDefaultPropsForType(type)
    };

    return baseComponent;
  }

  // Layout Operations
  createNew(): void {
    const newConfig = this.getDefaultConfig();
    this.loadConfig(newConfig);
    this.snackBar.open('New layout created', 'Close', { duration: 2000 });
  }

  save(): void {
    // In a real app, this would save to a backend
    localStorage.setItem('designer-config', JSON.stringify(this.currentConfig$.value));
    this.setUnsavedChanges(false);
    this.snackBar.open('Layout saved successfully', 'Close', { duration: 3000 });
  }

  showLoadDialog(): void {
    // In a real app, this would show a dialog to select from saved layouts
    const saved = localStorage.getItem('designer-config');
    if (saved) {
      try {
        const config = JSON.parse(saved);
        this.loadConfig(config);
        this.snackBar.open('Layout loaded successfully', 'Close', { duration: 3000 });
      } catch (error) {
        this.snackBar.open('Error loading layout', 'Close', { duration: 3000 });
      }
    } else {
      this.snackBar.open('No saved layout found', 'Close', { duration: 3000 });
    }
  }

  showPreview(): void {
    // This would open the layout in a new tab/window using the dynamic renderer
    const config = this.currentConfig$.value;
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(`
        <html>
          <head><title>Layout Preview</title></head>
          <body>
            <div id="preview-root"></div>
            <script>
              // In a real implementation, this would render the layout
              console.log('Preview config:', ${JSON.stringify(config)});
            </script>
          </body>
        </html>
      `);
    }
  }

  // Private Helper Methods
  private getDefaultConfig(): UIConfig {
    return {
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
  }

  private getDefaultPropsForType(type: ComponentType): any {
    const defaults: Record<ComponentType, any> = {
      header: {
        title: 'Header Title',
        subtitle: 'Header subtitle'
      },
      navigation: {
        type: 'horizontal',
        items: []
      },
      form: {
        title: 'Form Title',
        fields: [],
        actions: []
      },
      dashboard: {
        title: 'Dashboard',
        widgets: []
      },
      card: {
        title: 'Card Title',
        content: 'Card content'
      },
      button: {
        label: 'Button',
        variant: 'primary'
      },
      text: {
        content: 'Text content',
        variant: 'body1'
      },
      image: {
        src: 'https://via.placeholder.com/300x200',
        alt: 'Placeholder image'
      },
      container: {
        className: 'container'
      },
      grid: {
        columns: 12,
        gap: 'medium'
      },
      chart: {
        type: 'line',
        title: 'Chart Title'
      },
      modal: {
        title: 'Modal Title',
        content: 'Modal content'
      },
      tabs: {
        tabs: [
          { id: 'tab1', label: 'Tab 1', content: 'Tab 1 content' }
        ]
      },
      accordion: {
        items: [
          { id: 'item1', title: 'Accordion Item', content: 'Accordion content' }
        ]
      }
    };

    return defaults[type] || {};
  }

  private generateId(type: ComponentType): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 5);
    return `${type}-${timestamp}-${random}`;
  }

  private saveToHistory(config: UIConfig): void {
    // Remove future history if we're not at the end
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }

    // Add new state
    this.history.push(JSON.parse(JSON.stringify(config)));
    this.historyIndex = this.history.length - 1;

    // Limit history size
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
      this.historyIndex--;
    }
  }

  private setUnsavedChanges(hasChanges: boolean): void {
    this.hasUnsavedChanges$.next(hasChanges);
  }

  private findComponentInConfig(config: UIConfig, componentId: string): UIComponent | null {
    const searchComponents = (components: UIComponent[]): UIComponent | null => {
      for (const component of components) {
        if (component.id === componentId) {
          return component;
        }
        if (component.children) {
          const found = searchComponents(component.children);
          if (found) return found;
        }
      }
      return null;
    };

    return searchComponents(config.components);
  }

  private updateComponentInConfig(config: UIConfig, updatedComponent: UIComponent): void {
    const searchAndUpdate = (components: UIComponent[]): boolean => {
      for (let i = 0; i < components.length; i++) {
        if (components[i].id === updatedComponent.id) {
          components[i] = updatedComponent;
          return true;
        }
        if (components[i].children) {
          if (searchAndUpdate(components[i].children!)) {
            return true;
          }
        }
      }
      return false;
    };

    searchAndUpdate(config.components);
  }

  private removeComponentFromConfig(config: UIConfig, componentId: string): void {
    const removeFromComponents = (components: UIComponent[]): boolean => {
      for (let i = 0; i < components.length; i++) {
        if (components[i].id === componentId) {
          components.splice(i, 1);
          return true;
        }
        if (components[i].children) {
          if (removeFromComponents(components[i].children!)) {
            return true;
          }
        }
      }
      return false;
    };

    removeFromComponents(config.components);
  }

  private generateComponentId(): string {
    return 'comp_' + Math.random().toString(36).substr(2, 9);
  }

  private deepCloneComponent(component: UIComponent): UIComponent {
    return {
      ...component,
      id: component.id, // Will be overridden in duplicateComponent
      props: component.props ? { ...component.props } : {},
      children: component.children ? component.children.map(child => this.deepCloneComponent(child)) : undefined,
      styles: component.styles ? { ...component.styles } : undefined
    };
  }

  private findComponentParent(config: UIConfig, componentId: string): UIComponent | null {
    const searchForParent = (components: UIComponent[], targetId: string): UIComponent | null => {
      for (const component of components) {
        if (component.children) {
          if (component.children.some((c: UIComponent) => c.id === targetId)) {
            return component;
          }
          const found = searchForParent(component.children, targetId);
          if (found) return found;
        }
      }
      return null;
    };

    return searchForParent(config.components, componentId);
  }
}
