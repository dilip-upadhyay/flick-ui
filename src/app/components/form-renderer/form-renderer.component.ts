import { Component, Input, Output, EventEmitter, OnInit, OnChanges, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MaterialModule } from '../../shared/material.module';
import { FormConfig, FormField, FieldValidation } from '../../models/ui-config.interface';
import { RendererService } from '../../services/renderer.service';

@Component({
  selector: 'app-form-renderer',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule],
  templateUrl: './form-renderer.component.html',
  styleUrl: './form-renderer.component.css'
})
export class FormRendererComponent implements OnInit, OnChanges, OnDestroy {
  @Input() config: FormConfig | null = null;
  @Output() event = new EventEmitter<any>();

  formGroup: FormGroup = new FormGroup({});
  currentDeviceType: string = 'desktop';

  constructor(
    private formBuilder: FormBuilder,
    private rendererService: RendererService
  ) {
    this.updateDeviceType();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.updateDeviceType();
  }

  private updateDeviceType() {
    this.currentDeviceType = this.getCurrentDeviceType();
  }

  ngOnInit() {
    if (this.config) {
      this.buildForm();
    }
  }

  ngOnChanges() {
    if (this.config) {
      this.buildForm();
    }
  }

  ngOnDestroy() {
    // Cleanup if needed
  }

  private buildForm() {
    if (!this.config) return;

    const formControls: any = {};

    this.config.fields.forEach(field => {
      const validators = this.getValidators(field);
      const defaultValue = this.getDefaultValue(field);
      
      if (field.type === 'checkbox' && field.options) {
        // Create individual controls for each checkbox option
        field.options.forEach(option => {
          formControls[field.id + '_' + option.value] = [false, validators];
        });
      } else {
        formControls[field.id] = [{ value: defaultValue, disabled: field.disabled || false }, validators];
      }
    });

    this.formGroup = this.formBuilder.group(formControls);

    // Add custom validator for confirm password
    this.addConfirmPasswordValidator();
  }

  private addConfirmPasswordValidator() {
    const passwordControl = this.formGroup.get('password');
    const confirmPasswordControl = this.formGroup.get('confirmPassword');

    if (passwordControl && confirmPasswordControl) {
      const existingValidators = confirmPasswordControl.validator ? [confirmPasswordControl.validator] : [];
      confirmPasswordControl.setValidators([
        ...existingValidators,
        this.confirmPasswordValidator(passwordControl)
      ]);
      confirmPasswordControl.updateValueAndValidity();
    }
  }

  private confirmPasswordValidator(passwordControl: any) {
    return (confirmPasswordControl: any) => {
      if (!confirmPasswordControl.value) {
        return null; // Don't validate empty value here, required validator will handle it
      }
      if (passwordControl.value !== confirmPasswordControl.value) {
        return { passwordMismatch: true };
      }
      return null;
    };
  }

  private getValidators(field: FormField): any[] {
    const validators = [];

    if (field.required) {
      validators.push(Validators.required);
    }

    if (field.validation) {
      // Handle single validation or array of validations
      const validations = Array.isArray(field.validation) ? field.validation : [field.validation];
      
      validations.forEach(validation => {
        switch (validation.type) {
          case 'email':
            validators.push(Validators.email);
            break;
          case 'minLength':
            validators.push(Validators.minLength(validation.value as number));
            break;
          case 'maxLength':
            validators.push(Validators.maxLength(validation.value as number));
            break;
          case 'pattern':
            validators.push(Validators.pattern(validation.value as string));
            break;
        }
      });
    }

    return validators;
  }

  private getDefaultValue(field: FormField): any {
    if (field.defaultValue !== undefined) {
      return field.defaultValue;
    }

    switch (field.type) {
      case 'checkbox':
        return false;
      case 'number':
        return 0;
      default:
        return '';
    }
  }

  getFormControl(fieldId: string) {
    return this.formGroup.get(fieldId);
  }

