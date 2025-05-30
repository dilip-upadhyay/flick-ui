import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { UIComponent, ComponentType, FormConfig, FormField, FormModel } from '../models/ui-config.interface';
import { DesignerService } from './designer.service';

export interface FormBuilderState {
  activeForm: UIComponent | null;
  formElements: UIComponent[];
  modelBinding: FormModel | null;
}

@Injectable({
  providedIn: 'root'
})
export class FormBuilderService {
  private formBuilderState$ = new BehaviorSubject<FormBuilderState>({
    activeForm: null,
    formElements: [],
    modelBinding: null
  });

  constructor(private designerService: DesignerService) {}

  /**
   * Get the current form builder state
   */
  getFormBuilderState(): Observable<FormBuilderState> {
    return this.formBuilderState$.asObservable();
  }

  /**
   * Set the active form for editing
   */
  setActiveForm(formComponent: UIComponent | null): void {
    const currentState = this.formBuilderState$.value;
    
    if (formComponent && formComponent.type === 'form') {
      // Extract form elements from form children
      const formElements = formComponent.children || [];
      const modelBinding = formComponent.props.model || null;
      
      this.formBuilderState$.next({
        ...currentState,
        activeForm: formComponent,
        formElements,
        modelBinding
      });
    } else {
      this.formBuilderState$.next({
        ...currentState,
        activeForm: null,
        formElements: [],
        modelBinding: null
      });
    }
  }

  /**
   * Add a form element to the active form
   */
  addFormElement(elementType: ComponentType, index?: number): UIComponent | null {
    const currentState = this.formBuilderState$.value;
    
    if (!currentState.activeForm) {
      console.warn('No active form to add element to');
      return null;
    }

    // Create the form element component
    const newElement = this.designerService.createComponent(elementType);
    
    // Add element to form
    if (!currentState.activeForm.children) {
      currentState.activeForm.children = [];
    }

    if (index !== undefined) {
      currentState.activeForm.children.splice(index, 0, newElement);
    } else {
      currentState.activeForm.children.push(newElement);
    }

    // Update form builder state
    this.formBuilderState$.next({
      ...currentState,
      formElements: [...currentState.activeForm.children]
    });

    // Update the form component in the designer
    this.designerService.updateComponent(currentState.activeForm);

    return newElement;
  }

  /**
   * Remove a form element from the active form
   */
  removeFormElement(elementId: string): void {
    const currentState = this.formBuilderState$.value;
    
    if (!currentState.activeForm || !currentState.activeForm.children) {
      return;
    }

    // Remove element from form
    currentState.activeForm.children = currentState.activeForm.children.filter(
      element => element.id !== elementId
    );

    // Update form builder state
    this.formBuilderState$.next({
      ...currentState,
      formElements: [...currentState.activeForm.children]
    });

    // Update the form component in the designer
    this.designerService.updateComponent(currentState.activeForm);
  }

  /**
   * Reorder form elements within the active form
   */
  reorderFormElements(previousIndex: number, currentIndex: number): void {
    const currentState = this.formBuilderState$.value;
    
    if (!currentState.activeForm || !currentState.activeForm.children) {
      return;
    }

    // Reorder elements
    const elements = [...currentState.activeForm.children];
    const [removed] = elements.splice(previousIndex, 1);
    elements.splice(currentIndex, 0, removed);
    
    currentState.activeForm.children = elements;

    // Update form builder state
    this.formBuilderState$.next({
      ...currentState,
      formElements: [...elements]
    });

    // Update the form component in the designer
    this.designerService.updateComponent(currentState.activeForm);
  }

  /**
   * Update form element properties
   */
  updateFormElement(elementId: string, properties: any): void {
    const currentState = this.formBuilderState$.value;
    
    if (!currentState.activeForm || !currentState.activeForm.children) {
      return;
    }

    // Find and update element
    const element = currentState.activeForm.children.find(el => el.id === elementId);
    if (element) {
      element.props = { ...element.props, ...properties };
      
      // Update form builder state
      this.formBuilderState$.next({
        ...currentState,
        formElements: [...currentState.activeForm.children]
      });

      // Update the form component in the designer
      this.designerService.updateComponent(currentState.activeForm);
    }
  }

  /**
   * Set form model binding configuration
   */
  setFormModel(model: FormModel): void {
    const currentState = this.formBuilderState$.value;
    
    if (!currentState.activeForm) {
      return;
    }

    // Update form model
    currentState.activeForm.props.model = model;

    // Update form builder state
    this.formBuilderState$.next({
      ...currentState,
      modelBinding: model
    });

    // Update the form component in the designer
    this.designerService.updateComponent(currentState.activeForm);
  }

  /**
   * Generate form fields configuration from form elements
   */
  generateFormFieldsConfig(): FormField[] {
    const currentState = this.formBuilderState$.value;
    
    if (!currentState.activeForm || !currentState.activeForm.children) {
      return [];
    }

    return currentState.activeForm.children
      .filter(element => this.isFormFieldElement(element.type))
      .map(element => this.convertElementToFormField(element));
  }

  /**
   * Generate model field mapping from form elements
   */
  generateModelFieldMapping(): { [fieldId: string]: string } {
    const currentState = this.formBuilderState$.value;
    
    if (!currentState.activeForm || !currentState.activeForm.children) {
      return {};
    }

    const mapping: { [fieldId: string]: string } = {};
    
    currentState.activeForm.children.forEach(element => {
      if (this.isFormFieldElement(element.type) && element.props.modelField) {
        mapping[element.id] = element.props.modelField;
      }
    });

    return mapping;
  }

  /**
   * Check if component type is a form field element
   */
  private isFormFieldElement(type: ComponentType): boolean {
    return [
      'text-input', 'email-input', 'password-input', 'number-input',
      'textarea', 'checkbox', 'radio', 'date-input', 'file-input'
    ].includes(type);
  }

  /**
   * Convert form element component to FormField configuration
   */
  private convertElementToFormField(element: UIComponent): FormField {
    const props = element.props;
    
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
      id: element.id,
      type: typeMapping[element.type] as any,
      label: props.label || 'Field Label',
      placeholder: props.placeholder,
      required: props.required || false,
      disabled: props.disabled || false,
      options: props.options,
      defaultValue: props.defaultValue,
      helpText: props.helpText
    };
  }

  /**
   * Create a new form with model binding
   */
  createFormWithModel(title: string, modelConfig: Partial<FormModel>): UIComponent {
    const formComponent = this.designerService.createComponent('form');
    
    // Set up form configuration
    formComponent.props = {
      ...formComponent.props,
      title,
      model: {
        name: modelConfig.name || 'FormModel',
        apiEndpoint: modelConfig.apiEndpoint || '/api/form-submit',
        method: modelConfig.method || 'POST',
        fields: {},
        ...modelConfig
      }
    };

    return formComponent;
  }

  /**
   * Set the form elements order (used by grid layout)
   */
  setFormElements(elements: UIComponent[]): void {
    const currentState = this.formBuilderState$.value;
    
    if (!currentState.activeForm) {
      return;
    }

    // Update form children with new order
    currentState.activeForm.children = [...elements];

    // Update form builder state
    this.formBuilderState$.next({
      ...currentState,
      formElements: [...elements]
    });

    // Update the form component in the designer
    this.designerService.updateComponent(currentState.activeForm);
  }
}
