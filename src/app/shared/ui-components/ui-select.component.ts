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
  imports: [CommonModule, MaterialModule],  templateUrl: './ui-select.component.html',
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
