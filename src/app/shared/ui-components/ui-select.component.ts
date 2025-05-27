import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../material.module';

export interface SelectOption {
  value: any;
  label: string;
  disabled?: boolean;
}

export type SelectAppearance = 'fill' | 'outline';

@Component({
  selector: 'ui-select',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  template: `
    <mat-form-field 
      [appearance]="appearance"
      [class]="fieldClasses">
      <mat-label>{{ label }}
        <span *ngIf="required" class="required-indicator">*</span>
      </mat-label>
      <mat-select 
        [id]="id"
        [required]="required"
        [value]="value"
        (selectionChange)="onSelectionChange($event)">
        <mat-option value="" disabled *ngIf="placeholder">{{ placeholder }}</mat-option>
        <mat-option 
          *ngFor="let option of options"
          [value]="option.value"
          [disabled]="option.disabled || false">
          {{ option.label }}
        </mat-option>
      </mat-select>
      <mat-hint *ngIf="hint">{{ hint }}</mat-hint>
      <mat-error *ngFor="let error of errors">{{ error }}</mat-error>
    </mat-form-field>
  `,
  styleUrls: ['./ui-select.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UiSelectComponent),
      multi: true
    }
  ]
})
export class UiSelectComponent implements ControlValueAccessor {
  @Input() id!: string;
  @Input() label!: string;
  @Input() placeholder = 'Select an option';
  @Input() required = false;
  @Input() disabled = false;
  @Input() hint = '';
  @Input() errors: string[] = [];
  @Input() options: SelectOption[] = [];
  @Input() appearance: SelectAppearance = 'outline';
  @Input() fieldClasses = 'full-width';

  @Output() selectionChanged = new EventEmitter<any>();

  value: any = '';
  
  private onChange = (value: any) => {};
  private onTouched = () => {};

  // ControlValueAccessor implementation
  writeValue(value: any): void {
    this.value = value;
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
  onSelectionChange(event: any): void {
    this.value = event.value;
    this.onChange(this.value);
    this.onTouched();
    this.selectionChanged.emit(this.value);
  }
}
