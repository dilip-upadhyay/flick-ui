import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
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
export class FormRendererComponent implements OnInit, OnChanges {
  @Input() config: FormConfig | null = null;
  @Output() event = new EventEmitter<any>();

  formGroup: FormGroup = new FormGroup({});

  constructor(
    private formBuilder: FormBuilder,
    private rendererService: RendererService
  ) {}

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
