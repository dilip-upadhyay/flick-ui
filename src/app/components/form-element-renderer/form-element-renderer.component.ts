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
  templateUrl: './form-element-renderer.component.html',
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
  @Input() disabled: boolean = false;
  @Output() buttonClick = new EventEmitter<{ type: string; config: FormElementConfig }>();
  @Output() fileSelected = new EventEmitter<{ files: FileList; config: FormElementConfig }>();
  @Output() valueChange = new EventEmitter<any>();

  hidePassword = true;
  selectedFileName = '';

  ngOnInit() {
    if (!this.formControl) {
      this.createFormControl();
    }
    
    // Subscribe to value changes
    this.formControl.valueChanges.subscribe(value => {
      this.valueChange.emit(value);
    });
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
      { value: this.config.defaultValue || '', disabled: this.config.disabled || this.disabled },
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
