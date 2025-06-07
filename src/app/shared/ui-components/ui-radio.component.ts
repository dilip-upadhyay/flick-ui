import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../material.module';

export interface RadioOption {
  value: any;
  label: string;
  disabled?: boolean;
}

@Component({
  selector: 'ui-radio',
  standalone: true,
  imports: [CommonModule, MaterialModule],  templateUrl: './ui-radio.component.html',
  styleUrls: ['./ui-radio.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UiRadioComponent),
      multi: true
    }
  ]
})
export class UiRadioComponent implements ControlValueAccessor {
  @Input() id!: string;
  @Input() label = '';
  @Input() required = false;
  @Input() disabled = false;
  @Input() hint = '';
  @Input() errors: string[] = [];
  @Input() options: RadioOption[] = [];

  @Output() radioChange = new EventEmitter<any>();

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
  onRadioChange(event: any): void {
    this.value = event.value;
    this.onChange(this.value);
    this.onTouched();
    this.radioChange.emit(this.value);
  }
}
