import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormConfig, FormField, FieldValidation } from '../../models/ui-config.interface';
import { RendererService } from '../../services/renderer.service';

@Component({
  selector: 'app-form-renderer',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
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
      const defaultValue = field.defaultValue || '';
      
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

    if (field.validation && Array.isArray(field.validation)) {
      field.validation.forEach(validation => {
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
        }
      });
    }

    return validators;
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
    if (!field || !field.validation) {
      return [];
    }

    const errors: string[] = [];
    const controlErrors = control.errors;

    if (field.validation && Array.isArray(field.validation)) {
      field.validation.forEach(validation => {
        if (controlErrors[validation.type]) {
          errors.push(validation.message);
        }
      });
    }

    // Handle built-in validators
    if (controlErrors['required'] && field.required) {
      errors.push(`${field.label} is required`);
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
}
