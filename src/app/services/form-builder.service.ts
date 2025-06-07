import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { UIComponent, ComponentType, FormField, FormModel } from '../models/ui-config.interface';
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
  private readonly formBuilderState$ = new BehaviorSubject<FormBuilderState>({
    activeForm: null,
    formElements: [],
    modelBinding: null
  });

  constructor(private readonly designerService: DesignerService) {}

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
      const modelBinding = formComponent.props?.model ?? null;
      
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
    currentState.activeForm.children ??= [];
    const children = currentState.activeForm.children;

    if (index !== undefined) {
      children.splice(index, 0, newElement);
    } else {
      children.push(newElement);
    }

    // Update form builder state
    this.formBuilderState$.next({
      ...currentState,
      formElements: [...children]
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
    
    if (!currentState.activeForm?.children) {
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
    
    if (!currentState.activeForm?.children) {
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
   * Update properties of a form element
   */  updateFormElement(elementId: string, properties: any): void {
    const currentState = this.formBuilderState$.value;
    
    if (!currentState.activeForm?.children) {
      return;
    }

    // Find and update the element
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
   * Update the label of a form element
   */  updateFormElementLabel(elementId: string, newLabel: string): void {
    const currentState = this.formBuilderState$.value;
    
    if (!currentState.activeForm?.children) {
      return;
    }

    // Find and update the element
    const element = currentState.activeForm.children.find(el => el.id === elementId);    if (element) {
      element.props ??= {};
      element.props.label = newLabel;

      // Update form builder state
      this.formBuilderState$.next({
        ...currentState,
        formElements: [...currentState.activeForm.children]
      });

      // Update the form component in the designer
      this.designerService.updateComponent(currentState.activeForm);
      
      // Also update individual component property in designer for real-time sync
      this.designerService.updateComponentProperty(element, 'props.label', newLabel);
    }
  }

  /**
   * Get a specific form element by ID
   */
  getFormElement(elementId: string): UIComponent | null {
    const currentState = this.formBuilderState$.value;
    
    if (!currentState.activeForm?.children) {
      return null;
    }

    return currentState.activeForm.children.find(el => el.id === elementId) || null;
  }

  /**
   * Set the form model for data binding
   */
  setFormModel(model: FormModel): void {
    const currentState = this.formBuilderState$.value;
    
    if (!currentState.activeForm) {
      return;
    }    // Update form model
    currentState.activeForm.props ??= {};
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
   * Generate form fields configuration for the current form
   */
  generateFormFieldsConfig(): FormField[] {
    const currentState = this.formBuilderState$.value;
    
    if (!currentState.activeForm?.children) {
      return [];
    }

    return currentState.activeForm.children
      .filter(element => this.isFormFieldElement(element.type))
      .map(element => this.convertElementToFormField(element));
  }

  /**
   * Generate model field mapping for form binding
   */
  generateModelFieldMapping(): { [fieldId: string]: string } {
    const currentState = this.formBuilderState$.value;
    const mapping: { [fieldId: string]: string } = {};
    
    if (!currentState.activeForm?.children) {
      return mapping;
    }

    currentState.activeForm.children.forEach(element => {
      if (this.isFormFieldElement(element.type) && element.props?.modelField) {
        mapping[element.id] = element.props.modelField;
      }
    });

    return mapping;
  }
  /**
   * Check if a component type is a form field element
   */
  private isFormFieldElement(type: ComponentType): boolean {
    const formFieldTypes: ComponentType[] = [
      'text-input',
      'email-input',
      'password-input',
      'number-input',
      'textarea',
      'checkbox',
      'radio',
      'date-input',
      'file-input'
    ];
    
    return formFieldTypes.includes(type);
  }

  /**
   * Convert a UI component to a form field configuration
   */
  private convertElementToFormField(element: UIComponent): FormField {
    const typeMapping: { [key: string]: FormField['type'] } = {
      'text-input': 'text',
      'email-input': 'email',
      'password-input': 'password',
      'number-input': 'number',
      'textarea': 'textarea',
      'checkbox': 'checkbox',
      'radio': 'radio',
      'date-input': 'date',
      'file-input': 'file'
    };    return {
      id: element.id,
      type: typeMapping[element.type] ?? 'text',
      label: element.props?.label ?? '',
      placeholder: element.props?.placeholder ?? '',
      required: element.props?.required ?? false,
      disabled: element.props?.disabled ?? false,
      options: element.props?.options ?? [],
      validation: element.props?.validation ?? undefined,
      defaultValue: element.props?.defaultValue ?? element.props?.value ?? '',
      helpText: element.props?.helpText ?? '',
      accept: element.props?.accept ?? undefined,
      multiple: element.props?.multiple ?? false
    };
  }

  /**
   * Create a new form with model binding
   */
  createFormWithModel(title: string, modelConfig: Partial<FormModel>): UIComponent {
    const formComponent = this.designerService.createComponent('form');
    
    // Set form properties
    formComponent.props = {
      ...formComponent.props,
      title,      model: {
        name: modelConfig.name ?? 'FormModel',
        apiEndpoint: modelConfig.apiEndpoint ?? '/api/form-submit',
        method: modelConfig.method ?? 'POST',
        ...modelConfig
      }
    };

    return formComponent;
  }

  /**
   * Set form elements directly
   */
  setFormElements(elements: UIComponent[]): void {
    const currentState = this.formBuilderState$.value;
    
    if (!currentState.activeForm) {
      return;
    }

    // Update form children
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
