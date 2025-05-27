import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormConfig, FormField, FieldValidation } from '../../models/ui-config.interface';
import { RendererService } from '../../services/renderer.service';
import { 
  UiInputComponent, 
  UiTextareaComponent, 
  UiSelectComponent, 
  UiCheckboxComponent, 
  UiRadioComponent, 
  UiDatepickerComponent, 
  UiFileUploadComponent, 
  UiButtonComponent,
  SelectOption,
  CheckboxOption,
  RadioOption
} from '../../shared/ui-components';

@Component({
  selector: 'app-form-renderer',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    UiInputComponent,
    UiTextareaComponent,
    UiSelectComponent,
    UiCheckboxComponent,
    UiRadioComponent,
    UiDatepickerComponent,
    UiFileUploadComponent,
    UiButtonComponent
  ],
  templateUrl: './form-renderer.component.html',
  styleUrl: './form-renderer.component.css'
})
export class FormRendererComponent implements OnInit {
  @Input() config!: FormConfig;
  @Output() event = new EventEmitter<any>();

  form!: FormGroup;
  formErrors: { [key: string]: string[] } = {};
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private rendererService: RendererService
  ) {}

  ngOnInit(): void {
    this.buildForm();
  }

  /**
   * Build reactive form from configuration
   */
  private buildForm(): void {
    const formControls: { [key: string]: any } = {};

    this.config.fields.forEach(field => {
      const validators = this.buildValidators(field);
      let defaultValue = field.defaultValue;
      
      // Handle checkbox arrays (multiple options)
      if (field.type === 'checkbox' && field.options && field.options.length > 0) {
        defaultValue = defaultValue || [];
      } else if (field.type === 'checkbox') {
        defaultValue = defaultValue || false;
      } else {
        defaultValue = defaultValue || '';
      }
      
      formControls[field.id] = [
        { value: defaultValue, disabled: field.disabled || false },
        validators
      ];
    });

    this.form = this.fb.group(formControls);

    // Watch for form changes
    this.form.valueChanges.subscribe(value => {
      this.event.emit({
        type: 'formChange',
        data: value
      });
    });
  }

  /**
   * Build validators for a field
   */
  private buildValidators(field: FormField): any[] {
    const validators: any[] = [];

    if (field.required) {
      validators.push(Validators.required);
    }

    if (field.validation) {
      const validations = Array.isArray(field.validation) ? field.validation : [field.validation];
      
      validations.forEach(validation => {
        switch (validation.type) {
          case 'minLength':
            validators.push(Validators.minLength(validation.value));
            break;
          case 'maxLength':
            validators.push(Validators.maxLength(validation.value));
            break;
          case 'pattern':
            validators.push(Validators.pattern(validation.value));
            break;
          case 'email':
            validators.push(Validators.email);
            break;
          case 'min':
            validators.push(Validators.min(validation.value));
            break;
          case 'max':
            validators.push(Validators.max(validation.value));
            break;
          case 'confirmField':
            // Custom validator for password confirmation
            validators.push(this.createConfirmValidator(validation.confirmField!));
            break;
        }
      });
    }

    return validators;
  }

  /**
   * Create custom validator for password confirmation
   */
  private createConfirmValidator(confirmFieldId: string) {
    return (control: any) => {
      if (!control.value || !this.form) {
        return null;
      }
      
      const confirmControl = this.form.get(confirmFieldId);
      if (!confirmControl) {
        return null;
      }
      
      if (control.value !== confirmControl.value) {
        return { confirmField: true };
      }
      
      return null;
    };
  }

  /**
   * Get field error messages
   */
  getFieldErrors(fieldId: string): string[] {
    const control = this.form.get(fieldId);
    if (!control || !control.errors || !control.touched) {
      return [];
    }

    const field = this.config.fields.find(f => f.id === fieldId);
    if (!field) {
      return [];
    }

    const errors: string[] = [];
    const controlErrors = control.errors;

    // Handle validation messages from field configuration
    if (field.validation) {
      const validations = Array.isArray(field.validation) ? field.validation : [field.validation];
      
      validations.forEach(validation => {
        if (controlErrors[validation.type]) {
          errors.push(validation.message);
        }
      });
    }

    // Handle built-in validators
    if (controlErrors['required'] && field.required) {
      errors.push(`${field.label} is required`);
    }

    if (controlErrors['email']) {
      errors.push(`Please enter a valid email address`);
    }

    if (controlErrors['minlength']) {
      errors.push(`${field.label} must be at least ${controlErrors['minlength'].requiredLength} characters`);
    }

    if (controlErrors['maxlength']) {
      errors.push(`${field.label} must be no more than ${controlErrors['maxlength'].requiredLength} characters`);
    }

    if (controlErrors['pattern']) {
      errors.push(`${field.label} format is invalid`);
    }

    if (controlErrors['confirmField']) {
      errors.push(`Passwords do not match`);
    }

    return errors;
  }

  /**
   * Check if field has errors
   */
  hasFieldError(fieldId: string): boolean {
    const control = this.form.get(fieldId);
    return !!(control && control.invalid && control.touched);
  }

  /**
   * Handle form submission
   */
  onSubmit(): void {
    if (this.form.valid) {
      this.isSubmitting = true;
      const formData = this.form.value;
      
      this.event.emit({
        type: 'submit',
        action: 'submit',
        data: formData
      });

      // Reset submitting state after a delay (would normally be done after API response)
      setTimeout(() => {
        this.isSubmitting = false;
      }, 2000);
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.form.controls).forEach(key => {
        this.form.get(key)?.markAsTouched();
      });
    }
  }

  /**
   * Handle form reset
   */
  onReset(): void {
    this.form.reset();
    this.event.emit({
      type: 'reset',
      action: 'reset',
      data: null
    });
  }

  /**
   * Handle button actions
   */
  onButtonAction(action: any): void {
    this.event.emit({
      type: 'action',
      data: {
        action: action,
        formData: this.form.value
      }
    });
  }

  /**
   * Handle checkbox changes for multiple checkbox fields
   */
  onCheckboxChange(fieldId: string, value: any, event: any): void {
    const control = this.form.get(fieldId);
    if (!control) return;

    let currentValue = control.value || [];
    if (!Array.isArray(currentValue)) {
      currentValue = [];
    }

    if (event.target.checked) {
      // Add value if checked
      if (!currentValue.includes(value)) {
        currentValue.push(value);
      }
    } else {
      // Remove value if unchecked
      const index = currentValue.indexOf(value);
      if (index > -1) {
        currentValue.splice(index, 1);
      }
    }

    control.setValue(currentValue);
  }

  /**
   * Get form layout classes
   */
  getFormLayoutClasses(): string {
    const classes = ['form-container'];
    
    if (this.config.layout) {
      classes.push(`form-layout-${this.config.layout}`);
    }
    
    if (this.config.columns) {
      classes.push(`form-columns-${this.config.columns}`);
    }
    
    return classes.join(' ');
  }

  /**
   * Get field wrapper classes
   */
  getFieldWrapperClasses(field: FormField): string {
    const classes = ['form-field'];
    
    if (field.gridColumn) {
      classes.push(`grid-column-${field.gridColumn}`);
    }
    
    if (this.hasFieldError(field.id)) {
      classes.push('has-error');
    }
    
    return classes.join(' ');
  }

  /**
   * Get form control classes
   */
  getFormControlClasses(field: FormField): string {
    const classes = ['form-control'];
    
    if (this.hasFieldError(field.id)) {
      classes.push('is-invalid');
    }
    
    return classes.join(' ');
  }

  /**
   * Check if a checkbox option is checked (for multiple checkbox fields)
   */
  isCheckboxChecked(fieldId: string, value: any): boolean {
    const control = this.form.get(fieldId);
    if (!control || !control.value) {
      return false;
    }

    if (Array.isArray(control.value)) {
      return control.value.includes(value);
    }

    return control.value === value;
  }

  /**
   * Get Material button color based on variant
   */
  getButtonColor(variant?: string): string {
    switch (variant) {
      case 'primary':
        return 'primary';
      case 'secondary':
        return 'accent';
      case 'danger':
        return 'warn';
      case 'success':
        return 'primary';
      case 'warning':
        return 'accent';
      default:
        return 'primary';
    }
  }

  /**
   * Get suffix icon for input fields based on type
   */
  getSuffixIcon(type: string): string {
    switch (type) {
      case 'email':
        return 'email';
      case 'tel':
        return 'phone';
      case 'password':
        return 'lock';
      case 'number':
        return 'tag';
      default:
        return '';
    }
  }

  /**
   * Convert field options to SelectOption format
   */
  getSelectOptions(field: FormField): SelectOption[] {
    if (!field.options) return [];
    return field.options.map(option => ({
      value: option.value,
      label: option.label,
      disabled: option.disabled || false
    }));
  }

  /**
   * Convert field options to CheckboxOption format
   */
  getCheckboxOptions(field: FormField): CheckboxOption[] {
    if (!field.options) return [];
    return field.options.map(option => ({
      value: option.value,
      label: option.label,
      disabled: option.disabled || false
    }));
  }

  /**
   * Convert field options to RadioOption format
   */
  getRadioOptions(field: FormField): RadioOption[] {
    if (!field.options) return [];
    return field.options.map(option => ({
      value: option.value,
      label: option.label,
      disabled: option.disabled || false
    }));
  }

  /**
   * Handle file change events
   */
  onFileChange(fieldId: string, files: File[]): void {
    this.event.emit({
      type: 'fileChange',
      fieldId: fieldId,
      data: files
    });
  }

  /**
   * Get icon for form actions
   */
  getActionIcon(actionType: string): string {
    switch (actionType) {
      case 'submit':
        return 'send';
      case 'reset':
        return 'refresh';
      default:
        return '';
    }
  }

  /**
   * Handle action button clicks
   */
  handleActionClick(action: any): void {
    switch (action.type) {
      case 'submit':
        this.onSubmit();
        break;
      case 'reset':
        this.onReset();
        break;
      case 'button':
        this.onButtonAction(action);
        break;
    }
  }
}
