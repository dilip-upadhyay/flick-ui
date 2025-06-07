import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../material.module';

export type DatePickerAppearance = 'fill' | 'outline';

@Component({
  selector: 'ui-datepicker',
  standalone: true,
  imports: [CommonModule, MaterialModule],  templateUrl: './ui-datepicker.component.html',
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
