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
  template: `
    <div class="form-container" *ngIf="config">
      <div class="form-header">
        <h2>{{ config.title }}</h2>
        <p *ngIf="config.description">{{ config.description }}</p>
      </div>

      <form [formGroup]="formGroup" (ngSubmit)="onSubmit()" class="dynamic-form">
        <div class="form-fields">
          @for (field of config.fields; track field.id) {
            <div class="field-container">
              <!-- Text Input Fields -->
              @if (field.type === 'text' || field.type === 'email' || field.type === 'password' || field.type === 'tel') {
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>{{ field.label }}
                    <span *ngIf="field.required" class="required-indicator">*</span>
                  </mat-label>
                  <input 
                    matInput
                    [type]="field.type"
                    [placeholder]="field.placeholder || ''"
                    [formControlName]="field.id">
                  <mat-error *ngIf="getFormControl(field.id)?.hasError('required')">
                    {{ field.label }} is required
                  </mat-error>
                  <mat-error *ngIf="getFormControl(field.id)?.hasError('email')">
                    Please enter a valid email address
                  </mat-error>
                </mat-form-field>
              }

              <!-- Select Fields -->
              @if (field.type === 'select') {
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>{{ field.label }}
                    <span *ngIf="field.required" class="required-indicator">*</span>
                  </mat-label>
                  <mat-select [formControlName]="field.id" [placeholder]="field.placeholder || ''">
                    @for (option of field.options; track option.value) {
                      <mat-option [value]="option.value">{{ option.label }}</mat-option>
                    }
                  </mat-select>
                  <mat-error *ngIf="getFormControl(field.id)?.hasError('required')">
                    {{ field.label }} is required
                  </mat-error>
                </mat-form-field>
              }

              <!-- Date Fields -->
              @if (field.type === 'date') {
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>{{ field.label }}
                    <span *ngIf="field.required" class="required-indicator">*</span>
                  </mat-label>
                  <input 
                    matInput
                    [matDatepicker]="picker"
                    [formControlName]="field.id">
                  <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
                  <mat-datepicker #picker></mat-datepicker>
                  <mat-error *ngIf="getFormControl(field.id)?.hasError('required')">
                    {{ field.label }} is required
                  </mat-error>
                </mat-form-field>
              }

              <!-- Checkbox Fields -->
              @if (field.type === 'checkbox') {
                <div class="checkbox-group">
                  <label class="field-label">{{ field.label }}
                    <span *ngIf="field.required" class="required-indicator">*</span>
                  </label>
                  @for (option of field.options; track option.value) {
                    <mat-checkbox 
                      [formControlName]="field.id + '_' + option.value"
                      class="checkbox-option">
                      {{ option.label }}
                    </mat-checkbox>
                  }
                </div>
              }
            </div>
          }
        </div>

        <div class="form-actions" *ngIf="config.actions">
          @for (action of config.actions; track action.type) {
            <button 
              mat-raised-button
              [color]="action.variant === 'primary' ? 'primary' : ''"
              [type]="action.type"
              class="action-button">
              {{ action.label }}
            </button>
          }
        </div>
      </form>
    </div>
  `,
  styles: [`
    .form-container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }

    .form-header {
      margin-bottom: 30px;
      text-align: center;
    }

    .form-header h2 {
      color: #333;
      margin-bottom: 10px;
    }

    .form-header p {
      color: #666;
      font-size: 14px;
    }

    .dynamic-form {
      width: 100%;
    }

    .form-fields {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .field-container {
      width: 100%;
    }

    .full-width {
      width: 100%;
    }

    .required-indicator {
      color: #f44336;
    }

    .checkbox-group {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .field-label {
      font-weight: 500;
      margin-bottom: 10px;
      display: block;
    }

    .checkbox-option {
      margin-left: 10px;
    }

    .form-actions {
      display: flex;
      gap: 15px;
      justify-content: center;
      margin-top: 30px;
    }

    .action-button {
      min-width: 120px;
    }
  `]
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
