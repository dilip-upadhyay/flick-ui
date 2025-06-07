import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../shared/material.module';
import { FormConfig, FormField } from '../../models/ui-config.interface';
import { FormRendererComponent } from '../../components/form-renderer/form-renderer.component';

@Component({
  selector: 'app-form',
  standalone: true,
  imports: [CommonModule, MaterialModule, FormRendererComponent],
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.css']
})
export class FormComponent implements OnInit {
  currentConfig: FormConfig | null = null;

  constructor(private readonly http: HttpClient) {}
    ngOnInit() {
    console.log('FormComponent ngOnInit called');
    
    // Load form configuration from JSON file
    this.http.get<any>('assets/configs/test-children-form.json').subscribe({
      next: (config) => {
        console.log('Form config loaded successfully:', config);
        this.currentConfig = this.convertToFormConfig(config);
        console.log('Converted form config:', this.currentConfig);
      },
      error: (error) => {
        console.error('Error loading form configuration:', error);
      }
    });
  }

  /**
   * Convert various configuration formats to proper FormConfig
   */
  private convertToFormConfig(config: any): FormConfig {
    // If it's already a proper FormConfig with fields array, return as is
    if (config.fields && Array.isArray(config.fields)) {
      return config as FormConfig;
    }

    // If it's a layout configuration with components, extract form configuration
    if (config.type === 'layout' && config.components) {
      // Find the form component
      const formComponent = config.components.find((comp: any) => comp.type === 'form');
      if (formComponent) {
        return this.extractFormConfigFromComponent(formComponent);
      }
    }

    // If it's a single form component with children, convert it
    if (config.type === 'form' && config.children) {
      return this.extractFormConfigFromComponent(config);
    }    // Default fallback
    return {
      title: config.title ?? 'Form',
      description: config.description ?? '',
      fields: [],
      actions: config.actions ?? []
    };
  }

  /**
   * Extract FormConfig from a form component that has children array
   */
  private extractFormConfigFromComponent(formComponent: any): FormConfig {
    const fields: FormField[] = [];
    
    // Convert children to FormField objects
    if (formComponent.children && Array.isArray(formComponent.children)) {
      formComponent.children.forEach((child: any) => {
        if (this.isFormFieldElement(child.type)) {
          fields.push(this.convertElementToFormField(child));
        }
      });
    }

    // Extract fields from props.fields if they exist
    if (formComponent.props?.fields && Array.isArray(formComponent.props.fields)) {
      fields.push(...formComponent.props.fields);
    }    return {
      title: formComponent.props?.title ?? 'Form',
      description: formComponent.props?.description ?? '',
      fields: fields,
      actions: formComponent.props?.actions ?? []
    };
  }

  /**
   * Check if component type is a form field element
   */
  private isFormFieldElement(type: string): boolean {
    return [
      'text-input', 'email-input', 'password-input', 'number-input',
      'textarea', 'checkbox', 'radio', 'date-input', 'file-input'
    ].includes(type);
  }
  /**
   * Convert form element component to FormField configuration
   */
  private convertElementToFormField(element: any): FormField {
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
      'file-input': 'file'
    };

    return {
      id: element.id,      type: typeMapping[element.type] as any ?? 'text',
      label: props.label ?? 'Field Label',
      placeholder: props.placeholder,
      required: props.required ?? false,
      disabled: props.disabled ?? false,
      options: props.options,
      defaultValue: props.defaultValue,
      helpText: props.helpText,
      gridColumn: props.gridPosition ? `${props.gridPosition.row + 1} / ${props.gridPosition.col + 1} / ${props.gridPosition.row + props.gridPosition.height + 1} / ${props.gridPosition.col + props.gridPosition.width + 1}` : undefined
    };
  }

  onFormEvent(event: any) {
    console.log('Form event:', event);
    
    switch (event.type) {
      case 'submit':
        console.log('Form submitted with data:', event.data);
        // Handle form submission here
        break;
      case 'reset':
        console.log('Form reset');
        break;
      case 'formChange':
        console.log('Form values changed:', event.data);
        break;
    }
  }
}