  // Responsive utility methods
  shouldUseGridLayout(): boolean {
    // Use grid layout for screens wider than tablet (768px)
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768;
    }
    return false; // Default for SSR
  }

  hasGridPositioning(): boolean {
    // Check if any field has grid positioning
    const hasGrid = this.config?.fields?.some(field => field.gridColumn) || false;
    console.log('hasGridPositioning:', hasGrid, 'fields with gridColumn:', 
      this.config?.fields?.filter(field => field.gridColumn)?.map(f => ({ id: f.id, gridColumn: f.gridColumn })));
    return hasGrid;
  }

  getFieldGridStyle(field: FormField): any {
    if (field.gridColumn) {
      const style = {
        'grid-area': field.gridColumn
      };
      console.log(`Grid style for field ${field.id}:`, style);
      return style;
    }
    return {};
  }

  getFieldContainerClass(field: FormField): string {
    const classes = ['field-container'];
    
    // Add field type and ID as classes for CSS targeting
    classes.push(`field-type-${field.type}`);
    classes.push(`field-id-${field.id}`);
    
    // Check if field has grid positioning from grid layout
    if (field.gridColumn) {
      classes.push('grid-positioned');
      console.log(`Field ${field.id} has grid positioning: ${field.gridColumn}, classes:`, classes);
      return classes.join(' ');
    }
    
    // Determine if field should span full width or be part of grid
    if (this.shouldUseGridLayout() && typeof window !== 'undefined') {
      const screenWidth = window.innerWidth;
      
      // Fields that should always span full width in grid layout
      const fullSpanFields = ['textarea', 'checkbox'];
      const fullSpanFieldIds = ['terms', 'newsletter', 'interests', 'description'];
      
      // Fields that should be half-width on larger screens
      const halfSpanFields = ['select', 'date'];
      const halfSpanFieldIds = ['gender', 'dateOfBirth'];
      
      // For password fields, handle them first with specific responsive logic
      if (field.type === 'password') {
        // confirmPassword should be responsive
        if (field.id.includes('confirm') || field.id === 'confirmPassword') {
          if (screenWidth >= 1024) {
            classes.push('confirm-password-responsive');
          } else {
            classes.push('full-span');
          }
        }
        // Regular password field can be half-width on larger screens
        else if (screenWidth >= 1024) {
          classes.push('password-responsive');
        }
      }
      // Check if field should span full width (excluding password fields which are handled above)
      else if (fullSpanFields.includes(field.type) || 
               fullSpanFieldIds.includes(field.id) ||
               field.id.includes('description')) {
        classes.push('full-span');
      } 
      // Check if field should be half-width on desktop+ screens
      else if ((halfSpanFields.includes(field.type) || halfSpanFieldIds.includes(field.id)) && 
               screenWidth >= 1280) {
        classes.push('half-span');
      }
      // For text fields like firstName, lastName
      else if (field.type === 'text' && screenWidth >= 1024) {
        classes.push('text-responsive');
      }
      // For email and tel fields
      else if ((field.type === 'email' || field.type === 'tel') && screenWidth >= 1024) {
        classes.push('text-responsive');
      }
    }
    
    // Debug logging to help troubleshoot
    if (field.id === 'confirmPassword' || field.id === 'dateOfBirth' || field.id === 'password') {
      console.log(`Field ${field.id} classes:`, classes.join(' '), 'Screen width:', typeof window !== 'undefined' ? window.innerWidth : 'SSR');
    }
    
    return classes.join(' ');
  }

  getAutocompleteValue(fieldType: string): string {
    // Provide appropriate autocomplete values for better UX
    const autocompleteMap: { [key: string]: string } = {
      'email': 'email',
      'password': 'current-password',
      'tel': 'tel',
      'text': 'off'
    };
    
    return autocompleteMap[fieldType] || 'off';
  }

  // Device detection utilities
  isMobile(): boolean {
    return typeof window !== 'undefined' ? window.innerWidth < 768 : false;
  }

  isTablet(): boolean {
    return typeof window !== 'undefined' ? window.innerWidth >= 768 && window.innerWidth < 1024 : false;
  }

  isLaptop(): boolean {
    return typeof window !== 'undefined' ? window.innerWidth >= 1024 && window.innerWidth < 1280 : false;
  }

  isDesktop(): boolean {
    return typeof window !== 'undefined' ? window.innerWidth >= 1280 && window.innerWidth < 1920 : false;
  }

  isTV(): boolean {
    return typeof window !== 'undefined' ? window.innerWidth >= 1920 : false;
  }

  getCurrentDeviceType(): string {
    if (this.isMobile()) return 'mobile';
    if (this.isTablet()) return 'tablet';
    if (this.isLaptop()) return 'laptop';
    if (this.isDesktop()) return 'desktop';
    if (this.isTV()) return 'tv';
    return 'desktop'; // Default for SSR
  }

  onSubmit() {
    if (this.formGroup.valid) {
      this.event.emit({
        type: 'submit',
        data: this.formGroup.value
      });
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.formGroup.controls).forEach(key => {
        this.formGroup.get(key)?.markAsTouched();
      });
    }
  }
}
