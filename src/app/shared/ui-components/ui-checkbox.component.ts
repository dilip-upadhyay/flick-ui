import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../material.module';

export interface CheckboxOption {
  value: any;
  label: string;
  disabled?: boolean;
}

@Component({
  selector: 'ui-checkbox',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  template: `
    <div class="checkbox-field">
      <div class="field-label" *ngIf="label">
        {{ label }}
        <span *ngIf="required" class="required-indicator">*</span>
      </div>
      
      <!-- Single checkbox (no options) -->
      <mat-checkbox 
        *ngIf="!options || options.length === 0"
        [id]="id"
        [checked]="value"
        (change)="onSingleCheckboxChange($event)"
        class="checkbox-item">
        {{ checkboxLabel || label }}
      </mat-checkbox>
      
      <!-- Multiple checkboxes (with options) -->
      <div *ngIf="options && options.length > 0" class="checkbox-group">
        <mat-checkbox 
          *ngFor="let option of options; let i = index"
          [id]="id + '_' + i"
          [value]="option.value"
          [checked]="isOptionChecked(option.value)"
          [disabled]="option.disabled"
          (change)="onMultipleCheckboxChange(option.value, $event)"
          class="checkbox-item">
          {{ option.label }}
        </mat-checkbox>
      </div>
      
      <div *ngIf="hint" class="field-hint">{{ hint }}</div>
      <div *ngIf="errors.length > 0" class="field-errors">
        <div *ngFor="let error of errors" class="error-message">{{ error }}</div>
      </div>
    </div>
  `,
  styleUrls: ['./ui-checkbox.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UiCheckboxComponent),
      multi: true
    }
  ]
})
export class UiCheckboxComponent implements ControlValueAccessor {
  @Input() id!: string;
  @Input() label = '';
  @Input() checkboxLabel = '';
  @Input() required = false;
  @Input() disabled = false;
  @Input() hint = '';
  @Input() errors: string[] = [];
  @Input() options: CheckboxOption[] = [];

  @Output() checkboxChange = new EventEmitter<any>();

  value: any = false;
  
  private onChange = (value: any) => {};
  private onTouched = () => {};

  // ControlValueAccessor implementation
  writeValue(value: any): void {
    if (this.options && this.options.length > 0) {
      // Multiple checkboxes - value should be an array
      this.value = Array.isArray(value) ? value : [];
    } else {
      // Single checkbox - value should be boolean
      this.value = !!value;
    }
  }

  registerOnChange(fn: (value: any) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  // Event handlers
  onSingleCheckboxChange(event: any): void {
    this.value = event.checked;
    this.onChange(this.value);
    this.onTouched();
    this.checkboxChange.emit(this.value);
  }

  onMultipleCheckboxChange(optionValue: any, event: any): void {
    if (!Array.isArray(this.value)) {
      this.value = [];
    }

    if (event.checked) {
      // Add value if checked and not already present
      if (!this.value.includes(optionValue)) {
        this.value = [...this.value, optionValue];
      }
    } else {
      // Remove value if unchecked
      this.value = this.value.filter((val: any) => val !== optionValue);
    }

    this.onChange(this.value);
    this.onTouched();
    this.checkboxChange.emit(this.value);
  }

  isOptionChecked(optionValue: any): boolean {
    if (!Array.isArray(this.value)) {
      return false;
    }
    return this.value.includes(optionValue);
  }
}
