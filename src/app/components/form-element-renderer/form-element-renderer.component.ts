import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { MaterialModule } from '../../shared/material.module';
import { ComponentType } from '../../models/ui-config.interface';

export interface FormElementConfig {
  id: string;
  type: ComponentType;
  label: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  multiple?: boolean;
  icon?: string;
  options?: { value: any; label: string }[];
  validation?: any[];
  defaultValue?: any;
  helpText?: string;
  modelField?: string; // Maps to backend model field
}

@Component({
  selector: 'app-form-element-renderer',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule],
  template: `
    <div class="form-element" [class.required]="config.required" [class.disabled]="!!config.disabled">
      <!-- Text Input -->
      <mat-form-field *ngIf="config.type === 'text-input'" appearance="outline" class="full-width">
        <mat-label>{{ config.label }}</mat-label>
        <input matInput 
               [formControl]="formControl"
               [placeholder]="config.placeholder || ''"
               [disabled]="!!config.disabled">
        <mat-hint *ngIf="config.helpText">{{ config.helpText }}</mat-hint>
        <mat-error *ngIf="formControl.hasError('required')">{{ config.label }} is required</mat-error>
      </mat-form-field>

      <!-- Email Input -->
      <mat-form-field *ngIf="config.type === 'email-input'" appearance="outline" class="full-width">
        <mat-label>{{ config.label }}</mat-label>
        <input matInput type="email"
               [formControl]="formControl"
               [placeholder]="config.placeholder || ''"
               [disabled]="!!config.disabled">
        <mat-icon matSuffix>email</mat-icon>
        <mat-hint *ngIf="config.helpText">{{ config.helpText }}</mat-hint>
        <mat-error *ngIf="formControl.hasError('required')">{{ config.label }} is required</mat-error>
        <mat-error *ngIf="formControl.hasError('email')">Please enter a valid email</mat-error>
      </mat-form-field>

      <!-- Password Input -->
      <mat-form-field *ngIf="config.type === 'password-input'" appearance="outline" class="full-width">
        <mat-label>{{ config.label }}</mat-label>
        <input matInput [type]="hidePassword ? 'password' : 'text'"
               [formControl]="formControl"
               [placeholder]="config.placeholder || ''"
               [disabled]="!!config.disabled">
        <button mat-icon-button matSuffix (click)="hidePassword = !hidePassword" type="button">
          <mat-icon>{{ hidePassword ? 'visibility_off' : 'visibility' }}</mat-icon>
        </button>
        <mat-hint *ngIf="config.helpText">{{ config.helpText }}</mat-hint>
        <mat-error *ngIf="formControl.hasError('required')">{{ config.label }} is required</mat-error>
      </mat-form-field>

      <!-- Number Input -->
      <mat-form-field *ngIf="config.type === 'number-input'" appearance="outline" class="full-width">
        <mat-label>{{ config.label }}</mat-label>
        <input matInput type="number"
               [formControl]="formControl"
               [placeholder]="config.placeholder || ''"
               [disabled]="!!config.disabled">
        <mat-hint *ngIf="config.helpText">{{ config.helpText }}</mat-hint>
        <mat-error *ngIf="formControl.hasError('required')">{{ config.label }} is required</mat-error>
      </mat-form-field>

      <!-- Textarea -->
      <mat-form-field *ngIf="config.type === 'textarea'" appearance="outline" class="full-width">
        <mat-label>{{ config.label }}</mat-label>
        <textarea matInput
                  [formControl]="formControl"
                  [placeholder]="config.placeholder || ''"
                  [disabled]="!!config.disabled"
                  rows="4">
        </textarea>
        <mat-hint *ngIf="config.helpText">{{ config.helpText }}</mat-hint>
        <mat-error *ngIf="formControl.hasError('required')">{{ config.label }} is required</mat-error>
      </mat-form-field>

      <!-- Select Dropdown -->
      <mat-form-field *ngIf="config.type === 'select'" appearance="outline" class="full-width">
        <mat-label>{{ config.label }}</mat-label>
        <mat-select [formControl]="formControl" [disabled]="!!config.disabled">
          <mat-option *ngFor="let option of config.options" [value]="option.value">
            {{ option.label }}
          </mat-option>
        </mat-select>
        <mat-hint *ngIf="config.helpText">{{ config.helpText }}</mat-hint>
        <mat-error *ngIf="formControl.hasError('required')">{{ config.label }} is required</mat-error>
      </mat-form-field>

      <!-- Checkbox -->
      <div *ngIf="config.type === 'checkbox'" class="checkbox-field">
        <mat-checkbox [formControl]="formControl" [disabled]="!!config.disabled">
          {{ config.label }}
        </mat-checkbox>
        <div *ngIf="config.helpText" class="help-text">{{ config.helpText }}</div>
      </div>

      <!-- Radio Group -->
      <div *ngIf="config.type === 'radio'" class="radio-group">
        <label class="field-label">{{ config.label }}</label>
        <mat-radio-group [formControl]="formControl" [disabled]="!!config.disabled">
          <mat-radio-button *ngFor="let option of config.options" [value]="option.value" class="radio-option">
            {{ option.label }}
          </mat-radio-button>
        </mat-radio-group>
        <div *ngIf="config.helpText" class="help-text">{{ config.helpText }}</div>
        <div *ngIf="formControl.hasError('required')" class="error-text">{{ config.label }} is required</div>
      </div>

      <!-- Date Input -->
      <mat-form-field *ngIf="config.type === 'date-input'" appearance="outline" class="full-width">
        <mat-label>{{ config.label }}</mat-label>
        <input matInput [matDatepicker]="picker"
               [formControl]="formControl"
               [disabled]="!!config.disabled">
        <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
        <mat-datepicker #picker></mat-datepicker>
        <mat-hint *ngIf="config.helpText">{{ config.helpText }}</mat-hint>
        <mat-error *ngIf="formControl.hasError('required')">{{ config.label }} is required</mat-error>
      </mat-form-field>

      <!-- File Input -->
      <div *ngIf="config.type === 'file-input'" class="file-input-field">
        <label class="field-label">{{ config.label }}</label>
        <input type="file" 
               (change)="onFileSelected($event)"
               [disabled]="!!config.disabled"
               [multiple]="config.multiple || false"
               style="display: none;" 
               #fileInput>
        <button mat-raised-button (click)="fileInput.click()" [disabled]="!!config.disabled">
          <mat-icon>upload_file</mat-icon>
          Choose File
        </button>
        <span *ngIf="selectedFileName" class="file-name">{{ selectedFileName }}</span>
        <div *ngIf="config.helpText" class="help-text">{{ config.helpText }}</div>
      </div>

      <!-- Submit Button -->
      <button *ngIf="config.type === 'submit-button'" 
              mat-raised-button 
              color="primary" 
              type="submit"
              [disabled]="!!config.disabled"
              (click)="onButtonClick('submit')">
        <mat-icon>send</mat-icon>
        {{ config.label }}
      </button>

      <!-- Reset Button -->
      <button *ngIf="config.type === 'reset-button'" 
              mat-raised-button 
              color="warn" 
              type="button"
              [disabled]="!!config.disabled"
              (click)="onButtonClick('reset')">
        <mat-icon>refresh</mat-icon>
        {{ config.label }}
      </button>

      <!-- Generic Button -->
      <button *ngIf="config.type === 'button'" 
              mat-raised-button 
              [disabled]="!!config.disabled"
              (click)="onButtonClick('custom')">
        <mat-icon *ngIf="config.icon">{{ config.icon }}</mat-icon>
        {{ config.label }}
      </button>
    </div>
  `,
  styles: [`
    .form-element {
      margin-bottom: 16px;
      width: 100%;
    }

    .full-width {
      width: 100%;
    }

    .checkbox-field {
      margin: 16px 0;
    }

    .radio-group {
      margin: 16px 0;
    }

    .field-label {
      display: block;
      font-weight: 500;
      font-size: 14px;
      margin-bottom: 8px;
      color: rgba(0, 0, 0, 0.87);
    }

    .radio-option {
      display: block;
      margin: 8px 0;
    }

    .file-input-field {
      margin: 16px 0;
    }

    .file-name {
      margin-left: 12px;
      font-size: 14px;
      color: rgba(0, 0, 0, 0.6);
    }

    .help-text {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.6);
      margin-top: 4px;
    }

    .error-text {
      font-size: 12px;
      color: #f44336;
      margin-top: 4px;
    }

    .required .field-label::after {
      content: ' *';
      color: #f44336;
    }

    .disabled {
      opacity: 0.6;
      pointer-events: none;
    }
  `]
})
export class FormElementRendererComponent implements OnInit {
  @Input() config!: FormElementConfig;
  @Input() formControl!: FormControl;
  @Output() buttonClick = new EventEmitter<{ type: string; config: FormElementConfig }>();
  @Output() fileSelected = new EventEmitter<{ files: FileList; config: FormElementConfig }>();

  hidePassword = true;
  selectedFileName = '';

  ngOnInit() {
    if (!this.formControl) {
      this.createFormControl();
    }
  }

  private createFormControl() {
    const validators = [];
    
    if (this.config.required) {
      validators.push(Validators.required);
    }

    if (this.config.type === 'email-input') {
      validators.push(Validators.email);
    }

    // Add custom validators from config
    if (this.config.validation) {
      validators.push(...this.config.validation);
    }

    this.formControl = new FormControl(
      { value: this.config.defaultValue || '', disabled: this.config.disabled },
      validators
    );
  }

  onFileSelected(event: any) {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.selectedFileName = files.length === 1 ? files[0].name : `${files.length} files selected`;
      this.fileSelected.emit({ files, config: this.config });
    }
  }

  onButtonClick(type: string) {
    this.buttonClick.emit({ type, config: this.config });
  }
}
