import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../material.module';

export type DatePickerAppearance = 'fill' | 'outline';

@Component({
  selector: 'ui-datepicker',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  template: `
    <mat-form-field 
      [appearance]="appearance"
      [class]="fieldClasses">
      <mat-label>{{ label }}
        <span *ngIf="required" class="required-indicator">*</span>
      </mat-label>
      <input 
        matInput
        [matDatepicker]="picker"
        [id]="id"
        [required]="required"
        [value]="value"
        (dateInput)="onDateInput($event)"
        (dateChange)="onDateChange($event)">
      <mat-hint *ngIf="hint">{{ hint }}</mat-hint>
      <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
      <mat-datepicker #picker></mat-datepicker>
      <mat-error *ngFor="let error of errors">{{ error }}</mat-error>
    </mat-form-field>
  `,
  styleUrls: ['./ui-datepicker.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UiDatepickerComponent),
      multi: true
    }
  ]
})
export class UiDatepickerComponent implements ControlValueAccessor {
  @Input() id!: string;
  @Input() label!: string;
  @Input() required = false;
  @Input() disabled = false;
  @Input() hint = '';
  @Input() errors: string[] = [];
  @Input() appearance: DatePickerAppearance = 'outline';
  @Input() fieldClasses = 'full-width';

  @Output() dateChanged = new EventEmitter<Date | null>();

  value: Date | null = null;
  
  private onChange = (value: Date | null) => {};
  private onTouched = () => {};

  // ControlValueAccessor implementation
  writeValue(value: Date | string | null): void {
    if (value) {
      this.value = typeof value === 'string' ? new Date(value) : value;
    } else {
      this.value = null;
    }
  }

  registerOnChange(fn: (value: Date | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  // Event handlers
  onDateInput(event: any): void {
    this.value = event.value;
    this.onChange(this.value);
  }

  onDateChange(event: any): void {
    this.value = event.value;
    this.onChange(this.value);
    this.onTouched();
    this.dateChanged.emit(this.value);
  }
}
