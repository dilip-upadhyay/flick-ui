import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { UIComponent, DisplayCondition, DataSourceConfig } from '../models/ui-config.interface';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class RendererService {
  private context: { [key: string]: any } = {};

  constructor(private http: HttpClient) {}

  /**
   * Set the rendering context (data available to all components)
   */
  setContext(context: { [key: string]: any }): void {
    this.context = { ...this.context, ...context };
  }

  /**
   * Get the current rendering context
   */
  getContext(): { [key: string]: any } {
    return this.context;
  }

  /**
   * Update a specific value in the context
   */
  updateContext(key: string, value: any): void {
    this.context[key] = value;
  }

  /**
   * Check if a component should be displayed based on conditions
   */
  shouldDisplayComponent(component: UIComponent): boolean {
    if (!component.conditions || component.conditions.length === 0) {
      return true;
    }

    return component.conditions.every(condition => 
      this.evaluateCondition(condition)
    );
  }

  /**
   * Evaluate a display condition
   */
  private evaluateCondition(condition: DisplayCondition): boolean {
    const fieldValue = this.getNestedValue(this.context, condition.field);
    
    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value;
      case 'not_equals':
        return fieldValue !== condition.value;
      case 'contains':
        return String(fieldValue).includes(String(condition.value));
      case 'greater_than':
        return Number(fieldValue) > Number(condition.value);
      case 'less_than':
        return Number(fieldValue) < Number(condition.value);
      default:
        return true;
    }
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => 
      current && current[key] !== undefined ? current[key] : undefined, obj
    );
  }

  /**
   * Load data from data source
   */
  loadData(dataSource: DataSourceConfig): Observable<any> {
    if (dataSource.type === 'static') {
      return of(dataSource);
    }

    if (dataSource.type === 'api' && dataSource.url) {
      const options: any = {
        headers: dataSource.headers || {}
      };

      if (dataSource.method === 'POST') {
        return this.http.post(dataSource.url, dataSource.params || {}, options);
      } else {
        options.params = dataSource.params || {};
        return this.http.get(dataSource.url, options);
      }
    }

    return of(null);
  }

  /**
   * Execute action based on action string
   */
  executeAction(action: string, context?: any): void {
    try {
      // Parse action string (e.g., "updateContext:fieldName:value" or "navigate:/path")
      const [actionType, ...params] = action.split(':');

      switch (actionType) {
        case 'updateContext':
          if (params.length >= 2) {
            this.updateContext(params[0], params[1]);
          }
          break;
        case 'setContext':
          if (context) {
            this.setContext(context);
          }
          break;
        case 'navigate':
          if (params[0]) {
            // This would typically integrate with Angular Router
            console.log('Navigate to:', params[0]);
          }
          break;
        case 'submit':
          this.handleFormSubmit(context);
          break;
        case 'reset':
          this.handleFormReset(context);
          break;
        case 'custom':
          this.handleCustomAction(params[0], context);
          break;
        default:
          console.warn('Unknown action type:', actionType);
      }
    } catch (error) {
      console.error('Error executing action:', error);
    }
  }

  /**
   * Handle form submission
   */
  private handleFormSubmit(formData: any): void {
    console.log('Form submitted:', formData);
    // This would typically make an API call or update state
  }

  /**
   * Handle form reset
   */
  private handleFormReset(context: any): void {
    console.log('Form reset requested');
    // This would typically clear form data
  }

  /**
   * Handle custom actions
   */
  private handleCustomAction(actionName: string, context: any): void {
    console.log('Custom action:', actionName, context);
    // This would typically delegate to a custom action handler
  }

  /**
   * Transform data using a transform function string
   */
  transformData(data: any, transformFunction?: string): any {
    if (!transformFunction) {
      return data;
    }

    try {
      // Simple transform functions
      switch (transformFunction) {
        case 'toUpperCase':
          return typeof data === 'string' ? data.toUpperCase() : data;
        case 'toLowerCase':
          return typeof data === 'string' ? data.toLowerCase() : data;
        case 'toNumber':
          return Number(data);
        case 'toString':
          return String(data);
        case 'toArray':
          return Array.isArray(data) ? data : [data];
        default:
          // For more complex transforms, you could evaluate the function string
          return data;
      }
    } catch (error) {
      console.error('Error transforming data:', error);
      return data;
    }
  }

  /**
   * Generate CSS styles from component styles object
   */
  generateStyles(styles?: { [key: string]: any }): { [key: string]: string } {
    if (!styles) {
      return {};
    }

    const cssStyles: { [key: string]: string } = {};
    
    Object.keys(styles).forEach(key => {
      // Convert camelCase to kebab-case for CSS properties
      const cssProperty = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      cssStyles[cssProperty] = styles[key];
    });

    return cssStyles;
  }

  /**
   * Validate form data against field validations
   */
  validateFormData(formData: any, fields: any[]): { [key: string]: string[] } {
    const errors: { [key: string]: string[] } = {};

    fields.forEach(field => {
      const value = formData[field.id];
      const fieldErrors: string[] = [];

      if (field.validation) {
        field.validation.forEach((validation: any) => {
          switch (validation.type) {
            case 'required':
              if (!value || (typeof value === 'string' && value.trim() === '')) {
                fieldErrors.push(validation.message);
              }
              break;
            case 'minLength':
              if (value && value.length < validation.value) {
                fieldErrors.push(validation.message);
              }
              break;
            case 'maxLength':
              if (value && value.length > validation.value) {
                fieldErrors.push(validation.message);
              }
              break;
            case 'pattern':
              if (value && !new RegExp(validation.value).test(value)) {
                fieldErrors.push(validation.message);
              }
              break;
            case 'email':
              const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
              if (value && !emailPattern.test(value)) {
                fieldErrors.push(validation.message);
              }
              break;
            case 'min':
              if (value && Number(value) < validation.value) {
                fieldErrors.push(validation.message);
              }
              break;
            case 'max':
              if (value && Number(value) > validation.value) {
                fieldErrors.push(validation.message);
              }
              break;
          }
        });
      }

      if (fieldErrors.length > 0) {
        errors[field.id] = fieldErrors;
      }
    });

    return errors;
  }
}
